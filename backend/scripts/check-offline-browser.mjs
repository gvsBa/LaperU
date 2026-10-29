import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'
import { parse } from 'dotenv'

// This check uses existing local accounts, never creates or edits business data.
// Only normal authentication creates/revokes sessions. All browser HTTP traffic
// to non-loopback hosts is blocked, while localhost remains reachable.
const base = 'http://127.0.0.1:5173'
const settings = parse(await readFile(new URL('../.env', import.meta.url)))
const demoAccounts = JSON.parse(await readFile(new URL('../.demo-accounts.local.json', import.meta.url), 'utf8'))
const accounts = [
  { role: 'ADMIN', email: settings.ADMIN_EMAIL, password: settings.ADMIN_PASSWORD },
  ...demoAccounts,
]
assert.deepEqual(accounts.map((account) => account.role).sort(), ['ADMIN', 'CUSTOMER', 'UMKM'])
const routes = { ADMIN: '/admin', CUSTOMER: '/explore', UMKM: '/umkm' }
const endpoints = { ADMIN: '/admin/applications', CUSTOMER: '/warungs', UMKM: '/umkm/statistics' }
const browser = await chromium.launch({ headless: true })
const errors = []
let blocked = 0
try {
  for (const account of accounts) {
    assert.ok(account.email && account.password, 'Kredensial lokal belum lengkap; jalankan check:local.')
    const context = await browser.newContext({ serviceWorkers: 'block' })
    try {
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url())
        if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) await route.continue()
        else { blocked++; await route.abort() }
      })
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(error.message))
      const destination = routes[account.role]
      await page.goto(`${base}/login?next=${encodeURIComponent(destination)}`)
      await page.getByLabel('Email', { exact: true }).fill(account.email)
      await page.getByLabel('Password', { exact: true }).fill(account.password)
      const loggedIn = page.waitForResponse((response) => response.url().endsWith('/api/v1/auth/login') && response.request().method() === 'POST')
      const dataLoaded = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1' + endpoints[account.role] && response.status() === 200)
      await page.getByRole('button', { name: 'Masuk', exact: true }).click()
      const response = await loggedIn
      assert.equal(response.status(), 200, `Login ${account.role} gagal`)
      assert.equal((await response.json()).data.user.role, account.role)
      await expect(page).toHaveURL(base + destination)
      await dataLoaded
      await expect(page.locator('main').first()).toBeVisible()
      const logout = await context.request.post(base + '/api/v1/auth/logout')
      assert.equal(logout.status(), 200)
      console.log(`PASS: ${account.role} login dan data halaman lokal, akses internet browser diblokir`)
    } finally {
      await context.close()
    }
  }
  assert.deepEqual(errors, [], 'Browser mengalami JavaScript exception')
  console.log(`PASS: 3 peran, tanpa JavaScript exception; ${blocked} permintaan eksternal diblokir`)
} finally {
  await browser.close()
}
