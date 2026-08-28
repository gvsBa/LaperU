import { Router } from 'express'
import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'

interface GenericRow extends RowDataPacket { [key: string]: unknown }

export const metaRouter = Router()

metaRouter.get('/', asyncHandler(async (_req, res) => {
  const [[categories], [facilities], [paymentMethods]] = await Promise.all([
    pool.query<GenericRow[]>('SELECT id, name, slug FROM categories ORDER BY name'),
    pool.query<GenericRow[]>('SELECT id, name, slug FROM facilities ORDER BY name'),
    pool.query<GenericRow[]>('SELECT id, name, slug FROM payment_methods ORDER BY name'),
  ])
  sendOk(res, { categories, facilities, paymentMethods })
}))
