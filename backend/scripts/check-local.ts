import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { RowDataPacket } from 'mysql2/promise'
import { env } from '../src/config/env.js'
import { pool } from '../src/db/pool.js'
import { uploadDirectory } from '../src/modules/media/image-upload.js'

// Read-only readiness check: never creates accounts, changes passwords or
// prints DATABASE_URL, hashes, session tokens or private account credentials.
const database = new URL(env.DATABASE_URL)
if (!['127.0.0.1', 'localhost'].includes(database.hostname) || env.NODE_ENV === 'production') {
  throw new Error('Pemeriksaan ini khusus database lokal non-production.')
}
interface AccountRow extends RowDataPacket { role: string; status: string; passwordHash: string }
let failures = 0
function check(ok: boolean, label: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`)
  if (!ok) failures++
}
async function checkAccount(email: string, password: string, role: string) {
  const [rows] = await pool.execute<AccountRow[]>(
    'SELECT role, status, password_hash AS passwordHash FROM users WHERE email = ?', [email.toLowerCase()],
  )
  const account = rows[0]
  check(Boolean(account && account.role === role && account.status === 'ACTIVE'
    && await bcrypt.compare(password, account.passwordHash)), `${role}: akun aktif dan kredensial lokal cocok`)
}

try {
  await pool.query('SELECT 1')
  check(true, 'Koneksi database lokal')
  const directory = new URL('../database/migrations/', import.meta.url)
  const files = (await readdir(directory)).filter(name => /^\d+_.*\.sql$/.test(name)).sort()
  const sql = (await Promise.all(files.map(name => readFile(new URL(name, directory), 'utf8')))).join('\n')
  const expected = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)].map((match) => match[1]!)
  const [tables] = await pool.query<Array<RowDataPacket & { name: string }>>(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
  )
  const missing = expected.filter((name) => !tables.some((table) => table.name === name))
  check(expected.length > 0 && missing.length === 0, `${expected.length} tabel migrasi tersedia${missing.length ? `; kurang: ${missing.join(', ')}` : ''}`)
  await checkAccount(env.ADMIN_EMAIL, env.ADMIN_PASSWORD, 'ADMIN')
  const accounts = z.array(z.object({
    email: z.email(), password: z.string().min(12), role: z.enum(['CUSTOMER', 'UMKM']),
  })).length(2).parse(JSON.parse(await readFile(fileURLToPath(new URL('../.demo-accounts.local.json', import.meta.url)), 'utf8')))
  if (new Set(accounts.map((account) => account.role)).size !== 2) throw new Error('Role demo harus berbeda.')
  for (const account of accounts) {
    await checkAccount(account.email, account.password, account.role)
  }
  console.log(`INFO: Folder upload ${uploadDirectory}`)
  console.log('INFO: Pemeriksaan ini tidak menjalankan server atau menguji tampilan browser.')
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'CHECK_FAILED'
  check(false, `${code}. Pastikan MySQL XAMPP aktif, konfigurasi benar, migrasi dan seed lokal sudah dijalankan.`)
} finally {
  await pool.end()
  process.exitCode = failures ? 1 : 0
}
