import { chromium, expect } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('../', import.meta.url))
const db = new URL(process.env.DATABASE_URL || 'mysql://invalid')
if (process.env.LAPERU_INTEGRATION_TESTS !== '1' || !['127.0.0.1', 'localhost'].includes(db.hostname) || !/^\/laperu_test_[a-zA-Z0-9_]+$/.test(db.pathname)) throw new Error('Browser smoke only runs on an explicitly enabled local QA database.')
async function port() { const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening'); const value = server.address().port; await new Promise((resolve) => server.close(resolve)); return value }
const apiPort = await port()
const webPort = await port()
const base = `http://127.0.0.1:${webPort}`
const api = `http://127.0.0.1:${apiPort}/api/v1`
const output = path.join(root, 'test-results')
const browserChannel = process.env.LAPERU_BROWSER_CHANNEL || 'headless'
const steps = []
const processes = []
let browser
const errors = []
const tag = randomUUID().slice(0, 8)
const password = 'QaBrowser12345'
const email = `browser-${tag}@example.test`
const warungName = `Warung Uji Browser ${tag}`
async function step(name, action) { await action(); steps.push(name); console.log(`PASS: ${name}`) }
function start(file, args, env) {
  const child = spawn(process.execPath, [file, ...args], { cwd: root, env: { ...process.env, ...env }, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let failure = ''; child.stderr.on('data', (data) => { failure = (failure + data.toString()).slice(-2000) })
  child.on('error', (error) => errors.push(error.message))
  processes.push(child)
  return { child, failure: () => failure }
}
async function ready(url, processInfo) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (processInfo.child.exitCode !== null) throw new Error(`Test service exited: ${processInfo.failure()}`)
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return } catch { /* service starting */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Service did not become ready: ${url}`)
}
async function request(endpoint, { method = 'GET', body, token } = {}) {
  const response = await fetch(api + endpoint, { method, signal: AbortSignal.timeout(15000), headers: { ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }) })
  const result = await response.json()
  assert.equal(result.success, true, `${endpoint}: ${response.status} ${result.code || ''}`)
  return result.data
}

try {
  await mkdir(output, { recursive: true })
  const apiProcess = start(path.join(root, 'scripts/qa-api-server.mjs'), [], { NODE_ENV: 'test', PORT: String(apiPort), PUBLIC_API_ORIGIN: `http://127.0.0.1:${apiPort}`, FRONTEND_ORIGIN: base })
  const webProcess = start(path.join(root, 'node_modules/vite/bin/vite.js'), ['--config', 'vite.config.js', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'], { VITE_API_BASE_URL: '/api/v1', LAPERU_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` })
  await Promise.all([ready(api + '/health/database', apiProcess), ready(base, webProcess)])
  const admin = await request('/auth/login', { method: 'POST', body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })
  const owner = await request('/auth/register/umkm', { method: 'POST', body: { email: `owner-${tag}@example.test`, password, fullName: 'Pemilik Uji', businessName: warungName, ownerName: 'Pemilik Uji', phone: '081234567890', address: 'Alamat fiktif khusus QA LaperU' } })
  const upload = new FormData()
  upload.append('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'qa.png')
  const image = await request('/umkm/uploads/images', { method: 'POST', body: upload, token: owner.accessToken })
  await request('/umkm/application', { method: 'PATCH', body: { storefrontPhotoUrl: image.url }, token: owner.accessToken })
  await request('/umkm/application/submit', { method: 'POST', token: owner.accessToken })
  const application = await request('/umkm/application', { token: owner.accessToken })
  await request(`/admin/applications/${application.submissionId}/decision`, { method: 'POST', body: { decision: 'APPROVED' }, token: admin.accessToken })
  const meta = await request('/meta')
  const category = meta.categories[0]
  const otherCategory = meta.categories.find((item) => item.id !== category?.id)
  assert.ok(category && otherCategory, 'QA seed must provide at least two distinct categories.')
  await request('/umkm/warung', { method: 'PUT', body: { description: 'Data fiktif khusus pengujian integrasi browser.', categoryId: meta.categories[0].id, priceMin: 10000, priceMax: 25000, statusOverride: 'OPEN' }, token: owner.accessToken })
  await request('/umkm/menus', { method: 'POST', body: { name: 'Nasi Uji Browser', price: 15000 }, token: owner.accessToken })
  const warung = await request('/umkm/warung', { token: owner.accessToken })
  browser = await chromium.launch({ ...(browserChannel === 'headless' ? {} : { channel: browserChannel }), headless: true })
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', (error) => errors.push(error.message))
  async function loginPage(target, emailValue, passwordValue, next = '/explore') {
    await target.goto(base + '/login?next=' + encodeURIComponent(next))
    await target.getByLabel('Email', { exact: true }).fill(emailValue)
    await target.getByLabel('Password', { exact: true }).fill(passwordValue)
    await target.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(target).toHaveURL(base + next)
  }
  async function result(filters, action, included = true) {
    const query = { sort: 'recommended', page: '1', limit: '12', ...filters }
    const [response] = await Promise.all([page.waitForResponse(candidate => {
      const url = new URL(candidate.url())
      return candidate.request().method() === 'GET' && url.pathname === '/api/v1/warungs'
        && url.searchParams.size === Object.keys(query).length
        && Object.entries(query).every(([key, value]) => url.searchParams.get(key) === String(value))
    }), action()])
    assert.equal(response.status(), 200)
    const payload = await response.json()
    assert.deepEqual(payload.data.items.map(item => item.id), included ? [warung.id] : [])
    assert.equal(payload.data.pagination.total, included ? 1 : 0)
    await expect(page.locator('.explore-result-heading span').first()).toHaveText((included ? 1 : 0) + ' warung ditemukan')
    if (included) await expect(page.getByRole('link', { name: warungName, exact: true })).toBeVisible()
    else await expect(page.getByRole('heading', { name: 'Warung yang kamu cari belum ketemu' })).toBeVisible()
  }
  await step('Guest query parameter cannot forge login', async () => {
    await page.goto(base + '/explore?mode=account')
    await expect(page.getByRole('link', { name: 'Profil saya' })).toHaveCount(0)
    await expect(page.locator('.explore-header__user').getByRole('link', { name: 'Masuk', exact: true })).toBeVisible()
  })
  await step('Customer registers and restores a real session', async () => {
    await page.goto(base + '/register')
    for (const [label, value] of [['Nama lengkap', 'Mahasiswa Uji Browser'], ['Email', email], ['Password', password], ['Konfirmasi password', password]]) await page.getByLabel(label, { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Buat akun mahasiswa', exact: true }).click()
    await expect(page).toHaveURL(base + '/explore')
    await expect(page.getByRole('link', { name: 'Profil saya' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('link', { name: 'Profil saya' })).toBeVisible()
  })
  await step('Search, category, budget and open-now hit real filtered API', async () => {
    await page.getByRole('searchbox', { name: 'Cari makanan atau warung' }).fill(warungName)
    await result({ q: warungName }, () => page.getByRole('button', { name: 'Cari', exact: true }).click())
    await result({ q: warungName, category: category.slug }, () => page.getByRole('button', { name: category.name, exact: true }).click())
    await page.getByRole('button', { name: 'Filter', exact: true }).click()
    await result({ q: warungName, category: category.slug, maxPrice: '19999' }, () => page.getByLabel('Harga', { exact: false }).selectOption('under20'))
    await result({ q: warungName, category: category.slug, maxPrice: '19999', openNow: 'true' }, () => page.getByLabel('Buka sekarang').check())
    await page.screenshot({ path: path.join(output, 'explore-desktop.png'), fullPage: true })
  })
  await step('Nonmatching category and budget exclude real fixture', async () => {
    await result({ q: warungName, category: otherCategory.slug, maxPrice: '19999', openNow: 'true' }, () => page.getByRole('button', { name: otherCategory.name, exact: true }).click(), false)
    await result({ q: warungName, category: category.slug, maxPrice: '19999', openNow: 'true' }, () => page.getByRole('button', { name: category.name, exact: true }).click())
    await result({ q: warungName, category: category.slug, minPrice: '30001', openNow: 'true' }, () => page.getByLabel('Harga', { exact: false }).selectOption('above30'), false)
    await result({ q: warungName, category: category.slug, maxPrice: '19999', openNow: 'true' }, () => page.getByLabel('Harga', { exact: false }).selectOption('under20'))
  })
  await step('Closed warung excluded only when open-now is enabled', async () => {
    await request('/umkm/warung', { method: 'PUT', body: { statusOverride: 'CLOSED' }, token: owner.accessToken })
    await result({ q: warungName, category: category.slug, maxPrice: '19999' }, () => page.getByLabel('Buka sekarang').uncheck())
    await result({ q: warungName, category: category.slug, maxPrice: '19999', openNow: 'true' }, () => page.getByLabel('Buka sekarang').check(), false)
    await request('/umkm/warung', { method: 'PUT', body: { statusOverride: 'OPEN' }, token: owner.accessToken })
    await result({ q: warungName, category: category.slug, maxPrice: '19999' }, () => page.getByLabel('Buka sekarang').uncheck())
  })
  await step('Latest detail renders real menu and favorite persists across reload', async () => {
    await page.getByRole('link', { name: warungName, exact: true }).click()
    await expect(page).toHaveURL(base + '/restaurants/' + warung.slug)
    await page.getByRole('button', { name: /Tampilkan Menu/i }).click()
    await expect(page.getByText('Nasi Uji Browser', { exact: true })).toBeVisible()
    await expect(page.locator('.detail-menu').getByText(/Rp\s*15\.000/)).toBeVisible()
    await page.getByRole('button', { name: 'Simpan favorit', exact: true }).click()
    await expect(page.getByText('Warung tersimpan di favorit.')).toBeVisible()
    await page.goto(base + '/favorites')
    const activity = page.locator('.account-activity-item').filter({ hasText: warungName })
    await expect(activity).toBeVisible()
    await page.reload()
    await expect(activity).toBeVisible()
    page.once('dialog', dialog => dialog.accept())
    await activity.getByRole('button', { name: 'Hapus', exact: true }).click()
    await expect(activity).toHaveCount(0)
  })
  await step('Logout revokes session and protected account stays locked after reload', async () => {
    await page.getByRole('button', { name: 'Keluar', exact: true }).first().click()
    await page.getByRole('dialog').getByRole('button', { name: 'Keluar', exact: true }).click()
    await page.goto(base + '/account')
    await expect(page.getByRole('heading', { name: 'Silakan masuk' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Silakan masuk' })).toBeVisible()
  })
  await step('Wrong password rejected and external redirect blocked', async () => {
    await page.goto(base + '/login?next=https://example.test/escape')
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Email atau kata sandi salah')
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(base + '/explore')
  })
  await step('Empty, network failure, retry and missing slug have truthful states', async () => {
    await page.goto(base + '/explore?q=does-not-exist-' + tag)
    await expect(page.getByRole('heading', { name: 'Warung yang kamu cari belum ketemu' })).toBeVisible()
    await page.route('**/api/v1/warungs?**', route => route.abort())
    await page.goto(base + '/explore?q=network-test')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Warung yang kamu cari belum ketemu' })).toHaveCount(0)
    await page.unroute('**/api/v1/warungs?**')
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Warung yang kamu cari belum ketemu' })).toBeVisible()
    await page.goto(base + '/restaurants/does-not-exist-' + tag)
    await expect(page.getByRole('alert')).toContainText('Warung tidak ditemukan')
  })
  await step('Mobile discovery and detail do not overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const [route, file] of [['/explore?q=' + encodeURIComponent(warungName), 'explore-mobile.png'], ['/restaurants/' + warung.slug, 'detail-mobile.png']]) {
      await page.goto(base + route)
      await expect(page.getByText(warungName, { exact: true }).first()).toBeVisible()
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
      await page.screenshot({ path: path.join(output, file), fullPage: true })
    }
  })
  const ownerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const ownerPage = await ownerContext.newPage()
  ownerPage.on('pageerror', error => errors.push(error.message))
  const uiWarungName = 'Warung UI ' + tag
  await step('UMKM registration uploads image and sends a pending application', async () => {
    await ownerPage.goto(base + '/register?role=umkm')
    for (const [label, value] of [['Nama lengkap', 'Pemilik Browser'], ['Email', 'ui-umkm-' + tag + '@example.test'], ['Password', password], ['Konfirmasi password', password], ['Nama warung', uiWarungName], ['Nama pemilik', 'Pemilik Browser'], ['Nomor telepon usaha', '081234567890'], ['Alamat warung', 'Alamat fiktif pengujian UMKM']]) await ownerPage.getByLabel(label, { exact: true }).fill(value)
    await ownerPage.getByRole('button', { name: 'Buat akun UMKM', exact: true }).click()
    await expect(ownerPage).toHaveURL(base + '/account')
    await ownerPage.goto(base + '/umkm/pengajuan')
    await expect(ownerPage.getByText('Status: Draft', { exact: true })).toBeVisible()
    await ownerPage.getByLabel('Foto tampak depan (JPG/PNG, maksimal 2 MB)', { exact: true }).setInputFiles({
      name: 'storefront.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII=', 'base64'),
    })
    await ownerPage.getByRole('button', { name: 'Kirim Pengajuan', exact: true }).click()
    await expect(ownerPage.getByText('Status: Menunggu', { exact: true })).toBeVisible()
    await ownerPage.goto(base + '/admin')
    await expect(ownerPage.getByRole('heading', { name: 'Akses tidak tersedia' })).toBeVisible()
  })
  const adminContext = await browser.newContext({ viewport: { width: 1365, height: 900 } })
  const adminPage = await adminContext.newPage()
  adminPage.on('pageerror', error => errors.push(error.message))
  await step('Admin requests revision and UMKM sees and resubmits it', async () => {
    await loginPage(adminPage, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, '/admin/pengajuan')
    await adminPage.getByRole('row').filter({ hasText: uiWarungName }).getByRole('button', { name: 'Periksa' }).click()
    await expect(adminPage.getByAltText('Foto pengajuan warung')).toBeVisible()
    await adminPage.getByRole('button', { name: 'Minta Perbaikan', exact: true }).click()
    await adminPage.getByPlaceholder('Tulis catatan untuk pemilik usaha...').fill('Lengkapi alamat usaha untuk pengujian.')
    await adminPage.getByRole('button', { name: 'Simpan Keputusan', exact: true }).click()
    await expect(adminPage.locator('.admin-submission-drawer')).toHaveCount(0)
    await ownerPage.goto(base + '/umkm/pengajuan')
    await expect(ownerPage.getByText('Status: Perlu Diperbaiki', { exact: true })).toBeVisible()
    await expect(ownerPage.getByText('Lengkapi alamat usaha untuk pengujian.', { exact: true })).toBeVisible()
    await ownerPage.getByLabel('Alamat', { exact: true }).fill('Alamat fiktif pengujian UMKM sudah direvisi')
    await ownerPage.getByRole('button', { name: 'Kirim Pengajuan', exact: true }).click()
    await expect(ownerPage.getByText('Status: Menunggu', { exact: true })).toBeVisible()
  })
  await step('Admin approval unlocks owner profile, menu, hours and facilities', async () => {
    await adminPage.reload()
    await adminPage.getByRole('row').filter({ hasText: uiWarungName }).getByRole('button', { name: 'Periksa' }).click()
    await adminPage.getByRole('button', { name: 'Setujui', exact: true }).click()
    await expect(adminPage.locator('.admin-submission-drawer')).toHaveCount(0)
    await ownerPage.goto(base + '/umkm/profil-warung')
    await ownerPage.getByLabel('Harga minimum', { exact: true }).fill('10000')
    await ownerPage.getByLabel('Harga maksimum', { exact: true }).fill('25000')
    await ownerPage.getByLabel('Kategori', { exact: true }).selectOption(category.id)
    await ownerPage.getByLabel('Status buka', { exact: true }).selectOption('OPEN')
    await ownerPage.getByLabel(meta.facilities[0].name, { exact: true }).check()
    await ownerPage.getByRole('button', { name: 'Simpan Perubahan', exact: true }).click()
    await expect(ownerPage.getByText('Perubahan tersimpan di server.', { exact: true })).toBeVisible()
    await ownerPage.reload()
    await expect(ownerPage.getByLabel('Harga minimum', { exact: true })).toHaveValue('10000')
    await expect(ownerPage.getByLabel(meta.facilities[0].name, { exact: true })).toBeChecked()
    await ownerPage.goto(base + '/umkm/menu')
    await ownerPage.getByRole('button', { name: 'Tambah Menu', exact: true }).click()
    await ownerPage.getByLabel('Nama Menu', { exact: true }).fill('Nasi UI Demo')
    await ownerPage.getByLabel('Harga', { exact: true }).fill('18000')
    await ownerPage.getByRole('button', { name: 'Simpan', exact: true }).click()
    await expect(ownerPage.locator('.umkm-menu__editor')).toHaveCount(0)
    await ownerPage.reload()
    await expect(ownerPage.getByRole('cell', { name: 'Nasi UI Demo', exact: true })).toBeVisible()
    await ownerPage.goto(base + '/umkm/jam-operasional')
    await ownerPage.getByLabel('Tutup Senin', { exact: true }).uncheck()
    await ownerPage.getByLabel('Jam buka Senin', { exact: true }).fill('08:00')
    await ownerPage.getByLabel('Jam tutup Senin', { exact: true }).fill('20:00')
    await ownerPage.getByRole('button', { name: 'Simpan jadwal', exact: true }).click()
    await expect(ownerPage.getByText('Perubahan tersimpan di server.', { exact: true })).toBeVisible()
    await ownerPage.reload()
    await expect(ownerPage.getByLabel('Jam buka Senin', { exact: true })).toHaveValue('08:00')
    await ownerPage.screenshot({ path: path.join(output, 'umkm-mobile.png'), fullPage: true })
    assert.equal(await ownerPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  })
  await step('Customer creates and edits review; owning UMKM replies', async () => {
    await page.setViewportSize({ width: 1365, height: 900 })
    await page.goto(base + '/restaurants/' + warung.slug)
    await page.getByRole('button', { name: 'Beri Ulasan', exact: true }).click()
    for (const label of ['Rasa', 'Harga', 'Porsi', 'Kebersihan', 'Kenyamanan', 'Kecepatan']) await page.getByRole('button', { name: 'Rating ' + label + ' 4 dari 5', exact: true }).click()
    await page.getByRole('textbox', { name: 'Ulasan', exact: true }).fill('Ulasan fiktif dari browser QA.')
    await page.getByRole('button', { name: 'Kirim', exact: true }).click()
    await expect(page.getByText('Ulasan fiktif dari browser QA.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Edit ulasan', exact: true }).click()
    await page.getByRole('textbox', { name: 'Ulasan', exact: true }).fill('Ulasan fiktif telah diperbarui.')
    await page.getByRole('button', { name: 'Kirim', exact: true }).click()
    await expect(page.getByText('Ulasan fiktif telah diperbarui.', { exact: true })).toBeVisible()
    await ownerPage.getByRole('button', { name: 'Keluar', exact: true }).click()
    await expect(ownerPage).toHaveURL(base + '/explore')
    await loginPage(ownerPage, 'owner-' + tag + '@example.test', password, '/umkm/ulasan')
    await ownerPage.getByLabel('Balasan untuk Mahasiswa Uji Browser', { exact: true }).fill('Terima kasih atas ulasan pengujian.')
    await ownerPage.getByRole('button', { name: 'Simpan balasan', exact: true }).click()
    await expect(ownerPage.getByText('Perubahan tersimpan di server.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText(/Terima kasih atas ulasan pengujian/)).toBeVisible()
  })
  await step('Customer reports warung, Admin resolves it, reporter sees result', async () => {
    await page.getByRole('button', { name: 'Laporkan warung', exact: true }).click()
    await page.getByLabel('Alasan laporan', { exact: true }).fill('Laporan pengujian moderasi')
    await page.getByRole('button', { name: 'Kirim laporan', exact: true }).click()
    await expect(page.getByText('Laporan berhasil dikirim', { exact: false })).toBeVisible()
    await adminPage.goto(base + '/admin/ulasan-laporan')
    const report = adminPage.locator('article.api-report').filter({ hasText: 'Laporan pengujian moderasi' })
    await expect(report).toBeVisible()
    await report.getByLabel('Catatan Admin').fill('Pemeriksaan QA selesai')
    await report.getByRole('button', { name: 'Simpan hasil pemeriksaan' }).click()
    await expect(report).toContainText('RESOLVED')
    await page.goto(base + '/account?tab=activity&filter=report')
    await expect(page.getByText(/Pemeriksaan QA selesai/)).toBeVisible()
  })
  await step('Admin moderates a review and public guest cannot see it', async () => {
    const row = adminPage.getByRole('row').filter({ hasText: 'Ulasan fiktif telah diperbarui.' })
    await row.getByRole('button', { name: 'Aksi ulasan Mahasiswa Uji Browser', exact: true }).click()
    await row.getByRole('button', { name: /Sembunyikan/ }).click()
    await expect(row).toContainText('Disembunyikan')
    const guest = await browser.newContext()
    const guestPage = await guest.newPage()
    await guestPage.goto(base + '/restaurants/' + warung.slug)
    await expect(guestPage.getByRole('heading', { name: warungName, exact: true })).toBeVisible()
    await expect(guestPage.getByText('Ulasan fiktif telah diperbarui.', { exact: true })).toHaveCount(0)
    await guest.close()
  })
  await step('Every Admin page loads real data without JavaScript exceptions', async () => {
    for (const route of ['/admin', '/admin/warung', '/admin/pengguna', '/admin/master-data', '/admin/audit-log']) {
      await adminPage.goto(base + route)
      await expect(adminPage.locator('main h1').first()).toBeVisible()
      await expect(adminPage.getByText('Memuat data…', { exact: true })).toBeHidden()
      await expect(adminPage.getByRole('alert')).toHaveCount(0)
    }
    await adminPage.screenshot({ path: path.join(output, 'admin-desktop.png'), fullPage: true })
  })
  await ownerContext.close()
  await adminContext.close()
  assert.deepEqual(errors, [], 'Browser must not have uncaught JavaScript exceptions')
  await writeFile(path.join(output, 'browser-smoke.json'), JSON.stringify({ status: 'passed', date: new Date().toISOString(), browser: browser.version(), channel: browserChannel, engine: 'Chromium headless', viewport: ['1365x900', '390x844 emulated'], steps, errors }, null, 2))
  console.log(`PASS: ${steps.length} browser scenarios; ${browserChannel} ${browser.version()}; no page exceptions.`)
} catch (error) {
  await mkdir(output, { recursive: true })
  let pageIndex = 0
  for (const context of browser?.contexts() || []) {
    for (const page of context.pages()) {
      await page.screenshot({ path: path.join(output, `failure-${pageIndex}.png`), fullPage: true }).catch(() => {})
      await writeFile(path.join(output, `failure-${pageIndex}.txt`), await page.locator('body').innerText().catch(() => 'Page unavailable'))
      pageIndex += 1
    }
  }
  await writeFile(path.join(output, 'browser-smoke.json'), JSON.stringify({ status: 'failed', date: new Date().toISOString(), channel: browserChannel, steps, errors: [...errors, error.message] }, null, 2))
  throw error
} finally {
  await browser?.close()
  for (const child of processes.reverse()) if (child.exitCode === null) { child.kill(); await Promise.race([once(child, 'exit'), new Promise((resolve) => setTimeout(resolve, 4000))]) }
}
