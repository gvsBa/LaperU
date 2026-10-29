import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request, { type Response } from 'supertest'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { assertIntegrationDatabaseSafety } from '../../vitest.integration.config.js'

// Also guard direct collection through another Vitest config. No app/DB module
// is imported until this passes. dotenv in env.ts cannot override these values.
assertIntegrationDatabaseSafety()
const runId = randomUUID().replaceAll('-', '')
process.env.UPLOAD_DIRECTORY = path.join(process.env.UPLOAD_DIRECTORY ?? path.join(tmpdir(), 'laperu-integration-uploads'), runId)
process.env.IMAGE_MAX_BYTES = String(2 * 1024 * 1024)
const { app } = await import('../../src/app.js')
const { pool } = await import('../../src/db/pool.js')
const { logger } = await import('../../src/config/logger.js')
const databaseErrors: string[] = []
vi.spyOn(logger, 'error').mockImplementation((error: unknown) => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const code = 'code' in error ? String(error.code) : 'ERROR'
    databaseErrors.push(`${code}: ${String(error.message)}`)
  }
})

const api = '/api/v1'
const password = 'IntegrationTest123'
const businessName = `QA Warung ${runId}`
const address = 'Jalan Telekomunikasi No. 1, Bandung'
const revisionNote = 'Mohon lengkapi deskripsi jenis usaha.'
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII=', 'base64')
const customerInput = { email: `customer-${runId}@example.test`, fullName: `QA Customer ${runId}`, password }
const umkmInput = {
  email: `umkm-${runId}@example.test`, fullName: `QA Owner ${runId}`, password,
  businessName, ownerName: 'QA Owner', phone: '081234567890', address,
}

interface Reference { id: string; name: string; slug: string }
interface Session { accessToken: string; user: { id: string; role: string; status: string; email: string } }
let adminToken: string
let customer: Session
let customerOther: Session
let owner: Session
let ownerOther: Session
let category: Reference
let facility: Reference
let payment: Reference
let imageUrl: string
let submissionId: string
let warungId: string
let slug: string
let menuId: string
let reviewId: string

function auth(token: string) { return { Authorization: `Bearer ${token}` } }
function refreshCookie(response: Response) {
  const headers = response.headers['set-cookie'] as string[] | undefined
  const cookie = headers?.find((item) => item.startsWith('laperu_refresh_token='))?.split(';')[0]
  expect(cookie, 'response must set a refresh cookie').toBeTruthy()
  return cookie!
}
function expectCode(response: Response, status: number, code: string) {
  expect(response.status, JSON.stringify(response.body)).toBe(status)
  expect(response.body).toMatchObject({ success: false, code })
}
function expectItem(response: Response, id: string) {
  expect(response.status, JSON.stringify(response.body)).toBe(200)
  expect(response.body.data.items).toEqual(expect.arrayContaining([expect.objectContaining({ id })]))
}
async function getSubmissionId(token: string) {
  const result = await request(app).get(`${api}/umkm/application`).set(auth(token)).expect(200)
  expect(result.body.data.profileId).toBe(result.body.data.id)
  expect(result.body.data.submissionId).toEqual(expect.any(String))
  expect(result.body.data.submissionId).not.toBe(result.body.data.profileId)
  return result.body.data.submissionId as string
}

afterAll(async () => { await pool.end() })

