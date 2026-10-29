import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/api-error.js'

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`))
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  if (error instanceof ZodError) {
    res.status(422).json({ success: false, code: 'VALIDATION_ERROR', message: 'Data tidak valid.', details: error.flatten() })
    return
  }

  if (error && typeof error === 'object' && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({ success: false, code: 'INVALID_JSON', message: 'Format JSON tidak valid.' })
      return
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({ success: false, code: 'PAYLOAD_TOO_LARGE', message: 'Ukuran data permintaan terlalu besar.' })
      return
    }
  }

  // Driver errors can include the SQL statement and bound private values.
  // Log a bounded diagnostic code, never the raw error/message/stack/payload.
  const diagnosticCode = error && typeof error === 'object' && 'code' in error
    && typeof error.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(error.code) ? error.code : 'UNEXPECTED_ERROR'
  logger.error({ code: diagnosticCode }, 'Unhandled backend error')
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan pada server.',
  })
}
