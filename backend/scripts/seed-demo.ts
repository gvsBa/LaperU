import { randomBytes, randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { RowDataPacket } from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { env } from '../src/config/env.js'
import { pool } from '../src/db/pool.js'

const database = new URL(env.DATABASE_URL)
if (!process.argv.includes('--local-demo') || env.NODE_ENV === 'production'
  || !['127.0.0.1', 'localhost'].includes(database.hostname)
  || !/^\/laperu(?:_backend_demo|_test_[a-zA-Z0-9_]+)?$/.test(database.pathname)) {
  throw new Error('Demo seed hanya untuk database lokal laperu/laperu_backend_demo/laperu_test_* dengan flag --local-demo.')
}
// The disposable QA instance must never read or replace real demo credentials.
const credentialPath = env.NODE_ENV === 'test' && process.env.LAPERU_DEMO_CREDENTIALS
  ? process.env.LAPERU_DEMO_CREDENTIALS
  : fileURLToPath(new URL('../.demo-accounts.local.json', import.meta.url))
type DemoAccount = { email: string; password: string; fullName: string; role: 'CUSTOMER' | 'UMKM' }
let accounts: DemoAccount[]
try {
  const parsed = z.array(z.object({
    role: z.enum(['CUSTOMER', 'UMKM']),
    email: z.email().max(190).endsWith('.demo@laperu.local'),
    password: z.string().min(12).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
    fullName: z.string().min(6).max(120).startsWith('Demo '),
  })).length(2).safeParse(JSON.parse(await readFile(credentialPath, 'utf8')))
  if (!parsed.success || new Set(parsed.data.map((item) => item.role)).size !== 2
    || new Set(parsed.data.map((item) => item.email)).size !== 2) {
    throw new Error('Format file akun demo tidak valid. Tidak mengubah database.')
  }
  accounts = parsed.data
} catch (error) {
  if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
  accounts = [
    { email: 'customer.demo@laperu.local', role: 'CUSTOMER', fullName: 'Demo Mahasiswa', password: `Demo1-${randomBytes(18).toString('hex')}` },
    { email: 'owner.demo@laperu.local', role: 'UMKM', fullName: 'Demo Pemilik Warung', password: `Demo1-${randomBytes(18).toString('hex')}` },
  ]
  await writeFile(credentialPath, JSON.stringify(accounts, null, 2), { flag: 'wx', mode: 0o600 })
}
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  let ownerId = ''
  for (const account of accounts) {
    const [existing] = await connection.execute<Array<RowDataPacket & { id: string; role: string; passwordHash: string }>>(
      'SELECT id, role, password_hash AS passwordHash FROM users WHERE email = ?', [account.email],
    )
    if (existing[0] && (existing[0].role !== account.role || !(await bcrypt.compare(account.password, existing[0].passwordHash)))) {
      throw new Error('Akun demo sudah ada dengan identitas/kredensial berbeda. Tidak menimpa akun tersebut.')
    }
    const id = existing[0]?.id || randomUUID()
    if (!existing[0]) await connection.execute(
      "INSERT INTO users (id, full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')",
      [id, account.fullName, account.email, await bcrypt.hash(account.password, 12), account.role],
    )
    if (account.role === 'UMKM') ownerId = id
  }
  const [profiles] = await connection.execute<Array<RowDataPacket & { id: string }>>('SELECT id FROM umkm_profiles WHERE user_id = ?', [ownerId])
  if (!profiles[0]) {
    const profileId = randomUUID()
    const warungId = randomUUID()
    const [categories] = await connection.query<Array<RowDataPacket & { id: string }>>("SELECT id FROM categories WHERE slug = 'nasi' LIMIT 1")
    if (!categories[0]) throw new Error('Jalankan db:seed untuk membuat data referensi terlebih dahulu.')
    await connection.execute(
      'INSERT INTO umkm_profiles (id, user_id, business_name, owner_name, phone, address, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [profileId, ownerId, 'Demo Warung Mahasiswa', 'Demo Pemilik Warung', '080000000000', 'Area Telkom University — alamat fiktif untuk demo', 'Warung demo'],
    )
    await connection.execute(
      "INSERT INTO umkm_submissions (id, umkm_profile_id, status, admin_note, submitted_at, reviewed_at) VALUES (?, ?, 'APPROVED', ?, NOW(), NOW())",
      [randomUUID(), profileId, 'DATA DEMO: disiapkan seed lokal, bukan hasil verifikasi usaha nyata.'],
    )
    await connection.execute(
      "INSERT INTO warungs (id, umkm_profile_id, category_id, name, slug, description, address, price_min, price_max, status_override, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, 5000, 18000, 'OPEN', 'APPROVED')",
      [warungId, profileId, categories[0].id, 'Demo Warung Mahasiswa', 'demo-warung-mahasiswa',
        'DATA FIKTIF untuk presentasi dan pengujian. Bukan rekomendasi tempat makan nyata.',
        'Area Telkom University — alamat fiktif untuk demo'],
    )
    for (const [name, price] of [['Nasi Ayam Demo', 18000], ['Mie Goreng Demo', 15000], ['Es Teh Demo', 5000]] as const) {
      await connection.execute('INSERT INTO menu_items (id, warung_id, name, price) VALUES (?, ?, ?, ?)', [randomUUID(), warungId, name, price])
    }
    for (let day = 0; day < 7; day++) await connection.execute(
      "INSERT INTO operating_hours (warung_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, '08:00', '21:00', 0)", [warungId, day],
    )
  }
  await connection.commit()
  console.log(env.NODE_ENV === 'test' && process.env.LAPERU_DEMO_CREDENTIALS
    ? 'Data demo QA siap. Kredensial tersimpan hanya pada direktori sementara QA.'
    : 'Data demo lokal siap. Akun/password ada di backend/.demo-accounts.local.json (tidak masuk Git). Admin tetap menggunakan akun yang sudah ada.')
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
  await pool.end()
}
