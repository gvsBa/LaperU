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
  async function expectDiscoveryResult(filters, action, containsFixture = true) {
    const expectedQuery = { ...filters, limit: '12' }
    const [response] = await Promise.all([
      page.waitForResponse((candidate) => {
        const url = new URL(candidate.url())
        return candidate.request().method() === 'GET' && url.origin === base && url.pathname === '/api/v1/warungs'
          && url.searchParams.size === Object.keys(expectedQuery).length
          && Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === String(value))
      }),
      action(),
    ])
    assert.equal(response.status(), 200, 'The latest discovery request must succeed.')
    const payload = await response.json()
    assert.equal(payload.success, true)
    assert.deepEqual(payload.data.items.map((item) => item.id), containsFixture ? [warung.id] : [])
    assert.equal(payload.data.pagination.total, containsFixture ? 1 : 0)
    // Check the rendered result after the matching response, not the previous
    // visible card while a new filter request is still in flight.
    await expect(page.locator('.explore-result-heading span').first()).toHaveText(`${containsFixture ? 1 : 0} warung ditemukan`)
    await expect(page.getByText('Sedang mengambil informasi dari server…', { exact: true })).toBeHidden()
    if (containsFixture) await expect(page.getByRole('link', { name: warungName, exact: true })).toBeVisible()
    else {
      await expect(page.getByRole('heading', { name: 'Warung belum ditemukan.', exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: warungName, exact: true })).toHaveCount(0)
    }
  }
  await step('Guest cannot fake a session using mode=account', async () => {
    await page.goto(`${base}/explore?mode=account`)
    await expect(page.locator('.explore-header__user').getByRole('link', { name: 'Masuk', exact: true })).toBeVisible()
    await expect(page.getByText('Sedang menjelajah sebagai Guest.', { exact: false })).toBeVisible()
  })
  await step('Customer registration creates a real authenticated session', async () => {
    await page.goto(`${base}/register`)
    await page.getByLabel('Nama lengkap', { exact: true }).fill('Mahasiswa Uji Browser')
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Konfirmasi password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Buat akun mahasiswa', exact: true }).click()
    await expect(page).toHaveURL(/\/explore$/)
    await expect(page.getByRole('link', { name: 'Akun Mahasiswa Uji Browser', exact: true })).toBeVisible()
  })
  await step('Search, category and budget use actual API data', async () => {
    await page.getByRole('searchbox', { name: 'Cari makanan atau warung' }).fill(warungName)
    await expectDiscoveryResult({ q: warungName }, () => page.getByRole('button', { name: 'Cari', exact: true }).click())
    await expectDiscoveryResult({ q: warungName, category: category.slug }, () => page.getByRole('button', { name: category.name, exact: true }).click())
    await page.getByLabel('Maksimal budget (Rp)').fill('20000')
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000' }, () => page.getByRole('button', { name: 'Terapkan budget' }).click())
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000', openNow: 'true' }, () => page.getByLabel('Sedang buka', { exact: true }).check())
    await page.screenshot({ path: path.join(output, 'explore-desktop.png'), fullPage: true })
  })
  await step('A different category excludes the fixture and restoring its category includes it', async () => {
    await expectDiscoveryResult({ q: warungName, category: otherCategory.slug, maxPrice: '20000', openNow: 'true' }, () => page.getByRole('button', { name: otherCategory.name, exact: true }).click(), false)
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000', openNow: 'true' }, () => page.getByRole('button', { name: category.name, exact: true }).click())
  })
  await step('Budget below the fixture minimum excludes it and a sufficient budget restores it', async () => {
    await page.getByLabel('Maksimal budget (Rp)').fill('5000')
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '5000', openNow: 'true' }, () => page.getByRole('button', { name: 'Terapkan budget' }).click(), false)
    await page.getByLabel('Maksimal budget (Rp)').fill('20000')
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000', openNow: 'true' }, () => page.getByRole('button', { name: 'Terapkan budget' }).click())
  })
  await step('Open-now excludes a closed fixture but unfiltered discovery still includes it', async () => {
    try {
      await request('/umkm/warung', { method: 'PUT', body: { statusOverride: 'CLOSED' }, token: owner.accessToken })
      await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000', openNow: 'true' }, () => page.reload(), false)
      await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000' }, () => page.getByLabel('Sedang buka', { exact: true }).uncheck())
    } finally {
      await request('/umkm/warung', { method: 'PUT', body: { statusOverride: 'OPEN' }, token: owner.accessToken })
    }
    await expectDiscoveryResult({ q: warungName, category: category.slug, maxPrice: '20000', openNow: 'true' }, () => page.getByLabel('Sedang buka', { exact: true }).check())
  })
  await step('Detail uses slug and real menu price; favorite persists', async () => {
    await page.getByRole('link', { name: warungName, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/restaurants/${warung.slug}$`))
    await expect(page.getByRole('heading', { name: warungName, exact: true })).toBeVisible()
    await expect(page.getByText('Nasi Uji Browser', { exact: true })).toBeVisible()
    const menuItem = page.locator('.detail-menu li').filter({ has: page.getByText('Nasi Uji Browser', { exact: true }) })
    await expect(menuItem.getByText(/^Rp\s*15\.000$/)).toBeVisible()
    await page.getByRole('button', { name: 'Simpan favorit', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Hapus dari favorit', exact: true })).toBeVisible()
    await page.goto(`${base}/favorites`)
    await expect(page.getByRole('link', { name: warungName, exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('link', { name: warungName, exact: true })).toBeVisible()
    await page.goto(`${base}/restaurants/${warung.slug}`)
    await page.getByRole('button', { name: 'Hapus dari favorit', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simpan favorit', exact: true })).toBeVisible()
  })
  await step('Logout revokes cookie; reload does not restore the account', async () => {
    await page.goto(`${base}/account`)
    await expect(page.getByText(email, { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar dari akun', exact: true }).click()
    await expect(page.getByText('Kamu sudah keluar dari akun.', { exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Kamu belum masuk ke akun.', { exact: true })).toBeVisible()
  })
  await step('Wrong password is rejected; external next redirect stays internal', async () => {
    await page.goto(`${base}/login?next=https://example.test/escape`)
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123')
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Email atau kata sandi salah')
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(page).toHaveURL(`${base}/explore`)
  })
  await step('Empty search and simulated network failure have explicit states', async () => {
    await page.goto(`${base}/explore?q=does-not-exist-${tag}`)
    await expect(page.getByRole('heading', { name: 'Warung belum ditemukan.' })).toBeVisible()
    await page.route('**/api/v1/warungs?**', (route) => route.abort())
    await page.goto(`${base}/explore?q=network-test`)
    await expect(page.getByRole('heading', { name: 'Warung belum dapat dimuat.' })).toBeVisible()
    await page.unroute('**/api/v1/warungs?**')
    await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Warung belum ditemukan.' })).toBeVisible()
  })
  await step('Unknown slug returns visible not-found state', async () => {
    await page.goto(`${base}/restaurants/does-not-exist-${tag}`)
    await expect(page.getByRole('alert')).toContainText('Warung tidak ditemukan')
  })
  await step('Mobile-width discovery and detail have no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${base}/explore?q=${encodeURIComponent(warungName)}`)
    await expect(page.getByRole('link', { name: warungName, exact: true })).toBeVisible()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    await page.screenshot({ path: path.join(output, 'explore-mobile.png'), fullPage: true })
    await page.goto(`${base}/restaurants/${warung.slug}`)
    await expect(page.getByRole('heading', { name: warungName, exact: true })).toBeVisible()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    await page.screenshot({ path: path.join(output, 'detail-mobile.png'), fullPage: true })
  })
  await step('UMKM registration creates a pending account, not a customer', async () => {
    await page.goto(`${base}/account`)
    await page.getByRole('button', { name: 'Keluar dari akun', exact: true }).click()
    await expect(page.getByText('Kamu sudah keluar dari akun.', { exact: true })).toBeVisible()
    await page.goto(`${base}/register?role=umkm`)
    for (const [label, value] of [['Nama lengkap', 'Pemilik Browser'], ['Email', `ui-umkm-${tag}@example.test`], ['Password', password], ['Konfirmasi password', password], ['Nama warung', `Warung UI ${tag}`], ['Nama pemilik', 'Pemilik Browser'], ['Nomor telepon usaha', '081234567890'], ['Alamat warung', 'Alamat fiktif pengujian UMKM']]) await page.getByLabel(label, { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Buat akun UMKM', exact: true }).click()
    await expect(page).toHaveURL(`${base}/account`)
    await expect(page.getByText('Pemilik warung', { exact: true })).toBeVisible()
    await expect(page.getByText('Menunggu persetujuan', { exact: true })).toBeVisible()
  })
  await step('UMKM uploads storefront and submits application through UI', async () => {
    await page.getByRole('link', { name: 'Buka dashboard UMKM', exact: true }).click()
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
    await page.getByLabel('Foto tampak depan (JPG/PNG, maksimal 2 MB)', { exact: true }).setInputFiles({
      name: 'storefront.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB9sAAAAASUVORK5CYII=', 'base64'),
    })
    await page.getByRole('button', { name: 'Unggah foto tampak depan', exact: true }).click()
    await expect(page.getByAltText('Foto tampak depan pengajuan')).toBeVisible()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Kirim pengajuan', exact: true }).click()
    await expect(page.getByText('PENDING', { exact: true })).toBeVisible()
    await page.goto(`${base}/admin`)
    await expect(page.getByRole('heading', { name: 'Akses tidak tersedia' })).toBeVisible()
  })
  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()
  adminPage.on('pageerror', (error) => errors.push(error.message))
  await step('Admin examines application and requests revision through UI', async () => {
    await adminPage.goto(`${base}/login?next=/admin`)
    await adminPage.getByLabel('Email', { exact: true }).fill(process.env.ADMIN_EMAIL)
    await adminPage.getByLabel('Password', { exact: true }).fill(process.env.ADMIN_PASSWORD)
    await adminPage.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(adminPage.getByRole('heading', { name: 'Dashboard Admin', exact: true })).toBeVisible()
    await adminPage.getByRole('button', { name: `Periksa Warung UI ${tag}`, exact: true }).click()
    await expect(adminPage.getByAltText('Foto pengajuan')).toBeVisible()
    await adminPage.getByLabel('Keputusan', { exact: true }).selectOption('REVISION')
    await adminPage.getByLabel('Catatan keputusan', { exact: true }).fill('Lengkapi jenis usaha untuk pengujian.')
    adminPage.once('dialog', (dialog) => dialog.accept())
    await adminPage.getByRole('button', { name: 'Simpan keputusan', exact: true }).click()
    await expect(adminPage.getByText('Status: REVISION', { exact: true })).toBeVisible()
  })
  await step('Owner revises and resubmits; Admin approves through UI', async () => {
    await page.goto(`${base}/umkm`)
    await expect(page.getByText('REVISION', { exact: true })).toBeVisible()
    await page.getByLabel('Jenis usaha', { exact: true }).fill('Warung makan QA')
    await page.getByRole('button', { name: 'Simpan identitas usaha', exact: true }).click()
    await expect(page.getByLabel('Jenis usaha', { exact: true })).toHaveValue('Warung makan QA')
    // Wait for the save request before submitting the persisted snapshot.
    await expect(page.getByRole('button', { name: 'Simpan identitas usaha', exact: true })).toBeEnabled()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Kirim pengajuan', exact: true }).click()
    await expect(page.getByText('PENDING', { exact: true })).toBeVisible()
    await adminPage.reload()
    await adminPage.getByRole('button', { name: `Periksa Warung UI ${tag}`, exact: true }).click()
    await adminPage.getByLabel('Keputusan', { exact: true }).selectOption('APPROVED')
    adminPage.once('dialog', (dialog) => dialog.accept())
    await adminPage.getByRole('button', { name: 'Simpan keputusan', exact: true }).click()
    await expect(adminPage.getByText('Status: APPROVED', { exact: true })).toBeVisible()
  })
  await step('Approved owner updates profile, menu, hours and reference selections', async () => {
    await page.goto(`${base}/umkm`)
    await expect(page.getByRole('heading', { name: 'Profil warung', exact: true })).toBeVisible()
    await page.getByLabel('Harga minimum', { exact: true }).fill('10000')
    await page.getByLabel('Harga maksimum', { exact: true }).fill('25000')
    await page.getByLabel('Kategori', { exact: true }).selectOption(category.id)
    await page.getByLabel('Status buka', { exact: true }).selectOption('OPEN')
    await page.getByRole('button', { name: 'Simpan profil warung', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simpan profil warung', exact: true })).toBeEnabled()
    await page.getByLabel('Nama menu', { exact: true }).fill('Nasi UI Demo')
    await page.getByLabel('Harga menu', { exact: true }).fill('18000')
    await page.getByRole('button', { name: 'Tambah menu', exact: true }).click()
    await expect(page.locator('summary').filter({ hasText: 'Nasi UI Demo' })).toBeVisible()
    await page.getByRole('button', { name: 'Simpan jadwal', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simpan jadwal', exact: true })).toBeEnabled()
    const facilitySection = page.locator('section.management-card').filter({ has: page.getByRole('heading', { name: 'Fasilitas', exact: true }) })
    await facilitySection.getByLabel(meta.facilities[0].name, { exact: true }).check()
    await facilitySection.getByRole('button', { name: 'Simpan', exact: true }).click()
    await expect(facilitySection.getByRole('status')).toHaveText('Berhasil disimpan.')
    await page.screenshot({ path: path.join(output, 'umkm-mobile.png'), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  })
  await step('Customer writes, edits and reports; owner replies; Admin moderates', async () => {
    const customerContext = await browser.newContext({ viewport: { width: 1365, height: 900 } })
    const customerPage = await customerContext.newPage()
    customerPage.on('pageerror', (error) => errors.push(error.message))
    const publicPath = await page.getByRole('link', { name: 'Lihat halaman publik', exact: true }).getAttribute('href')
    await customerPage.goto(`${base}/login?next=${encodeURIComponent(publicPath)}`)
    await customerPage.getByLabel('Email', { exact: true }).fill(email)
    await customerPage.getByLabel('Password', { exact: true }).fill(password)
    await customerPage.getByRole('button', { name: 'Masuk', exact: true }).click()
    await expect(customerPage.getByRole('heading', { name: 'Tulis ulasan', exact: true })).toBeVisible()
    for (const label of ['Rasa', 'Harga', 'Porsi', 'Kebersihan', 'Kenyamanan', 'Kecepatan']) await customerPage.getByLabel(label, { exact: true }).selectOption('4')
    await customerPage.getByLabel('Komentar', { exact: true }).fill('Ulasan fiktif dari browser QA.')
    await customerPage.getByRole('button', { name: 'Kirim ulasan', exact: true }).click()
    await expect(customerPage.getByText('Ulasan fiktif dari browser QA.', { exact: true })).toBeVisible()
    await customerPage.goto(`${base}/reviews`)
    await customerPage.getByLabel('Komentar', { exact: true }).fill('Ulasan fiktif telah diperbarui.')
    await customerPage.getByRole('button', { name: 'Perbarui ulasan', exact: true }).click()
    await expect(customerPage.getByRole('status')).toContainText('Berhasil disimpan.')
    await page.reload()
    await page.getByLabel('Balasan untuk Mahasiswa Uji Browser', { exact: true }).fill('Terima kasih atas ulasan pengujian.')
    await page.getByRole('button', { name: 'Simpan balasan', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Simpan balasan', exact: true })).toBeEnabled()
    await customerPage.goto(base + publicPath)
    await expect(customerPage.getByText('Balasan pemilik: Terima kasih atas ulasan pengujian.', { exact: true })).toBeVisible()
    await customerPage.getByText('Laporkan ulasan', { exact: true }).click()
    await customerPage.getByLabel('Alasan laporan', { exact: true }).first().fill('Laporan pengujian moderasi')
    await customerPage.getByRole('button', { name: 'Kirim laporan ulasan', exact: true }).click()
    await expect(customerPage.getByRole('status')).toContainText('Berhasil disimpan.')
    await adminPage.getByRole('button', { name: 'Laporan', exact: true }).click()
    await expect(adminPage.getByRole('heading', { name: 'Laporan pengujian moderasi', exact: true })).toBeVisible()
    const moderationReport = adminPage.locator('article.management-card').filter({ has: adminPage.getByRole('heading', { name: 'Laporan pengujian moderasi', exact: true }) })
    adminPage.once('dialog', (dialog) => dialog.accept())
    await moderationReport.getByRole('button', { name: 'Moderasi ulasan', exact: true }).click()
    await expect(moderationReport.getByRole('status')).toHaveText('Berhasil disimpan.')
    await customerPage.reload()
    await expect(customerPage.getByText('Ulasan fiktif telah diperbarui.', { exact: true })).toHaveCount(0)
    await adminPage.screenshot({ path: path.join(output, 'admin-desktop.png'), fullPage: true })
    await customerContext.close()
  })
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
