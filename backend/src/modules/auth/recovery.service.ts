import { createHash, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { ApiError } from '../../utils/api-error.js'

interface Account extends RowDataPacket { id: string; passwordHash: string; status: string }
const invalidRecovery = () => new ApiError(400, 'INVALID_RECOVERY', 'Email atau kode pemulihan tidak valid, sudah digunakan, atau akun tidak dapat dipulihkan.')
export const recoveryHash = (code: string) => createHash('sha256').update(code.replaceAll('-', '').toUpperCase()).digest('hex')

export async function generateRecoveryCodes(userId: string, currentPassword: string) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute<Account[]>('SELECT id, password_hash AS passwordHash, status FROM users WHERE id = ? FOR UPDATE', [userId])
    const account = rows[0]
    if (!account || account.status === 'SUSPENDED' || !await bcrypt.compare(currentPassword, account.passwordHash)) {
      throw new ApiError(403, 'REAUTHENTICATION_FAILED', 'Kata sandi saat ini tidak sesuai atau akun tidak aktif.')
    }
    const codes = Array.from({ length: 5 }, () => randomBytes(16).toString('hex').toUpperCase().match(/.{4}/g)!.join('-'))
    await connection.execute('DELETE FROM recovery_codes WHERE user_id = ?', [userId])
    for (const code of codes) await connection.execute('INSERT INTO recovery_codes (id, user_id, code_hash) VALUES (?, ?, ?)', [randomUUID(), userId, recoveryHash(code)])
    await connection.commit()
    return { codes }
  } catch (error) { await connection.rollback(); throw error }
  finally { connection.release() }
}

async function applyPassword(connection: PoolConnection, userId: string, passwordHash: string) {
  await connection.execute('UPDATE users SET password_hash = ?, auth_version = auth_version + 1, updated_at = NOW() WHERE id = ?', [passwordHash, userId])
  await connection.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL', [userId])
  // Invalidate the entire previous recovery set after a password change.
  await connection.execute('UPDATE recovery_codes SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [userId])
}

export async function recoverPassword(email: string, code: string, newPassword: string) {
  // Hash before lookup so unknown accounts take the same expensive path.
  const hash = await bcrypt.hash(newPassword, 12)
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [users] = await connection.execute<Account[]>('SELECT id, status FROM users WHERE email = ? FOR UPDATE', [email])
    const user = users[0]
    if (!user || user.status === 'SUSPENDED') throw invalidRecovery()
    const [codes] = await connection.execute<RowDataPacket[]>('SELECT id FROM recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL FOR UPDATE', [user.id, recoveryHash(code)])
    if (!codes[0]) throw invalidRecovery()
    await applyPassword(connection, user.id, hash)
    await connection.commit()
  } catch (error) { await connection.rollback(); throw error }
  finally { connection.release() }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const hash = await bcrypt.hash(newPassword, 12)
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute<Account[]>('SELECT id, password_hash AS passwordHash, status FROM users WHERE id = ? FOR UPDATE', [userId])
    const user = rows[0]
    if (!user || user.status === 'SUSPENDED' || !await bcrypt.compare(currentPassword, user.passwordHash)) throw new ApiError(403, 'REAUTHENTICATION_FAILED', 'Kata sandi saat ini tidak sesuai.')
    await applyPassword(connection, userId, hash)
    await connection.commit()
  } catch (error) { await connection.rollback(); throw error }
  finally { connection.release() }
}