// This is one sequential cross-role journey. It intentionally retains uniquely
// named QA records/uploads for inspection for manual runs, and never drops or
// truncates data itself. The local runner cleans up its own temporary instance.
describe.sequential('API + real SQL database: isolated cross-role core journey', () => {
  it('01 connects to SQL, reads seeded reference data and authenticates the QA admin', async () => {
    await request(app).get(`${api}/health/database`).expect(200)
    const meta = await request(app).get(`${api}/meta`).expect(200)
    expect(meta.body.success).toBe(true)
    expect(meta.body.data.categories.length).toBeGreaterThan(0)
    expect(meta.body.data.facilities.length).toBeGreaterThan(0)
    expect(meta.body.data.paymentMethods.length).toBeGreaterThan(0)
    category = meta.body.data.categories[0]
    facility = meta.body.data.facilities[0]
    payment = meta.body.data.paymentMethods[0]
    const login = await request(app).post(`${api}/auth/login`).send({
      email: process.env.ADMIN_EMAIL ?? 'qa-admin@example.test',
      password: process.env.ADMIN_PASSWORD ?? 'QaAdmin12345',
    }).expect(200)
    expect(login.body.data.user.role).toBe('ADMIN')
    expect(login.body.data.user).not.toHaveProperty('passwordHash')
    adminToken = login.body.data.accessToken
  })

  it('02 registers distinct customers, rejects a duplicate email and rejects invalid input', async () => {
    const registration = await request(app).post(`${api}/auth/register/customer`)
      .set('User-Agent', 'QA'.repeat(600)).send({ ...customerInput, role: 'ADMIN', status: 'ACTIVE' }).expect(201)
    customer = registration.body.data
    expect(customer.user).toMatchObject({ role: 'CUSTOMER', status: 'ACTIVE', email: customerInput.email })
    expect(customer.accessToken).toEqual(expect.any(String))
    expect(customer.user).not.toHaveProperty('passwordHash')
    expect(registration.headers['set-cookie']).toEqual(expect.arrayContaining([expect.stringContaining('HttpOnly')]))
    const [metadata] = await pool.query('SELECT CHAR_LENGTH(user_agent) AS length FROM refresh_tokens WHERE user_id = ?', [customer.user.id])
    expect(metadata).toEqual(expect.arrayContaining([expect.objectContaining({ length: 500 })]))
    const duplicate = await request(app).post(`${api}/auth/register/customer`).send(customerInput)
    expectCode(duplicate, 409, 'EMAIL_EXISTS')
    const invalid = await request(app).post(`${api}/auth/register/customer`).send({ ...customerInput, email: 'invalid', password: 'short' })
    expectCode(invalid, 422, 'VALIDATION_ERROR')
    const other = await request(app).post(`${api}/auth/register/customer`).send({
      ...customerInput, email: `other-customer-${runId}@example.test`, fullName: 'QA Other Customer',
    }).expect(201)
    customerOther = other.body.data
    expect(customerOther.user.id).not.toBe(customer.user.id)
  })

  it('03 verifies login, access-token identity, refresh rotation, replay rejection and logout', async () => {
    const wrong = await request(app).post(`${api}/auth/login`).send({ email: customerInput.email, password: 'WrongPassword123' })
    expectCode(wrong, 401, 'INVALID_CREDENTIALS')
    const login = await request(app).post(`${api}/auth/login`).send({ email: customerInput.email, password }).expect(200)
    expect(login.body.data.user.id).toBe(customer.user.id)
    const originalCookie = refreshCookie(login)
    const me = await request(app).get(`${api}/auth/me`).set(auth(login.body.data.accessToken)).expect(200)
    expect(me.body.data).toMatchObject({ id: customer.user.id, email: customerInput.email, role: 'CUSTOMER' })
    expectCode(await request(app).get(`${api}/auth/me`).set(auth('not-a-token')), 401, 'INVALID_ACCESS_TOKEN')
    const refreshed = await request(app).post(`${api}/auth/refresh`).set('Cookie', originalCookie).expect(200)
    const rotatedCookie = refreshCookie(refreshed)
    expect(rotatedCookie).not.toBe(originalCookie)
    expect(refreshed.body.data.user.id).toBe(customer.user.id)
    expectCode(await request(app).post(`${api}/auth/refresh`).set('Cookie', originalCookie), 401, 'INVALID_REFRESH_TOKEN')
    await request(app).post(`${api}/auth/logout`).set('Cookie', rotatedCookie).expect(200)
    expectCode(await request(app).post(`${api}/auth/refresh`).set('Cookie', rotatedCookie), 401, 'INVALID_REFRESH_TOKEN')
    expectCode(await request(app).post(`${api}/auth/refresh`), 401, 'MISSING_REFRESH_TOKEN')
  })

  it('04 enforces guest/customer/admin role boundaries', async () => {
    await request(app).get(`${api}/warungs`).expect(200)
    expectCode(await request(app).get(`${api}/customer/favorites`), 401, 'UNAUTHENTICATED')
    expectCode(await request(app).get(`${api}/admin/dashboard`).set(auth(customer.accessToken)), 403, 'FORBIDDEN')
    expectCode(await request(app).get(`${api}/umkm/application`).set(auth(customer.accessToken)), 403, 'FORBIDDEN')
    expectCode(await request(app).get(`${api}/customer/favorites`).set(auth(adminToken)), 403, 'FORBIDDEN')
    await request(app).get(`${api}/admin/dashboard`).set(auth(adminToken)).expect(200)
  })

  it('04b allows only one concurrent use of the same refresh token', async () => {
    for (let round = 0; round < 5; round++) {
    const session = await request(app).post(`${api}/auth/login`).send({ email: customerInput.email, password }).expect(200)
    const cookie = refreshCookie(session)
    const responses = await Promise.all([
      request(app).post(`${api}/auth/refresh`).set('Cookie', cookie),
      request(app).post(`${api}/auth/refresh`).set('Cookie', cookie),
    ])
    expect(responses.map((response) => response.status).sort(), databaseErrors.join('\n')).toEqual([200, 401])
    expectCode(responses.find((response) => response.status === 401)!, 401, 'INVALID_REFRESH_TOKEN')
    await request(app).post(`${api}/auth/logout`).set('Cookie', refreshCookie(responses.find((response) => response.status === 200)!)).expect(200)
    }
  })

  it('05 registers UMKM as DRAFT/PENDING and blocks incomplete submission and premature warung access', async () => {
    const registration = await request(app).post(`${api}/auth/register/umkm`).send(umkmInput).expect(201)
    owner = registration.body.data
    expect(owner.user).toMatchObject({ role: 'UMKM', status: 'PENDING' })
    const application = await request(app).get(`${api}/umkm/application`).set(auth(owner.accessToken)).expect(200)
    expect(application.body.data).toMatchObject({ businessName, status: 'DRAFT', storefrontPhotoUrl: null })
    expectCode(await request(app).post(`${api}/umkm/application/submit`).set(auth(owner.accessToken)), 422, 'APPLICATION_INCOMPLETE')
    expectCode(await request(app).get(`${api}/umkm/warung`).set(auth(owner.accessToken)), 404, 'WARUNG_NOT_READY')
    expectCode(await request(app).post(`${api}/umkm/menus`).set(auth(owner.accessToken)).send({ name: 'Nasi QA', price: 15000 }), 409, 'WARUNG_NOT_READY')
    expectCode(await request(app).get(`${api}/admin/applications`).set(auth(owner.accessToken)), 403, 'FORBIDDEN')
    expectCode(await request(app).get(`${api}/customer/favorites`).set(auth(owner.accessToken)), 403, 'FORBIDDEN')
    const other = await request(app).post(`${api}/auth/register/umkm`).send({
      ...umkmInput, email: `other-umkm-${runId}@example.test`, businessName: `Other QA ${runId}`,
    }).expect(201)
    ownerOther = other.body.data
  })

  it('06 accepts a PNG, rejects oversize/spoofed uploads, submits complete data and locks pending edits', async () => {
    const uploaded = await request(app).post(`${api}/umkm/uploads/images`).set(auth(owner.accessToken))
      .attach('image', png, { filename: 'qa-storefront.png', contentType: 'image/png' }).expect(201)
    expect(uploaded.body.data).toMatchObject({ mimeType: 'image/png', size: png.length })
    imageUrl = uploaded.body.data.url
    const staticImage = await request(app).get(new URL(imageUrl).pathname).expect(200)
    expect(staticImage.body).toEqual(png)
    const oversize = await request(app).post(`${api}/umkm/uploads/images`).set(auth(owner.accessToken))
      .attach('image', Buffer.alloc(2 * 1024 * 1024 + 1, 1), { filename: 'oversize.png', contentType: 'image/png' })
    expectCode(oversize, 413, 'IMAGE_TOO_LARGE')
    const fake = await request(app).post(`${api}/umkm/uploads/images`).set(auth(owner.accessToken))
      .attach('image', Buffer.from('not a real image'), { filename: 'fake.png', contentType: 'image/png' })
    expectCode(fake, 422, 'INVALID_IMAGE_CONTENT')
    await request(app).patch(`${api}/umkm/application`).set(auth(owner.accessToken)).send({ storefrontPhotoUrl: imageUrl }).expect(200)
    const submissions = await Promise.all([
      request(app).post(`${api}/umkm/application/submit`).set(auth(owner.accessToken)),
      request(app).post(`${api}/umkm/application/submit`).set(auth(owner.accessToken)),
    ])
    expect(submissions.map((response) => response.status).sort(), databaseErrors.join('\n')).toEqual([200, 409])
    expectCode(submissions.find((response) => response.status === 409)!, 409, 'APPLICATION_LOCKED')
    const pending = await request(app).get(`${api}/umkm/application`).set(auth(owner.accessToken)).expect(200)
    expect(pending.body.data).toMatchObject({ status: 'PENDING', storefrontPhotoUrl: imageUrl })
    expectCode(await request(app).patch(`${api}/umkm/application`).set(auth(owner.accessToken)).send({ businessType: 'Warung makan' }), 409, 'APPLICATION_LOCKED')
    const hidden = await request(app).get(`${api}/warungs`).query({ q: businessName }).expect(200)
    expect(hidden.body.data.items).toHaveLength(0)
  })

  it('07 requires a revision reason and exposes the admin decision to the correct UMKM', async () => {
    submissionId = await getSubmissionId(owner.accessToken)
    const list = await request(app).get(`${api}/admin/applications`).set(auth(adminToken)).query({ status: 'PENDING' }).expect(200)
    expect(list.body.data.pagination.total).toBeGreaterThan(0)
    const detail = await request(app).get(`${api}/admin/applications/${submissionId}`).set(auth(adminToken)).expect(200)
    expect(detail.body.data).toMatchObject({ id: submissionId, userId: owner.user.id, status: 'PENDING', email: umkmInput.email })
    expectCode(await request(app).post(`${api}/admin/applications/${submissionId}/decision`).set(auth(adminToken))
      .send({ decision: 'REVISION' }), 422, 'VALIDATION_ERROR')
    await request(app).post(`${api}/admin/applications/${submissionId}/decision`).set(auth(adminToken))
      .send({ decision: 'REVISION', note: revisionNote }).expect(200)
    const revision = await request(app).get(`${api}/umkm/application`).set(auth(owner.accessToken)).expect(200)
    expect(revision.body.data).toMatchObject({ status: 'REVISION', adminNote: revisionNote })
    const other = await request(app).get(`${api}/umkm/application`).set(auth(ownerOther.accessToken)).expect(200)
    expect(other.body.data).toMatchObject({ status: 'DRAFT', adminNote: null })
  })

  it('08 revises/resubmits, approves once, activates the owner and creates distinct owned warungs', async () => {
    await request(app).patch(`${api}/umkm/application`).set(auth(owner.accessToken)).send({ businessType: 'Warung makan mahasiswa' }).expect(200)
    await request(app).post(`${api}/umkm/application/submit`).set(auth(owner.accessToken)).expect(200)
    const pending = await request(app).get(`${api}/umkm/application`).set(auth(owner.accessToken)).expect(200)
    expect(pending.body.data).toMatchObject({ status: 'PENDING', adminNote: null })
    await request(app).post(`${api}/admin/applications/${submissionId}/decision`).set(auth(adminToken)).send({ decision: 'APPROVED' }).expect(200)
    expectCode(await request(app).post(`${api}/admin/applications/${submissionId}/decision`).set(auth(adminToken))
      .send({ decision: 'APPROVED' }), 409, 'APPLICATION_NOT_PENDING')
    const me = await request(app).get(`${api}/auth/me`).set(auth(owner.accessToken)).expect(200)
    expect(me.body.data.status).toBe('ACTIVE')
    const warung = await request(app).get(`${api}/umkm/warung`).set(auth(owner.accessToken)).expect(200)
    expect(warung.body.data).toMatchObject({ name: businessName, approvalStatus: 'APPROVED', isActive: 1 })
    warungId = warung.body.data.id
    slug = warung.body.data.slug
    expect(warung.body.data.photos).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'STOREFRONT', url: imageUrl })]))
    // A second approved owner is needed to test ownership, not just role access.
    await request(app).patch(`${api}/umkm/application`).set(auth(ownerOther.accessToken)).send({ storefrontPhotoUrl: imageUrl }).expect(200)
    await request(app).post(`${api}/umkm/application/submit`).set(auth(ownerOther.accessToken)).expect(200)
    const otherSubmission = await getSubmissionId(ownerOther.accessToken)
    await request(app).post(`${api}/admin/applications/${otherSubmission}/decision`).set(auth(adminToken)).send({ decision: 'APPROVED' }).expect(200)
    const otherWarung = await request(app).get(`${api}/umkm/warung`).set(auth(ownerOther.accessToken)).expect(200)
    expect(otherWarung.body.data.id).not.toBe(warungId)
  })

  it('09 updates the owned profile/menu and prevents another UMKM from editing or deleting that menu', async () => {
    await request(app).put(`${api}/umkm/warung`).set(auth(owner.accessToken)).send({
      description: 'Warung QA untuk integration testing', latitude: -6.974, longitude: 107.632,
      priceMin: 10000, priceMax: 20000, categoryId: category.id, statusOverride: 'OPEN',
    }).expect(200)
    expectCode(await request(app).post(`${api}/umkm/menus`).set(auth(owner.accessToken)).send({ name: 'Nasi QA', price: -1 }), 422, 'VALIDATION_ERROR')
    const menu = await request(app).post(`${api}/umkm/menus`).set(auth(owner.accessToken))
      .send({ name: `Nasi ${runId}`, price: 12000, photoUrl: imageUrl }).expect(201)
    menuId = menu.body.data.id
    await request(app).patch(`${api}/umkm/menus/${menuId}`).set(auth(owner.accessToken)).send({ price: 15000, isAvailable: true }).expect(200)
    expectCode(await request(app).patch(`${api}/umkm/menus/${menuId}`).set(auth(ownerOther.accessToken)).send({ price: 1 }), 404, 'MENU_NOT_FOUND')
    expectCode(await request(app).delete(`${api}/umkm/menus/${menuId}`).set(auth(ownerOther.accessToken)), 404, 'MENU_NOT_FOUND')
    const ownMenus = await request(app).get(`${api}/umkm/menus`).set(auth(owner.accessToken)).expect(200)
    expect(ownMenus.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: menuId, price: 15000 })]))
    const otherMenus = await request(app).get(`${api}/umkm/menus`).set(auth(ownerOther.accessToken)).expect(200)
    expect(otherMenus.body.data).toHaveLength(0)
  })

  it('10 persists all seven operating days, facilities, payment methods and a storefront photo', async () => {
    const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, openTime: '08:00', closeTime: '20:00', isClosed: false }))
    await request(app).put(`${api}/umkm/operating-hours`).set(auth(owner.accessToken)).send({ hours }).expect(200)
    expectCode(await request(app).put(`${api}/umkm/operating-hours`).set(auth(owner.accessToken))
      .send({ hours: hours.map((day) => ({ ...day, dayOfWeek: 0 })) }), 422, 'VALIDATION_ERROR')
    await request(app).put(`${api}/umkm/facilities`).set(auth(owner.accessToken)).send({ ids: [facility.id] }).expect(200)
    await request(app).put(`${api}/umkm/payment-methods`).set(auth(owner.accessToken)).send({ ids: [payment.id] }).expect(200)
    await request(app).post(`${api}/umkm/photos`).set(auth(owner.accessToken)).send({ url: imageUrl, type: 'STOREFRONT', altText: 'Warung QA' }).expect(201)
    const warung = await request(app).get(`${api}/umkm/warung`).set(auth(owner.accessToken)).expect(200)
    expect(warung.body.data.categoryId).toBe(category.id)
    expect(warung.body.data.hours).toHaveLength(7)
    expect(warung.body.data.hours.map((item: { dayOfWeek: number }) => item.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(warung.body.data.hours[0]).toMatchObject({ openTime: '08:00:00', closeTime: '20:00:00', isClosed: 0 })
    expect(warung.body.data.facilities).toEqual([facility])
    expect(warung.body.data.paymentMethods).toEqual([payment])
    expect(warung.body.data.photos).toEqual(expect.arrayContaining([expect.objectContaining({ url: imageUrl, type: 'STOREFRONT' })]))
  })

  it('11 serves public search/filter/radius/detail with seeded relations and excludes nonmatching filters', async () => {
    const list = await request(app).get(`${api}/warungs`).query({
      q: businessName, category: category.slug, facility: facility.slug, payment: payment.slug,
      minPrice: 10000, maxPrice: 20000, openNow: 'true', latitude: -6.974, longitude: 107.632, radiusKm: 1,
    })
    expectItem(list, warungId)
    expect(list.body.data.items).toHaveLength(1)
    expect(list.body.data.items[0]).toMatchObject({ isOpen: 1, distanceKm: 0 })
    expect(list.body.data.pagination).toMatchObject({ page: 1, total: 1, totalPages: 1 })
    const byMenu = await request(app).get(`${api}/warungs`).query({ q: `Nasi ${runId}` })
    expectItem(byMenu, warungId)
    const tooFar = await request(app).get(`${api}/warungs`).query({ q: businessName, latitude: -6.2, longitude: 106.8, radiusKm: 1 }).expect(200)
    expect(tooFar.body.data.items).toHaveLength(0)
    const tooCheap = await request(app).get(`${api}/warungs`).query({ q: businessName, maxPrice: 9999 }).expect(200)
    expect(tooCheap.body.data.items).toHaveLength(0)
    expectCode(await request(app).get(`${api}/warungs`).query({ latitude: -6.974 }), 422, 'VALIDATION_ERROR')
    const detail = await request(app).get(`${api}/warungs/${slug}`).expect(200)
    expect(detail.body.data).toMatchObject({ id: warungId, name: businessName })
    expect(detail.body.data.menus).toEqual(expect.arrayContaining([expect.objectContaining({ id: menuId, price: 15000 })]))
    expect(detail.body.data.facilities).toEqual([{ name: facility.name, slug: facility.slug }])
    expect(detail.body.data.payments).toEqual([{ name: payment.name, slug: payment.slug }])
    expect(new URL(detail.body.data.mapUrl).searchParams.get('destination')).toBe('-6.974,107.632')
  })

  it('12 keeps favorites idempotent and scoped to the customer who saved them', async () => {
    await request(app).post(`${api}/customer/favorites/${warungId}`).set(auth(customer.accessToken)).expect(201)
    await request(app).post(`${api}/customer/favorites/${warungId}`).set(auth(customer.accessToken)).expect(201)
    const saved = await request(app).get(`${api}/customer/favorites`).set(auth(customer.accessToken)).expect(200)
    expect(saved.body.data).toHaveLength(1)
    expect(saved.body.data[0].id).toBe(warungId)
    await request(app).delete(`${api}/customer/favorites/${warungId}`).set(auth(customerOther.accessToken)).expect(200)
    const other = await request(app).get(`${api}/customer/favorites`).set(auth(customerOther.accessToken)).expect(200)
    expect(other.body.data).toHaveLength(0)
    const stillSaved = await request(app).get(`${api}/customer/favorites`).set(auth(customer.accessToken)).expect(200)
    expect(stillSaved.body.data).toHaveLength(1)
  })

  it('13 validates six ratings, rejects duplicate reviews and enforces customer review ownership', async () => {
    const review = { warungId, tasteRating: 4, priceRating: 4, portionRating: 4, cleanlinessRating: 4, comfortRating: 4, speedRating: 4, comment: 'Ulasan QA untuk warung ini.' }
    expectCode(await request(app).post(`${api}/customer/reviews`).set(auth(customer.accessToken)).send({ ...review, tasteRating: 6 }), 422, 'VALIDATION_ERROR')
    const created = await request(app).post(`${api}/customer/reviews`).set(auth(customer.accessToken)).send(review).expect(201)
    reviewId = created.body.data.id
    expectCode(await request(app).post(`${api}/customer/reviews`).set(auth(customer.accessToken)).send(review), 409, 'REVIEW_EXISTS')
    expectCode(await request(app).patch(`${api}/customer/reviews/${reviewId}`).set(auth(customerOther.accessToken)).send({ comment: 'Not mine' }), 404, 'REVIEW_NOT_FOUND')
    expectCode(await request(app).delete(`${api}/customer/reviews/${reviewId}`).set(auth(customerOther.accessToken)), 404, 'REVIEW_NOT_FOUND')
    await request(app).patch(`${api}/customer/reviews/${reviewId}`).set(auth(customer.accessToken)).send({
      tasteRating: 5, priceRating: 5, portionRating: 5, cleanlinessRating: 5, comfortRating: 5, speedRating: 5,
    }).expect(200)
    const history = await request(app).get(`${api}/customer/reviews`).set(auth(customer.accessToken)).expect(200)
    expect(history.body.data.items).toHaveLength(1)
    expect(history.body.data.items[0]).toMatchObject({ id: reviewId, warungId, averageRating: 5, status: 'VISIBLE' })
    const filtered = await request(app).get(`${api}/customer/reviews`).query({ warungId }).set(auth(customer.accessToken)).expect(200)
    expect(filtered.body.data.items).toHaveLength(1)
    const unmatched = await request(app).get(`${api}/customer/reviews`).query({ warungId: randomUUID() }).set(auth(customer.accessToken)).expect(200)
    expect(unmatched.body.data.pagination.total).toBe(0)
    expect(unmatched.body.data.items).toHaveLength(0)
    await request(app).get(`${api}/admin/reviews`).set(auth(customer.accessToken)).expect(403)
    const moderationList = await request(app).get(`${api}/admin/reviews`).query({ q: businessName, limit: 1 }).set(auth(adminToken)).expect(200)
    expect(moderationList.body.data.items[0]).toMatchObject({ id: reviewId, averageRating: 5 })
    expect(moderationList.body.data.pagination.total).toBe(1)
    const otherHistory = await request(app).get(`${api}/customer/reviews`).set(auth(customerOther.accessToken)).expect(200)
    expect(otherHistory.body.data.items).toHaveLength(0)
  })

  it('14 permits only the owning UMKM reply and exposes correct public ratings/statistics', async () => {
    const reply = 'Terima kasih atas ulasannya.'
    expectCode(await request(app).put(`${api}/umkm/reviews/${reviewId}/reply`).set(auth(ownerOther.accessToken)).send({ reply }), 404, 'REVIEW_NOT_FOUND')
    await request(app).put(`${api}/umkm/reviews/${reviewId}/reply`).set(auth(owner.accessToken)).send({ reply }).expect(200)
    const ownerReviews = await request(app).get(`${api}/umkm/reviews`).set(auth(owner.accessToken)).expect(200)
    expect(ownerReviews.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: reviewId, reply, averageRating: 5 })]))
    const detail = await request(app).get(`${api}/warungs/${slug}`).expect(200)
    expect(detail.body.data).toMatchObject({ rating: 5, reviewCount: 1 })
    expect(detail.body.data.reviews).toEqual(expect.arrayContaining([expect.objectContaining({ id: reviewId, umkmReply: reply, averageRating: 5 })]))
    expectItem(await request(app).get(`${api}/warungs`).query({ q: businessName, minRating: 5 }), warungId)
    const stats = await request(app).get(`${api}/umkm/statistics`).set(auth(owner.accessToken)).expect(200)
    expect(stats.body.data).toMatchObject({ favoriteCount: 1, averageRating: 5, reviewCount: 1 })
    expect(stats.body.data.profileViews).toBeGreaterThanOrEqual(2)
    expect(stats.body.data.profileViewsLast30Days).toBeGreaterThanOrEqual(2)
  })

  it('15 tracks reports/moderation, hides moderated reviews, deactivates listings and blocks suspended accounts', async () => {
    const report = await request(app).post(`${api}/customer/reports`).set(auth(customerOther.accessToken)).send({
      targetType: 'REVIEW', targetId: reviewId, reason: 'Review pengujian QA', detail: 'Skenario moderasi integration test.',
    }).expect(201)
    const reportId = report.body.data.id
    const ownReports = await request(app).get(`${api}/customer/reports`).set(auth(customerOther.accessToken)).expect(200)
    expect(ownReports.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: reportId })]))
    const privateReports = await request(app).get(`${api}/customer/reports`).set(auth(customer.accessToken)).expect(200)
    expect(privateReports.body.data).toHaveLength(0)
    await request(app).get(`${api}/customer/reports`).expect(401)
    const reports = await request(app).get(`${api}/admin/reports`).set(auth(adminToken)).expect(200)
    expect(reports.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: reportId, targetId: reviewId, status: 'OPEN' })]))
    await request(app).patch(`${api}/admin/reviews/${reviewId}/status`).set(auth(adminToken)).send({ status: 'HIDDEN' }).expect(200)
    await request(app).patch(`${api}/admin/reports/${reportId}`).set(auth(adminToken)).send({ status: 'RESOLVED', adminNote: 'Moderasi QA selesai.' }).expect(200)
    const hidden = await request(app).get(`${api}/warungs/${slug}`).expect(200)
    expect(hidden.body.data).toMatchObject({ rating: 0, reviewCount: 0, reviews: [] })
    const history = await request(app).get(`${api}/customer/reviews`).set(auth(customer.accessToken)).expect(200)
    expect(history.body.data.items[0]).toMatchObject({ id: reviewId, status: 'HIDDEN' })
    const resolved = await request(app).get(`${api}/admin/reports`).set(auth(adminToken)).expect(200)
    expect(resolved.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: reportId, status: 'RESOLVED' })]))
    const audit = await request(app).get(`${api}/admin/audit-logs`).set(auth(adminToken)).expect(200)
    expect(audit.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ entityId: reviewId, action: 'REVIEW_STATUS_CHANGED' })]))
    await request(app).delete(`${api}/customer/favorites/${warungId}`).set(auth(customer.accessToken)).expect(200)
    const favorites = await request(app).get(`${api}/customer/favorites`).set(auth(customer.accessToken)).expect(200)
    expect(favorites.body.data).toHaveLength(0)
    await request(app).delete(`${api}/admin/warungs/${warungId}`).set(auth(adminToken)).expect(200)
    expectCode(await request(app).get(`${api}/warungs/${slug}`), 404, 'WARUNG_NOT_FOUND')
    const inactive = await request(app).get(`${api}/warungs`).query({ q: businessName }).expect(200)
    expect(inactive.body.data.items).toHaveLength(0)
    await request(app).patch(`${api}/admin/users/${customer.user.id}/status`).set(auth(adminToken)).send({ status: 'SUSPENDED' }).expect(200)
    expectCode(await request(app).get(`${api}/auth/me`).set(auth(customer.accessToken)), 403, 'ACCOUNT_SUSPENDED')
    expectCode(await request(app).post(`${api}/auth/login`).send({ email: customerInput.email, password }), 403, 'ACCOUNT_SUSPENDED')
  })

  it('16 authenticates seeded demo roles after repeated setup without duplicating accounts', async () => {
    // Optional for manual integration runs; the local QA runner always supplies it.
    if (!process.env.LAPERU_DEMO_CREDENTIALS) return
    const accounts: Array<{ email: string; password: string; role: string }> = JSON.parse(await readFile(process.env.LAPERU_DEMO_CREDENTIALS, 'utf8'))
    expect(accounts.map((account) => account.role).sort()).toEqual(['CUSTOMER', 'UMKM'])
    for (const account of accounts) {
      const response = await request(app).post(`${api}/auth/login`).send({ email: account.email, password: account.password })
      expect(response.status).toBe(200)
      expect(response.body.data.user).toMatchObject({ role: account.role, status: 'ACTIVE' })
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [account.email])
      expect(rows).toHaveLength(1)
      const endpoint = account.role === 'CUSTOMER' ? '/customer/favorites' : '/umkm/menus'
      await request(app).get(api + endpoint).set(auth(response.body.data.accessToken)).expect(200)
    }
  })
})
