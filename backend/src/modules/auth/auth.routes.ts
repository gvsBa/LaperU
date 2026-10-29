import { Router, type Request, type Response } from 'express'
import { env } from '../../config/env.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/api-error.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'
import { customerRegistrationSchema, loginSchema, umkmRegistrationSchema } from './auth.schemas.js'
import { getUserById, login, refreshSession, registerCustomer, registerUmkm, revokeRefreshToken } from './auth.service.js'

export const authRouter = Router()
const refreshCookie = 'laperu_refresh_token'

function metadata(req: Request) {
  return { ip: req.ip, userAgent: req.get('user-agent') }
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(refreshCookie, token, {
    httpOnly: true,
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  })
}

authRouter.post('/register/customer', validate(customerRegistrationSchema), asyncHandler(async (req, res) => {
  const session = await registerCustomer(req.body, metadata(req))
  setRefreshCookie(res, session.refreshToken)
  sendOk(res, { accessToken: session.accessToken, user: session.user }, 201, 'Akun Customer berhasil dibuat.')
}))

authRouter.post('/register/umkm', validate(umkmRegistrationSchema), asyncHandler(async (req, res) => {
  const session = await registerUmkm(req.body, metadata(req))
  setRefreshCookie(res, session.refreshToken)
  sendOk(res, { accessToken: session.accessToken, user: session.user }, 201, 'Akun UMKM berhasil dibuat sebagai draft.')
}))

authRouter.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const session = await login(req.body, metadata(req))
  setRefreshCookie(res, session.refreshToken)
  sendOk(res, { accessToken: session.accessToken, user: session.user })
}))

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookie]
  if (typeof token !== 'string') throw new ApiError(401, 'MISSING_REFRESH_TOKEN', 'Sesi tidak ditemukan.')
  const session = await refreshSession(token, metadata(req))
  setRefreshCookie(res, session.refreshToken)
  sendOk(res, { accessToken: session.accessToken, user: session.user })
}))

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[refreshCookie]
  if (typeof token === 'string') await revokeRefreshToken(token)
  res.clearCookie(refreshCookie, { path: '/api/v1/auth' })
  sendOk(res, null, 200, 'Berhasil keluar.')
}))

authRouter.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await getUserById(req.auth!.sub)
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.')
  sendOk(res, user)
}))
