import { app } from '../backend/dist/src/app.js'
import { env } from '../backend/dist/src/config/env.js'
import { pool } from '../backend/dist/src/db/pool.js'
const server = app.listen(env.PORT, '127.0.0.1')
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0) }))
