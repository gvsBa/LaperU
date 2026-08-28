import mysql from 'mysql2/promise'
import { env } from '../config/env.js'

export const pool = mysql.createPool({
  decimalNumbers: true,
  enableKeepAlive: true,
  maxIdle: 5,
  queueLimit: 0,
  uri: env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
})

export async function checkDatabase() {
  await pool.query('SELECT 1')
}
