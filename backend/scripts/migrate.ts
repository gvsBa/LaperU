import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { env } from '../src/config/env.js'

const migrationPath = fileURLToPath(new URL('../database/migrations/001_initial_schema.sql', import.meta.url))
const sql = await readFile(migrationPath, 'utf8')
const databaseUrl = new URL(env.DATABASE_URL)
const databaseName = databaseUrl.pathname.slice(1)
if (!/^[A-Za-z0-9_]+$/.test(databaseName)) throw new Error('Nama database pada DATABASE_URL tidak valid.')
databaseUrl.pathname = ''
const bootstrapConnection = await mysql.createConnection({ uri: databaseUrl.toString() })
await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
await bootstrapConnection.end()

const connection = await mysql.createConnection({ uri: env.DATABASE_URL, multipleStatements: true })

try {
  await connection.query(sql)
  process.stdout.write('Migrasi database LaperU berhasil.\n')
} finally {
  await connection.end()
}
