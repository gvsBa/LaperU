import pino from 'pino'
import { env } from './env.js'

export const logger = pino({
  enabled: env.NODE_ENV !== 'test',
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
})
