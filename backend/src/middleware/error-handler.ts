import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { env } from '../config/env.js'
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

  logger.error(error)
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan pada server.',
    ...(env.NODE_ENV === 'development' && error instanceof Error ? { detail: error.message } : {}),
  })
}
