import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ApiError } from '../utils/api-error.js'

export function validate(schema: ZodType, source: 'body' | 'params' | 'query' = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      next(new ApiError(422, 'VALIDATION_ERROR', 'Data yang dikirim belum valid.', result.error.flatten()))
      return
    }
    if (source === 'query') {
      // Express 5 exposes query through a getter. Keep a parsed request-local
      // value so defaults/coercion are visible to the downstream handler.
      Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true, enumerable: true })
    } else {
      req[source] = result.data
    }
    next()
  }
}
