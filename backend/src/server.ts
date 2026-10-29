import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { pool } from './db/pool.js'

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info({ host: env.HOST, port: env.PORT }, `LaperU API berjalan di http://${env.HOST}:${env.PORT}/api/v1`)
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Menghentikan server LaperU')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))
