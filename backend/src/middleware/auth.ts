import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2/promise'
import { env } from '../config/env.js'
import { pool } from '../db/pool.js'
import type { UserRole, UserStatus } from '../types/domain.js'
import { ApiError } from '../utils/api-error.js'
import { asyncHandler } from '../utils/async-handler.js'

interface ActiveUserRow extends RowDataPacket {
  role: UserRole
  status: UserStatus
  authVersion: number
}

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan masuk terlebih dahulu.')

  let userId: string
  let version: number
  try {
    const decoded = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET, {
      audience: 'laperu-web',
      issuer: 'laperu-api',
    })
    if (typeof decoded === 'string' || !decoded.sub || typeof decoded.role !== 'string') throw new Error('Invalid token')
    userId = decoded.sub
    version = typeof decoded.version === 'number' ? decoded.version : 0
  } catch {
    throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Sesi tidak valid atau sudah kedaluwarsa.')
  }

  const [rows] = await pool.execute<ActiveUserRow[]>('SELECT role, status, auth_version AS authVersion FROM users WHERE id = ? LIMIT 1', [userId])
  const user = rows[0]
  if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Akun tidak ditemukan.')
  if (user.status === 'SUSPENDED') throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Akun sedang ditangguhkan.')
  if (version !== (user.authVersion ?? 0)) throw new ApiError(401, 'INVALID_ACCESS_TOKEN', 'Kata sandi telah berubah. Silakan masuk kembali.')
  req.auth = { sub: userId, role: user.role }
  next()
})

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError(403, 'FORBIDDEN', 'Kamu tidak memiliki akses ke fitur ini.'))
      return
    }
    next()
  }
}
