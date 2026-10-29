import { spawn } from 'node:child_process'
import { mkdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
const url = new URL(env.DATABASE_URL)
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/laperu') throw new Error('Backup ini khusus database lokal laperu.')
const directory = new URL('../backups.local/', import.meta.url)
await mkdir(directory, { recursive: true })
const output = fileURLToPath(new URL(`laperu-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`, directory))
await new Promise<void>((resolve, reject) => {
  const child = spawn('C:/xampp/mysql/bin/mysqldump.exe', ['--no-defaults', '--host=' + url.hostname, '--port=' + (url.port || '3306'), '--user=' + decodeURIComponent(url.username), '--single-transaction', '--routines', '--result-file=' + output, 'laperu'], { windowsHide: true, stdio: 'ignore', env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) } })
  child.on('error', () => reject(new Error('Tidak dapat menjalankan backup XAMPP.')))
  child.on('exit', code => code === 0 ? resolve() : reject(new Error('Backup database gagal.')))
})
if ((await stat(output)).size < 100) throw new Error('Backup kosong.')
console.log('Backup database lokal tersimpan di backend/backups.local; tidak masuk Git.')
