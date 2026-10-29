import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Exclusive creation preserves existing credentials and database choices.
async function createIfMissing(relative, contents) {
  try {
    await writeFile(fileURLToPath(new URL(relative, import.meta.url)), contents, { flag: 'wx', mode: 0o600 })
    console.log(`Created ${relative}; keep this file private.`)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    console.log(`Preserved existing ${relative}.`)
  }
}
await createIfMissing('../.env', 'VITE_API_BASE_URL=/api/v1\n')
await createIfMissing('../backend/.env', [
  'NODE_ENV=development', 'PORT=3000',
  'FRONTEND_ORIGIN=http://127.0.0.1:5173',
  'PUBLIC_API_ORIGIN=http://127.0.0.1:3000',
  '# Local XAMPP default only. If root has a password, update this URL.',
  'DATABASE_URL=mysql://root@127.0.0.1:3306/laperu',
  `JWT_ACCESS_SECRET=${randomBytes(48).toString('hex')}`,
  `JWT_REFRESH_SECRET=${randomBytes(48).toString('hex')}`,
  'ADMIN_NAME=Admin LaperU', 'ADMIN_EMAIL=admin@laperu.local',
  `ADMIN_PASSWORD=Local1-${randomBytes(18).toString('hex')}`,
  'IMAGE_MAX_BYTES=2097152', 'ACCESS_TOKEN_TTL=15m', 'REFRESH_TOKEN_DAYS=30', '',
].join('\n'))
console.log('Start MySQL in XAMPP, check backend/.env, then run the migration and seed commands in README.md.')
console.log('Admin credentials are in backend/.env; they are deliberately not printed.')
