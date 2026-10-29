import { createHash, randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import bcrypt from 'bcryptjs'
import type { RowDataPacket } from 'mysql2/promise'
import { env } from '../src/config/env.js'
import { pool } from '../src/db/pool.js'

const database = new URL(env.DATABASE_URL)
if (!process.argv.includes('--local-demo') || env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(database.hostname)
  || !/^\/laperu(?:_test_[a-zA-Z0-9_]+)?$/.test(database.pathname)) throw new Error('Showcase hanya untuk database lokal laperu atau database QA.')
const id = (key: string) => { const h = createHash('sha256').update('laperu-showcase-v1:' + key).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}` }
const credentialFile = env.NODE_ENV === 'test' && process.env.LAPERU_SHOWCASE_CREDENTIALS
  ? process.env.LAPERU_SHOWCASE_CREDENTIALS : new URL('../.showcase-accounts.local.json', import.meta.url)
let password: string
try {
  const saved = JSON.parse(await readFile(credentialFile, 'utf8')) as { password?: unknown }
  if (typeof saved.password !== 'string' || saved.password.length < 20) throw new Error('File kredensial showcase tidak valid.')
  password = saved.password
} catch (error) {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error
  password = 'Demo1-' + randomBytes(18).toString('hex')
  await writeFile(credentialFile, JSON.stringify({ password, customerEmails: Array.from({ length: 36 }, (_, n) => `mahasiswa${n + 1}@showcase.laperu.local`), ownerEmails: Array.from({ length: 12 }, (_, n) => `pemilik${n + 1}@showcase.laperu.local`), warning: 'Akun SIMULASI, bukan identitas orang/usaha asli. Jangan unggah file ini.' }, null, 2), { flag: 'wx', mode: 0o600 })
}
const passwordHash = await bcrypt.hash(password, 12)
const blockedHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
interface Listing { name: string; address: string; category: string; summary: string; source: string; articleDate: string | null }
const listings = JSON.parse(await readFile(new URL('../data/public-listings.json', import.meta.url), 'utf8')) as Listing[]
const names = ['Dapur Senja', 'Kedai Pagi', 'Mie Sela Kelas', 'Ayam Teman Kos', 'Kopi Ruang Sore', 'Bakso Jam Istirahat', 'Nasi Rantau', 'Camilan Sudut', 'Dapur Hangat', 'Kopi Setelah Kelas', 'Mie Cerita', 'Juice Jeda']
const categories = ['Nasi', 'Nasi', 'Mie', 'Ayam', 'Kopi', 'Bakso', 'Nasi', 'Camilan', 'Ayam', 'Kopi', 'Mie', 'Minuman']
const menuNames: Record<string, string[]> = { Nasi: ['Nasi ayam', 'Nasi telur', 'Nasi goreng', 'Nasi sayur'], Mie: ['Mie ayam', 'Mie goreng', 'Mie kuah', 'Kwetiau'], Ayam: ['Ayam geprek', 'Ayam bakar', 'Ayam kremes', 'Ayam lada hitam'], Kopi: ['Kopi susu', 'Americano', 'Latte', 'Cokelat'], Bakso: ['Bakso halus', 'Bakso urat', 'Bakso telur', 'Mie bakso'], Camilan: ['Dimsum', 'Risol', 'Kentang goreng', 'Roti bakar'], Minuman: ['Jus mangga', 'Jus alpukat', 'Es jeruk', 'Lemon tea'] }
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  const [categoryRows] = await connection.query<Array<RowDataPacket & { id: string; name: string }>>('SELECT id, name FROM categories')
  const [facilities] = await connection.query<Array<RowDataPacket & { id: string }>>('SELECT id FROM facilities ORDER BY name')
  const [payments] = await connection.query<Array<RowDataPacket & { id: string }>>('SELECT id FROM payment_methods ORDER BY name')
  if (!categoryRows.length) throw new Error('Jalankan db:seed terlebih dahulu.')
  async function user(key: string, name: string, email: string, role: string, blocked = false) {
    await connection.execute('INSERT IGNORE INTO users (id, full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)', [id(key), name, email, blocked ? blockedHash : passwordHash, role, blocked ? 'SUSPENDED' : 'ACTIVE'])
  }
  async function listing(key: string, name: string, address: string, category: string, description: string, reference?: Listing) {
    const ownerKey = 'owner:' + key
    const index = names.indexOf(name.replace(' (Simulasi)', ''))
    await user(ownerKey, reference ? 'Pengelola referensi — bukan pemilik' : `Demo Pemilik ${index + 1}`, reference ? `${key}@reference.laperu.local` : `pemilik${index + 1}@showcase.laperu.local`, 'UMKM', Boolean(reference))
    await connection.execute('INSERT IGNORE INTO umkm_profiles (id,user_id,business_name,owner_name,phone,address) VALUES (?,?,?,?,?,?)', [id('profile:' + key), id(ownerKey), name, 'DATA REFERENSI / SIMULASI', 'TIDAK TERSEDIA', address])
    await connection.execute("INSERT IGNORE INTO umkm_submissions (id,umkm_profile_id,status,admin_note) VALUES (?,?,'APPROVED',?)", [id('submission:' + key), id('profile:' + key), 'Seed katalog demo; bukan verifikasi pemilik usaha.'])
    await connection.execute("INSERT IGNORE INTO warungs (id,umkm_profile_id,category_id,name,slug,description,address,price_min,price_max,status_override,approval_status) VALUES (?,?,?,?,?,?,?,?,?,?,'APPROVED')", [id(key), id('profile:' + key), categoryRows.find(row => row.name === category)?.id ?? null, name, key, description, address, reference ? null : 5000, reference ? null : 22000, reference ? 'AUTO' : index % 4 === 0 ? 'CLOSED' : 'OPEN'])
    await connection.execute('INSERT IGNORE INTO listing_sources (warung_id,source_url,checked_on,data_kind,note) VALUES (?,?,?,?,?)', [id(key), reference ? `https://canteen.telkomuniversity.ac.id/${reference.source}/` : null, '2026-10-29', reference ? 'PUBLIC_REFERENCE' : 'SIMULATION', reference ? `Direktori resmi Telkom University, hasil indeks publik. ${reference.articleDate ? 'Artikel/indeks bertanggal ' + reference.articleDate + '. ' : ''}Harga, jam, dan operasional belum dikonfirmasi langsung. Bukan pemilik terverifikasi.` : 'Usaha, menu, harga, ulasan dan aktivitas fiktif khusus demonstrasi. Bukan usaha nyata.'])
  }
  for (const item of listings) await listing('referensi-' + item.source, item.name, item.address, item.category, item.summary + ' Informasi referensi publik; konfirmasi sebelum berkunjung.', item)
  for (let n = 0; n < 36; n++) await user('customer:' + n, `Demo Mahasiswa ${String(n + 1).padStart(2, '0')}`, `mahasiswa${n + 1}@showcase.laperu.local`, 'CUSTOMER')
  for (let n = 0; n < names.length; n++) {
    const key = 'simulasi-' + String(n + 1).padStart(2, '0')
    await listing(key, names[n] + ' (Simulasi)', 'Lokasi fiktif untuk demo kawasan kampus — bukan alamat usaha nyata', categories[n]!, 'SIMULASI: tempat makan fiktif untuk mencoba pencarian, menu, ulasan dan pengelolaan UMKM. Tidak untuk kunjungan nyata.')
    const items = [...menuNames[categories[n]!]!, 'Es teh', 'Air mineral', 'Paket hemat', 'Paket lengkap']
    for (let m = 0; m < items.length; m++) await connection.execute('INSERT IGNORE INTO menu_items (id,warung_id,name,description,price,is_available) VALUES (?,?,?,?,?,?)', [id(`menu:${n}:${m}`), id(key), items[m] + ' — Simulasi', 'Menu dan harga fiktif untuk pengujian.', 5000 + m % 6 * 3000 + n % 3 * 1000, m !== 7])
    for (let day = 0; day < 7; day++) await connection.execute("INSERT IGNORE INTO operating_hours (warung_id,day_of_week,open_time,close_time,is_closed) VALUES (?,?,'08:00','21:00',?)", [id(key), day, day === 6 ? 1 : 0])
    for (const facility of facilities.slice(0, n % 4 + 1)) await connection.execute('INSERT IGNORE INTO warung_facilities (warung_id,facility_id) VALUES (?,?)', [id(key), facility.id])
    for (const payment of payments.slice(0, n % 3 + 1)) await connection.execute('INSERT IGNORE INTO warung_payment_methods (warung_id,payment_method_id) VALUES (?,?)', [id(key), payment.id])
    for (let v = 0; v < 30; v++) await connection.execute('INSERT IGNORE INTO warung_profile_views (id,warung_id,viewed_at) VALUES (?,?,DATE_SUB(NOW(), INTERVAL ? DAY))', [id(`view:${n}:${v}`), id(key), v % 20])
  }
  for (let n = 0; n < 36; n++) {
    for (let r = 0; r < 6; r++) {
      const warung = id('simulasi-' + String((n + r) % 12 + 1).padStart(2, '0'))
      await connection.execute('INSERT IGNORE INTO favorites (user_id,warung_id) VALUES (?,?)', [id('customer:' + n), warung])
      if (r < 5) {
        const review = id(`review:${n}:${r}`)
        const rating = 3 + (n + r) % 3
        await connection.execute('INSERT IGNORE INTO reviews (id,user_id,warung_id,taste_rating,price_rating,portion_rating,cleanliness_rating,comfort_rating,speed_rating,comment) VALUES (?,?,?,?,?,?,?,?,?,?)', [review, id('customer:' + n), warung, rating, rating, 4, 4, 4, rating, 'SIMULASI — contoh ulasan untuk demonstrasi fitur, bukan pengalaman pelanggan nyata.'])
        if (r % 2 === 0) await connection.execute('INSERT IGNORE INTO review_replies (review_id,warung_id,reply_text) VALUES (?,?,?)', [review, warung, 'SIMULASI — terima kasih, ini contoh balasan pemilik untuk demonstrasi.'])
      }
    }
  }
  await connection.commit()
  console.log('Showcase siap: 16 referensi publik + 12 usaha simulasi; 36 customer simulasi, 96 menu, 180 ulasan, 216 favorit, 360 tayangan. Seed idempotent; data lama tidak ditimpa. Kredensial privat tersimpan lokal.')
} catch (error) { await connection.rollback(); throw error }
finally { connection.release(); await pool.end() }
