import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import type { RowDataPacket } from 'mysql2/promise'
import { assertIntegrationDatabaseSafety } from '../../vitest.integration.config.js'

assertIntegrationDatabaseSafety()
const { app } = await import('../../src/app.js')
const { pool } = await import('../../src/db/pool.js')
const api = '/api/v1'
const email = `recovery-${randomUUID()}@example.test`
const password = 'RecoveryTest123'
const newPassword = 'RecoveryChanged456'
let token: string
let cookie: string
let codes: string[]
let id: string
const auth = () => ({ Authorization: `Bearer ${token}` })
const reset = (code: string, account = email) => request(app).post(api + '/auth/reset-password').send({ email: account, recoveryCode: code, newPassword })
afterAll(async () => { await pool.end() })

describe.sequential('Offline recovery and sourced showcase', () => {
  it('registers an isolated account and protects recovery setup', async () => {
    const result = await request(app).post(api + '/auth/register/customer').send({ email, password, fullName: 'Recovery QA' }).expect(201)
    token = result.body.data.accessToken
    id = result.body.data.user.id
    const cookies = result.headers['set-cookie'] as string[] | undefined
    const refresh = cookies?.find(value => value.startsWith('laperu_refresh_token='))?.split(';')[0]
    if (!refresh) throw new Error('Registration must return a refresh cookie')
    cookie = refresh
    await request(app).post(api + '/auth/recovery-codes').send({ currentPassword: password }).expect(401)
    await request(app).post(api + '/auth/recovery-codes').set(auth()).send({ currentPassword: 'WrongPassword123' }).expect(403)
  })
  it('returns five unique secrets once, stores only hashes, disables caching', async () => {
    const result = await request(app).post(api + '/auth/recovery-codes').set(auth()).send({ currentPassword: password }).expect(201)
    codes = result.body.data.codes
    expect(new Set(codes).size).toBe(5)
    expect(codes.every(code => /^([A-F0-9]{4}-){7}[A-F0-9]{4}$/.test(code))).toBe(true)
    expect(result.headers['cache-control']).toBe('no-store')
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT code_hash FROM recovery_codes WHERE user_id = ?', [id])
    expect(rows).toHaveLength(5)
    expect(rows.every(row => /^[a-f0-9]{64}$/.test(row.code_hash))).toBe(true)
    expect(JSON.stringify(rows)).not.toContain(codes[0])
  })
  it('does not reveal whether an email exists; rejects weak password', async () => {
    const wrong = await reset('INVALID').expect(400)
    const unknown = await reset('INVALID', 'absent@example.test').expect(400)
    expect(wrong.body).toEqual(unknown.body)
    await request(app).post(api + '/auth/reset-password').send({ email, recoveryCode: codes[0], newPassword: 'a' }).expect(422)
  })
  it('regeneration invalidates previous codes', async () => {
    const previous = codes[0]!
    const result = await request(app).post(api + '/auth/recovery-codes').set(auth()).send({ currentPassword: password }).expect(201)
    codes = result.body.data.codes
    await reset(previous).expect(400)
  })
  it('consumes a recovery set exactly once under concurrent requests', async () => {
    const results = await Promise.all([reset(codes[0]!), reset(codes[0]!)])
    expect(results.map(result => result.status).sort()).toEqual([200, 400])
    await reset(codes[1]!).expect(400)
    await request(app).get(api + '/auth/me').set(auth()).expect(401)
    await request(app).post(api + '/auth/refresh').set('Cookie', cookie).expect(401)
    await request(app).post(api + '/auth/login').send({ email, password }).expect(401)
    const result = await request(app).post(api + '/auth/login').send({ email, password: newPassword }).expect(200)
    token = result.body.data.accessToken
  })
  it('requires current password to change it and invalidates the current JWT', async () => {
    await request(app).post(api + '/auth/change-password').set(auth()).send({ currentPassword: password, newPassword: 'AnotherPassword123' }).expect(403)
    await request(app).post(api + '/auth/change-password').set(auth()).send({ currentPassword: newPassword, newPassword: 'AnotherPassword123' }).expect(200)
    await request(app).get(api + '/auth/me').set(auth()).expect(401)
  })
  it('serializes reset against refresh without leaving an authorized old session', async () => {
    const result = await request(app).post(api + '/auth/login').send({ email, password: 'AnotherPassword123' }).expect(200)
    token = result.body.data.accessToken
    const cookies = result.headers['set-cookie'] as string[] | undefined
    const refresh = cookies?.find(value => value.startsWith('laperu_refresh_token='))?.split(';')[0]
    if (!refresh) throw new Error('Login must return a refresh cookie')
    const generated = await request(app).post(api + '/auth/recovery-codes').set(auth()).send({ currentPassword: 'AnotherPassword123' }).expect(201)
    const [recovered, refreshed] = await Promise.all([
      reset(generated.body.data.codes[0]),
      request(app).post(api + '/auth/refresh').set('Cookie', refresh),
    ])
    expect(recovered.status).toBe(200)
    expect([200, 401]).toContain(refreshed.status)
    if (refreshed.status === 200) {
      await request(app).get(api + '/auth/me').set('Authorization', `Bearer ${refreshed.body.data.accessToken}`).expect(401)
    }
  })
  it('does not bypass account suspension with a valid recovery code', async () => {
    const result = await request(app).post(api + '/auth/login').send({ email, password: newPassword }).expect(200)
    token = result.body.data.accessToken
    const generated = await request(app).post(api + '/auth/recovery-codes').set(auth()).send({ currentPassword: newPassword }).expect(201)
    await pool.execute("UPDATE users SET status = 'SUSPENDED' WHERE id = ?", [id])
    await reset(generated.body.data.codes[0]).expect(400)
  })
  it('keeps public references distinct from simulated activity after repeated seeding', async () => {
    const references = await request(app).get(api + '/warungs?dataset=reference&limit=50').expect(200)
    const simulated = await request(app).get(api + '/warungs?dataset=simulation&limit=50').expect(200)
    expect(references.body.data.items).toHaveLength(16)
    expect(simulated.body.data.items).toHaveLength(12)
    for (const item of references.body.data.items) {
      expect(item.dataKind).toBe('PUBLIC_REFERENCE')
      expect(item.sourceCheckedOn).toBe('2026-10-29')
      expect(item.sourceUrl).toMatch(/^https:\/\/canteen\.telkomuniversity\.ac\.id\//)
      expect(item.isOpen).toBeNull()
      expect(Number(item.reviewCount)).toBe(0)
    }
    const detail = await request(app).get(api + '/warungs/' + references.body.data.items[0].slug).expect(200)
    expect(detail.body.data.sourceCheckedOn).toBe('2026-10-29')
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT
      (SELECT COUNT(*) FROM menu_items m JOIN listing_sources s ON s.warung_id=m.warung_id WHERE s.data_kind='SIMULATION') AS menus,
      (SELECT COUNT(*) FROM reviews r JOIN listing_sources s ON s.warung_id=r.warung_id WHERE s.data_kind='SIMULATION') AS reviews,
      (SELECT COUNT(*) FROM favorites f JOIN listing_sources s ON s.warung_id=f.warung_id WHERE s.data_kind='SIMULATION') AS favorites,
      (SELECT COUNT(*) FROM warung_profile_views v JOIN listing_sources s ON s.warung_id=v.warung_id WHERE s.data_kind='SIMULATION') AS views`)
    expect(rows[0]).toMatchObject({ menus: 96, reviews: 180, favorites: 216, views: 360 })
  })
})
