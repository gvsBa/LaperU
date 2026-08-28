import { Router } from 'express'
import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/api-error.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'
import { warungListSchema, warungSlugSchema } from './warung.schemas.js'

interface CountRow extends RowDataPacket { total: number }
interface GenericRow extends RowDataPacket { [key: string]: unknown }

const ratingExpression = `COALESCE((SELECT AVG((r.taste_rating + r.price_rating + r.portion_rating + r.cleanliness_rating + r.comfort_rating + r.speed_rating) / 6) FROM reviews r WHERE r.warung_id = w.id AND r.status = 'VISIBLE'), 0)`
const openExpression = `CASE
  WHEN w.status_override = 'CLOSED' THEN 0
  WHEN w.status_override = 'OPEN' THEN 1
  ELSE EXISTS(
    SELECT 1 FROM operating_hours oh
    WHERE oh.warung_id = w.id AND oh.day_of_week = WEEKDAY(NOW())
      AND oh.is_closed = 0 AND CURTIME() BETWEEN oh.open_time AND oh.close_time
  ) END`

export const publicWarungRouter = Router()

publicWarungRouter.get('/', validate(warungListSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as {
    category?: string; facility?: string; limit: number; maxPrice?: number; minPrice?: number
    minRating?: number; openNow?: boolean; page: number; payment?: string; q?: string
  }
  const where = [`w.approval_status = 'APPROVED'`, `w.is_active = 1`]
  const params: Array<string | number> = []

  if (query.q) {
    where.push(`(w.name LIKE ? OR w.description LIKE ? OR EXISTS (SELECT 1 FROM menu_items mi WHERE mi.warung_id = w.id AND mi.is_active = 1 AND mi.name LIKE ?))`)
    const term = `%${query.q}%`
    params.push(term, term, term)
  }
  if (query.minPrice !== undefined) { where.push('w.price_max >= ?'); params.push(query.minPrice) }
  if (query.maxPrice !== undefined) { where.push('w.price_min <= ?'); params.push(query.maxPrice) }
  if (query.category) {
    where.push('EXISTS (SELECT 1 FROM categories c WHERE c.id = w.category_id AND c.slug = ?)')
    params.push(query.category)
  }
  if (query.facility) {
    where.push('EXISTS (SELECT 1 FROM warung_facilities wf JOIN facilities f ON f.id = wf.facility_id WHERE wf.warung_id = w.id AND f.slug = ?)')
    params.push(query.facility)
  }
  if (query.payment) {
    where.push('EXISTS (SELECT 1 FROM warung_payment_methods wp JOIN payment_methods pm ON pm.id = wp.payment_method_id WHERE wp.warung_id = w.id AND pm.slug = ?)')
    params.push(query.payment)
  }
  if (query.minRating !== undefined) { where.push(`${ratingExpression} >= ?`); params.push(query.minRating) }
  if (query.openNow) where.push(`${openExpression} = 1`)

  const whereSql = where.join(' AND ')
  const offset = (query.page - 1) * query.limit
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT w.id, w.name, w.slug, w.address, w.latitude, w.longitude, w.price_min AS priceMin,
      w.price_max AS priceMax, w.status_override AS statusOverride, w.updated_at AS updatedAt,
      c.name AS category, ${ratingExpression} AS rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.warung_id = w.id AND r.status = 'VISIBLE') AS reviewCount,
      ${openExpression} AS isOpen
     FROM warungs w LEFT JOIN categories c ON c.id = w.category_id
     WHERE ${whereSql}
     ORDER BY rating DESC, reviewCount DESC, w.name ASC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  )
  const [countRows] = await pool.query<CountRow[]>(`SELECT COUNT(*) AS total FROM warungs w WHERE ${whereSql}`, params)
  const total = countRows[0]?.total ?? 0
  sendOk(res, { items: rows, pagination: { limit: query.limit, page: query.page, total, totalPages: Math.ceil(total / query.limit) } })
}))

publicWarungRouter.get('/:slug', validate(warungSlugSchema, 'params'), asyncHandler(async (req, res) => {
  const slug = String(req.params.slug)
  const [warungRows] = await pool.execute<GenericRow[]>(
    `SELECT w.id, w.name, w.slug, w.description, w.address, w.phone, w.latitude, w.longitude,
      w.price_min AS priceMin, w.price_max AS priceMax, w.status_override AS statusOverride,
      w.updated_at AS updatedAt, c.name AS category, ${ratingExpression} AS rating,
      (SELECT COUNT(*) FROM reviews r WHERE r.warung_id = w.id AND r.status = 'VISIBLE') AS reviewCount,
      ${openExpression} AS isOpen
     FROM warungs w LEFT JOIN categories c ON c.id = w.category_id
     WHERE w.slug = ? AND w.approval_status = 'APPROVED' AND w.is_active = 1 LIMIT 1`,
    [slug],
  )
  const warung = warungRows[0]
  if (!warung) throw new ApiError(404, 'WARUNG_NOT_FOUND', 'Warung tidak ditemukan.')

  const id = String(warung.id)
  const [[menus], [hours], [facilities], [payments], [photos]] = await Promise.all([
    pool.execute<GenericRow[]>('SELECT id, name, description, price, is_available AS isAvailable, photo_url AS photoUrl FROM menu_items WHERE warung_id = ? AND is_active = 1 ORDER BY name', [id]),
    pool.execute<GenericRow[]>('SELECT day_of_week AS dayOfWeek, open_time AS openTime, close_time AS closeTime, is_closed AS isClosed FROM operating_hours WHERE warung_id = ? ORDER BY day_of_week', [id]),
    pool.execute<GenericRow[]>('SELECT f.name, f.slug FROM warung_facilities wf JOIN facilities f ON f.id = wf.facility_id WHERE wf.warung_id = ? ORDER BY f.name', [id]),
    pool.execute<GenericRow[]>('SELECT pm.name, pm.slug FROM warung_payment_methods wp JOIN payment_methods pm ON pm.id = wp.payment_method_id WHERE wp.warung_id = ? ORDER BY pm.name', [id]),
    pool.execute<GenericRow[]>('SELECT id, url, alt_text AS altText, type, sort_order AS sortOrder FROM photos WHERE warung_id = ? ORDER BY sort_order', [id]),
  ])
  sendOk(res, { ...warung, facilities, hours, menus, payments, photos })
}))
