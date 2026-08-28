import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { env } from '../src/config/env.js'
import { pool } from '../src/db/pool.js'

const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12)

await pool.execute(
  `INSERT INTO users (id, full_name, email, password_hash, role, status)
   VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE')
   ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), status = 'ACTIVE'`,
  [randomUUID(), env.ADMIN_NAME, env.ADMIN_EMAIL.toLowerCase(), passwordHash],
)

const categories = ['Nasi', 'Mie', 'Ayam', 'Bakso', 'Camilan', 'Kopi', 'Minuman']
const facilities = ['Wi-Fi', 'Colokan', 'Parkir', 'Tempat Duduk', 'Cocok untuk Tugas', 'Cocok untuk Rombongan']
const payments = ['Tunai', 'QRIS', 'Transfer Bank', 'Kartu Debit']
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

for (const name of categories) {
  await pool.execute('INSERT IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)', [randomUUID(), name, slug(name)])
}
for (const name of facilities) {
  await pool.execute('INSERT IGNORE INTO facilities (id, name, slug) VALUES (?, ?, ?)', [randomUUID(), name, slug(name)])
}
for (const name of payments) {
  await pool.execute('INSERT IGNORE INTO payment_methods (id, name, slug) VALUES (?, ?, ?)', [randomUUID(), name, slug(name)])
}

await pool.end()
process.stdout.write(`Seed selesai. Admin: ${env.ADMIN_EMAIL}\n`)
