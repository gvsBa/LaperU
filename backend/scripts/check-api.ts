import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { env } from '../src/config/env.js'

const origin = new URL(env.PUBLIC_API_ORIGIN)
if (!['127.0.0.1', 'localhost'].includes(origin.hostname) || origin.protocol !== 'http:' || env.NODE_ENV === 'production') {
  throw new Error('Pemeriksaan ini hanya untuk API lokal non-production.')
}
const base = origin.origin + '/api/v1'
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(base + path, { ...options, redirect: 'error', signal: AbortSignal.timeout(10_000) })
  assert.equal(response.status, 200, `Status API tidak sesuai: ${path}`)
  const body: unknown = await response.json()
  const envelope = z.object({ success: z.literal(true), data: z.unknown() }).parse(body)
  return { data: envelope.data, headers: response.headers }
}
try {
  await api('/health')
  await api('/health/database')
  console.log('PASS: API hasil build dan koneksi database')
  const accounts = z.array(z.object({ email: z.email(), password: z.string(), role: z.enum(['CUSTOMER', 'UMKM']) }))
    .parse(JSON.parse(await readFile(new URL('../.demo-accounts.local.json', import.meta.url), 'utf8')))
  const routes = { ADMIN: '/admin/dashboard', CUSTOMER: '/customer/favorites', UMKM: '/umkm/warung' }
  for (const account of [{ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, role: 'ADMIN' as const }, ...accounts]) {
    const login = await api('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: account.email, password: account.password }) })
    const data = z.object({ accessToken: z.string(), user: z.object({ role: z.string() }) }).parse(login.data)
    const cookie = login.headers.getSetCookie().find(item => item.startsWith('laperu_refresh_token='))?.split(';')[0]
    assert.ok(cookie, 'Cookie refresh tidak tersedia')
    try {
      assert.equal(data.user.role, account.role)
      const headers = { authorization: 'Bearer ' + data.accessToken }
      await api('/auth/me', { headers })
      await api(routes[account.role], { headers })
      console.log(`PASS: login, identitas dan endpoint ${account.role}`)
    } finally {
      await api('/auth/logout', { method: 'POST', headers: { cookie } })
    }
  }
  const catalogue = z.object({ items: z.array(z.object({ dataKind: z.string().nullable(), reviewCount: z.coerce.number(), isOpen: z.unknown() })), pagination: z.object({ total: z.number() }) })
  const references = catalogue.parse((await api('/warungs?dataset=reference&limit=50')).data)
  const simulation = catalogue.parse((await api('/warungs?dataset=simulation&limit=50')).data)
  assert.equal(references.pagination.total, 16)
  assert.equal(simulation.pagination.total, 12)
  assert.ok(references.items.every(item => item.dataKind === 'PUBLIC_REFERENCE' && item.reviewCount === 0 && item.isOpen === null))
  console.log('PASS: 16 referensi tanpa ulasan palsu/jam rekaan; 12 usaha simulasi terpisah')
  console.log('INFO: Hanya sesi pemeriksaan dibuat/dilogout. Tidak mengubah password atau data bisnis. Ini pengujian API, bukan integrasi frontend.')
} catch {
  console.error('FAIL: pemeriksaan API lokal. Pastikan server aktif, konfigurasi/akun demo cocok, seed tersedia dan batas login belum terlampaui. Detail kredensial tidak dicetak.')
  process.exitCode = 1
}
