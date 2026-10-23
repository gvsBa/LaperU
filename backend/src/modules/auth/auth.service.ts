import { createHash, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { env } from '../../config/env.js'
import { pool } from '../../db/pool.js'
import type { PublicUser, UserRole, UserStatus } from '../../types/domain.js'
import { ApiError } from '../../utils/api-error.js'
import type { CustomerRegistrationInput, LoginInput, UmkmRegistrationInput } from './auth.schemas.js'

interface UserRow extends RowDataPacket {
  email: string
  fullName: string
  id: string
  passwordHash: string
  role: UserRole
  status: UserStatus
}

interface RefreshRow extends UserRow {
  refreshId: string
}

interface SessionMetadata {
  ip?: string
  userAgent?: string
}

function publicUser(row: UserRow): PublicUser {
  return { email: row.email, fullName: row.fullName, id: row.id, role: row.role, status: row.status }
}

function duplicateEntry(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY'
}

function accessToken(user: PublicUser) {
  const options: SignOptions = {
    audience: 'laperu-web',
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
    issuer: 'laperu-api',
    subject: user.id,
  }
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, options)
}

function hashRefreshToken(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

async function createSession(user: PublicUser, metadata: SessionMetadata, connection: PoolConnection | typeof pool = pool) {
  const refreshToken = randomBytes(48).toString('base64url')
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000)
  await connection.execute(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, user_agent, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), user.id, hashRefreshToken(refreshToken), metadata.userAgent ?? null, metadata.ip ?? null, expiresAt],
  )
  return { accessToken: accessToken(user), refreshToken, user }
}

export async function registerCustomer(input: CustomerRegistrationInput, metadata: SessionMetadata) {
  const id = randomUUID()
  const passwordHash = await bcrypt.hash(input.password, 12)
  try {
    await pool.execute(
      'INSERT INTO users (id, full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, \'CUSTOMER\', \'ACTIVE\')',
      [id, input.fullName, input.email, passwordHash],
    )
  } catch (error) {
    if (duplicateEntry(error)) throw new ApiError(409, 'EMAIL_EXISTS', 'Email sudah digunakan.')
    throw error
  }

  return createSession({ id, fullName: input.fullName, email: input.email, role: 'CUSTOMER', status: 'ACTIVE' }, metadata)
}

export async function registerUmkm(input: UmkmRegistrationInput, metadata: SessionMetadata) {
  const connection = await pool.getConnection()
  const userId = randomUUID()
  const profileId = randomUUID()
  const submissionId = randomUUID()
  const passwordHash = await bcrypt.hash(input.password, 12)

  try {
    await connection.beginTransaction()
    await connection.execute(
      'INSERT INTO users (id, full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, \'UMKM\', \'PENDING\')',
      [userId, input.fullName, input.email, passwordHash],
    )
    await connection.execute(
      'INSERT INTO umkm_profiles (id, user_id, business_name, owner_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [profileId, userId, input.businessName, input.ownerName, input.phone, input.address],
    )
    await connection.execute(
      'INSERT INTO umkm_submissions (id, umkm_profile_id, status) VALUES (?, ?, \'DRAFT\')',
      [submissionId, profileId],
    )
    const session = await createSession(
      { id: userId, fullName: input.fullName, email: input.email, role: 'UMKM', status: 'PENDING' },
      metadata,
      connection,
    )
    await connection.commit()
    return session
  } catch (error) {
    await connection.rollback()
    if (duplicateEntry(error)) throw new ApiError(409, 'EMAIL_EXISTS', 'Email sudah digunakan.')
    throw error
  } finally {
    connection.release()
  }
}

export async function login(input: LoginInput, metadata: SessionMetadata) {
  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id, full_name AS fullName, email, password_hash AS passwordHash, role, status FROM users WHERE email = ? LIMIT 1',
    [input.email],
  )
  const user = rows[0]
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi salah.')
  }
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Akun sedang ditangguhkan.')
  return createSession(publicUser(user), metadata)
}

async function rotateSession(token: string, metadata: SessionMetadata) {
  const hash = hashRefreshToken(token)
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    // Claim exactly one valid token before reading the joined user. The
    // conditional UPDATE serializes competing requests without locking users
    // in a different order from the refresh-token foreign-key insert.
    const [claim] = await connection.execute<ResultSetHeader>(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()',
      [hash],
    )
    if (claim.affectedRows !== 1) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Sesi sudah tidak berlaku.')
    const [rows] = await connection.execute<RefreshRow[]>(
      `SELECT rt.id AS refreshId, u.id, u.full_name AS fullName, u.email, u.password_hash AS passwordHash, u.role, u.status
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? LIMIT 1`,
      [hash],
    )
    const row = rows[0]
    if (!row || row.status === 'SUSPENDED') throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Sesi sudah tidak berlaku.')

    const session = await createSession(publicUser(row), metadata, connection)
    await connection.commit()
    return session
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function refreshSession(token: string, metadata: SessionMetadata) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await rotateSession(token, metadata)
    } catch (error) {
      // InnoDB can pick either competing transaction as a deadlock victim.
      // rotateSession has rolled back and released its connection, so retrying
      // the complete claim is safe and re-checks whether the token was consumed.
      const deadlock = typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_LOCK_DEADLOCK'
      if (!deadlock || attempt >= 2) throw error
    }
  }
}

export async function revokeRefreshToken(token: string) {
  await pool.execute('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?', [hashRefreshToken(token)])
}

export async function getUserById(id: string) {
  const [rows] = await pool.execute<UserRow[]>(
    'SELECT id, full_name AS fullName, email, password_hash AS passwordHash, role, status FROM users WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ? publicUser(rows[0]) : null
}
