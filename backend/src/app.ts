import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { checkDatabase } from './db/pool.js'
import { adminRouter } from './modules/admin/admin.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { customerRouter } from './modules/customer/customer.routes.js'
import { metaRouter } from './modules/meta/meta.routes.js'
import { umkmRouter } from './modules/umkm/umkm.routes.js'
import { publicWarungRouter } from './modules/warungs/warung.routes.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { asyncHandler } from './utils/async-handler.js'
import { sendOk } from './utils/response.js'

export const app = express()
const allowedOrigins = env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())

app.disable('x-powered-by')
app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }))
app.use(helmet())
app.use(cors({ credentials: true, origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/v1/health', (_req, res) => {
  sendOk(res, { environment: env.NODE_ENV, service: 'laperu-api', status: 'up', timestamp: new Date().toISOString() })
})

app.get('/api/v1/health/database', asyncHandler(async (_req, res) => {
  await checkDatabase()
  sendOk(res, { database: 'mysql', status: 'up' })
}))

const authLimiter = rateLimit({
  legacyHeaders: false,
  limit: env.NODE_ENV === 'test' ? 1000 : 30,
  message: { success: false, code: 'TOO_MANY_REQUESTS', message: 'Terlalu banyak percobaan. Coba lagi beberapa saat.' },
  standardHeaders: 'draft-8',
  windowMs: 15 * 60 * 1000,
})

app.use('/api/v1/auth', authLimiter, authRouter)
app.use('/api/v1/warungs', publicWarungRouter)
app.use('/api/v1/meta', metaRouter)
app.use('/api/v1/customer', customerRouter)
app.use('/api/v1/umkm', umkmRouter)
app.use('/api/v1/admin', adminRouter)

app.use(notFound)
app.use(errorHandler)
