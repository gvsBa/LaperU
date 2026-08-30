import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/api-error.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'
import { idParamSchema, reportSchema, reviewListSchema, reviewSchema, reviewUpdateSchema } from './customer.schemas.js'

interface GenericRow extends RowDataPacket { [key: string]: unknown }

export const customerRouter = Router()
customerRouter.use(authenticate, requireRole('CUSTOMER'))

customerRouter.get('/favorites', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute<GenericRow[]>(
    `SELECT w.id, w.name, w.slug, w.address, w.price_min AS priceMin, w.price_max AS priceMax,
      f.created_at AS favoritedAt,
      COALESCE((SELECT AVG((r.taste_rating + r.price_rating + r.portion_rating + r.cleanliness_rating + r.comfort_rating + r.speed_rating) / 6) FROM reviews r WHERE r.warung_id = w.id AND r.status = 'VISIBLE'), 0) AS rating
     FROM favorites f JOIN warungs w ON w.id = f.warung_id
     WHERE f.user_id = ? AND w.is_active = 1 ORDER BY f.created_at DESC`,
    [req.auth!.sub],
  )
  sendOk(res, rows)
}))

customerRouter.post('/favorites/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const id = String(req.params.id)
  await pool.execute('INSERT IGNORE INTO favorites (user_id, warung_id) VALUES (?, ?)', [req.auth!.sub, id])
  sendOk(res, null, 201, 'Warung ditambahkan ke favorit.')
}))

customerRouter.delete('/favorites/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const id = String(req.params.id)
  await pool.execute('DELETE FROM favorites WHERE user_id = ? AND warung_id = ?', [req.auth!.sub, id])
  sendOk(res, null, 200, 'Warung dihapus dari favorit.')
}))

customerRouter.get('/reviews', validate(reviewListSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { limit: number; page: number }
  const offset = (query.page - 1) * query.limit
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT r.id, r.warung_id AS warungId, w.name AS warungName, w.slug AS warungSlug,
      r.taste_rating AS tasteRating, r.price_rating AS priceRating, r.portion_rating AS portionRating,
      r.cleanliness_rating AS cleanlinessRating, r.comfort_rating AS comfortRating, r.speed_rating AS speedRating,
      (r.taste_rating + r.price_rating + r.portion_rating + r.cleanliness_rating + r.comfort_rating + r.speed_rating) / 6 AS averageRating,
      r.comment, r.status, r.created_at AS createdAt, r.updated_at AS updatedAt,
      rr.reply_text AS umkmReply, rr.updated_at AS repliedAt
     FROM reviews r JOIN warungs w ON w.id = r.warung_id
     LEFT JOIN review_replies rr ON rr.review_id = r.id
     WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [req.auth!.sub, query.limit, offset],
  )
  const [count] = await pool.query<Array<RowDataPacket & { total: number }>>('SELECT COUNT(*) AS total FROM reviews WHERE user_id = ?', [req.auth!.sub])
  const total = count[0]?.total ?? 0
  sendOk(res, { items: rows, pagination: { limit: query.limit, page: query.page, total, totalPages: Math.ceil(total / query.limit) } })
}))

customerRouter.post('/reviews', validate(reviewSchema), asyncHandler(async (req, res) => {
  const id = randomUUID()
  const body = req.body
  try {
    await pool.execute(
      `INSERT INTO reviews (id, user_id, warung_id, taste_rating, price_rating, portion_rating, cleanliness_rating, comfort_rating, speed_rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.auth!.sub, body.warungId, body.tasteRating, body.priceRating, body.portionRating, body.cleanlinessRating, body.comfortRating, body.speedRating, body.comment ?? null],
    )
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      throw new ApiError(409, 'REVIEW_EXISTS', 'Kamu sudah memberikan ulasan untuk warung ini.')
    }
    throw error
  }
  sendOk(res, { id }, 201, 'Ulasan berhasil dibuat.')
}))

customerRouter.patch('/reviews/:id', validate(idParamSchema, 'params'), validate(reviewUpdateSchema), asyncHandler(async (req, res) => {
  const id = String(req.params.id)
  const columns: Record<string, string> = {
    cleanlinessRating: 'cleanliness_rating', comfortRating: 'comfort_rating', comment: 'comment',
    portionRating: 'portion_rating', priceRating: 'price_rating', speedRating: 'speed_rating', tasteRating: 'taste_rating',
  }
  const entries = Object.entries(req.body as Record<string, unknown>).filter(([key]) => columns[key])
  const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(', ')
  const values = entries.map(([, value]) => value as string | number | boolean | null)
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE reviews SET ${assignments}, updated_at = NOW() WHERE id = ? AND user_id = ?`,
    [...values, id, req.auth!.sub],
  )
  if (!result.affectedRows) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.')
  sendOk(res, null, 200, 'Ulasan berhasil diperbarui.')
}))

customerRouter.delete('/reviews/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const id = String(req.params.id)
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM reviews WHERE id = ? AND user_id = ?', [id, req.auth!.sub])
  if (!result.affectedRows) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.')
  sendOk(res, null, 200, 'Ulasan berhasil dihapus.')
}))

customerRouter.post('/reports', validate(reportSchema), asyncHandler(async (req, res) => {
  const id = randomUUID()
  const body = req.body
  await pool.execute(
    'INSERT INTO reports (id, reporter_id, target_type, target_id, reason, detail, status) VALUES (?, ?, ?, ?, ?, ?, \'OPEN\')',
    [id, req.auth!.sub, body.targetType, body.targetId, body.reason, body.detail ?? null],
  )
  sendOk(res, { id }, 201, 'Laporan diterima dan akan diperiksa admin.')
}))
