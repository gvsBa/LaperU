import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { env } from '../src/config/env.js'

const migrationDirectory = new URL('../database/migrations/', import.meta.url)
const migrations = (await readdir(fileURLToPath(migrationDirectory))).filter((name) => /^\d+_.*\.sql$/.test(name)).sort()
const databaseUrl = new URL(env.DATABASE_URL)
const databaseName = databaseUrl.pathname.slice(1)
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) throw new Error('Nama database pada DATABASE_URL tidak valid.')
databaseUrl.pathname = ''
const bootstrapConnection = await mysql.createConnection({ uri: databaseUrl.toString() })
await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
await bootstrapConnection.end()

const connection = await mysql.createConnection({ uri: env.DATABASE_URL, multipleStatements: true })

try {
  for (const name of migrations) await connection.query(await readFile(new URL(name, migrationDirectory), 'utf8'))
  process.stdout.write('Migrasi database LaperU berhasil.\n')
} finally {
  await connection.end()
}
