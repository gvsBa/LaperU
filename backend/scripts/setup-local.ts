import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'dotenv'

// Bootstrap only a missing local config. Never modify another checkout or DB.
const output = new URL('../.env', import.meta.url)
try {
  const sourceIndex = process.argv.indexOf('--database-config')
  const sourcePath = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : undefined
  if (sourceIndex >= 0 && !sourcePath) throw new Error('Path --database-config diperlukan.')
  const source = sourcePath ? parse(await readFile(sourcePath)) : {}
  const database = new URL(source.DATABASE_URL || 'mysql://root@127.0.0.1:3306/laperu_backend_demo')
  if (database.protocol !== 'mysql:' || !['localhost', '127.0.0.1'].includes(database.hostname)) {
    throw new Error('Hanya konfigurasi MySQL lokal yang diperbolehkan.')
  }
  database.pathname = '/laperu_backend_demo'
  const values: Record<string, string> = {
    NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '3001',
    FRONTEND_ORIGIN: 'http://127.0.0.1:5174,http://localhost:5174',
    PUBLIC_API_ORIGIN: 'http://127.0.0.1:3001', DATABASE_URL: database.toString(),
    JWT_ACCESS_SECRET: randomBytes(48).toString('hex'), JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
    ADMIN_NAME: 'Admin LaperU', ADMIN_EMAIL: 'admin@laperu.local',
    ADMIN_PASSWORD: 'Local1-' + randomBytes(18).toString('hex'),
  }
  await writeFile(output, Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n', { flag: 'wx', mode: 0o600 })
  console.log('Konfigurasi privat backend/.env dibuat. Password tidak dicetak. Database terpisah: laperu_backend_demo; API port 3001.')
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.log('backend/.env sudah ada; tidak diubah. Periksa konfigurasi lokal Anda.')
  } else {
    console.error('Setup lokal gagal. Periksa path dan format konfigurasi MySQL lokal; detail rahasia tidak dicetak.')
    process.exitCode = 1
  }
}
