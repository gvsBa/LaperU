import pino, { type LoggerOptions } from 'pino'
import { env } from './env.js'

export const loggerOptions: LoggerOptions = {
  enabled: env.NODE_ENV !== 'test',
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', 'req.body.password'],
    censor: '[REDACTED]',
  },
}

export const logger = pino(loggerOptions)
