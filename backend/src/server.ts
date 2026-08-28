import { app } from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { pool } from './db/pool.js'

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, `LaperU API berjalan di http://localhost:${env.PORT}/api/v1`)
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
