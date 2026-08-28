import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/api-error.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'
import { applicationUpdateSchema, idParamSchema, menuCreateSchema, menuUpdateSchema, operatingHoursSchema, photoSchema, warungUpdateSchema } from './umkm.schemas.js'

interface GenericRow extends RowDataPacket { [key: string]: unknown }
interface ProfileRow extends RowDataPacket { id: string; submissionStatus: string; warungId: string | null }

async function getProfile(userId: string, connection: PoolConnection | typeof pool = pool) {
  const [rows] = await connection.execute<ProfileRow[]>(
    `SELECT up.id, us.status AS submissionStatus, w.id AS warungId
     FROM umkm_profiles up
     JOIN umkm_submissions us ON us.umkm_profile_id = up.id
     LEFT JOIN warungs w ON w.umkm_profile_id = up.id
     WHERE up.user_id = ? LIMIT 1`,
    [userId],
  )
  const profile = rows[0]
  if (!profile) throw new ApiError(404, 'UMKM_PROFILE_NOT_FOUND', 'Profil UMKM tidak ditemukan.')
  return profile
}

function buildUpdate(body: Record<string, unknown>, columns: Record<string, string>) {
  const entries = Object.entries(body).filter(([key]) => columns[key])
  return {
    assignments: entries.map(([key]) => `${columns[key]} = ?`).join(', '),
    values: entries.map(([, value]) => value as string | number | boolean | null),
  }
}

export const umkmRouter = Router()
umkmRouter.use(authenticate, requireRole('UMKM'))

umkmRouter.get('/application', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute<GenericRow[]>(
    `SELECT up.id, up.business_name AS businessName, up.owner_name AS ownerName, up.phone, up.address,
      up.business_type AS businessType, up.storefront_photo_url AS storefrontPhotoUrl,
      us.status, us.admin_note AS adminNote, us.submitted_at AS submittedAt, us.reviewed_at AS reviewedAt
     FROM umkm_profiles up JOIN umkm_submissions us ON us.umkm_profile_id = up.id
     WHERE up.user_id = ? LIMIT 1`,
    [req.auth!.sub],
  )
  if (!rows[0]) throw new ApiError(404, 'UMKM_PROFILE_NOT_FOUND', 'Profil UMKM tidak ditemukan.')
  sendOk(res, rows[0])
}))

umkmRouter.patch('/application', validate(applicationUpdateSchema), asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!['DRAFT', 'REVISION'].includes(profile.submissionStatus)) {
    throw new ApiError(409, 'APPLICATION_LOCKED', 'Pengajuan tidak dapat diubah pada status saat ini.')
  }
  const { assignments, values } = buildUpdate(req.body, {
    address: 'address', businessName: 'business_name', businessType: 'business_type',
    ownerName: 'owner_name', phone: 'phone', storefrontPhotoUrl: 'storefront_photo_url',
  })
  await pool.execute(`UPDATE umkm_profiles SET ${assignments}, updated_at = NOW() WHERE id = ?`, [...values, profile.id])
  sendOk(res, null, 200, 'Data pengajuan berhasil disimpan.')
}))

umkmRouter.post('/application/submit', asyncHandler(async (req, res) => {
  const [rows] = await pool.execute<GenericRow[]>(
    `SELECT up.id, up.business_name, up.owner_name, up.phone, up.address, up.storefront_photo_url, us.status
     FROM umkm_profiles up JOIN umkm_submissions us ON us.umkm_profile_id = up.id
     WHERE up.user_id = ? LIMIT 1`,
    [req.auth!.sub],
  )
  const application = rows[0]
  if (!application) throw new ApiError(404, 'UMKM_PROFILE_NOT_FOUND', 'Profil UMKM tidak ditemukan.')
  if (!['DRAFT', 'REVISION'].includes(String(application.status))) throw new ApiError(409, 'APPLICATION_LOCKED', 'Pengajuan tidak dapat dikirim pada status saat ini.')
  if (!application.business_name || !application.owner_name || !application.phone || !application.address || !application.storefront_photo_url) {
    throw new ApiError(422, 'APPLICATION_INCOMPLETE', 'Lengkapi identitas dan foto tampak depan warung sebelum mengajukan.')
  }
  await pool.execute(
    `UPDATE umkm_submissions SET status = 'PENDING', admin_note = NULL, submitted_at = NOW(), reviewed_at = NULL
     WHERE umkm_profile_id = ?`,
    [String(application.id)],
  )
  sendOk(res, null, 200, 'Pengajuan berhasil dikirim untuk diverifikasi.')
}))

umkmRouter.get('/warung', asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(404, 'WARUNG_NOT_READY', 'Warung akan tersedia setelah pengajuan disetujui.')
  const [rows] = await pool.execute<GenericRow[]>(
    `SELECT id, name, slug, description, address, phone, latitude, longitude, price_min AS priceMin,
      price_max AS priceMax, status_override AS statusOverride, approval_status AS approvalStatus,
      is_active AS isActive, updated_at AS updatedAt FROM warungs WHERE id = ? LIMIT 1`,
    [profile.warungId],
  )
  sendOk(res, rows[0])
}))

umkmRouter.put('/warung', validate(warungUpdateSchema), asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const { assignments, values } = buildUpdate(req.body, {
    address: 'address', categoryId: 'category_id', description: 'description', latitude: 'latitude', longitude: 'longitude',
    name: 'name', phone: 'phone', priceMax: 'price_max', priceMin: 'price_min', statusOverride: 'status_override',
  })
  await pool.execute(`UPDATE warungs SET ${assignments}, updated_at = NOW() WHERE id = ?`, [...values, profile.warungId])
  sendOk(res, null, 200, 'Profil warung berhasil diperbarui.')
}))

umkmRouter.get('/menus', asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const [rows] = await pool.execute<GenericRow[]>(
    'SELECT id, name, description, price, is_available AS isAvailable, is_active AS isActive, photo_url AS photoUrl FROM menu_items WHERE warung_id = ? ORDER BY is_active DESC, name',
    [profile.warungId],
  )
  sendOk(res, rows)
}))

umkmRouter.post('/menus', validate(menuCreateSchema), asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const id = randomUUID()
  const body = req.body
  await pool.execute(
    'INSERT INTO menu_items (id, warung_id, name, description, price, is_available, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, profile.warungId, body.name, body.description ?? null, body.price, body.isAvailable, body.photoUrl ?? null],
  )
  sendOk(res, { id }, 201, 'Menu berhasil ditambahkan.')
}))

umkmRouter.patch('/menus/:id', validate(idParamSchema, 'params'), validate(menuUpdateSchema), asyncHandler(async (req, res) => {
  const menuId = String(req.params.id)
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const { assignments, values } = buildUpdate(req.body, {
    description: 'description', isActive: 'is_active', isAvailable: 'is_available', name: 'name', photoUrl: 'photo_url', price: 'price',
  })
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE menu_items SET ${assignments}, updated_at = NOW() WHERE id = ? AND warung_id = ?`,
    [...values, menuId, profile.warungId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'MENU_NOT_FOUND', 'Menu tidak ditemukan.')
  sendOk(res, null, 200, 'Menu berhasil diperbarui.')
}))

umkmRouter.delete('/menus/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const menuId = String(req.params.id)
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE menu_items SET is_active = 0, updated_at = NOW() WHERE id = ? AND warung_id = ?',
    [menuId, profile.warungId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'MENU_NOT_FOUND', 'Menu tidak ditemukan.')
  sendOk(res, null, 200, 'Menu dinonaktifkan tanpa menghapus riwayat.')
}))

umkmRouter.put('/operating-hours', validate(operatingHoursSchema), asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute('DELETE FROM operating_hours WHERE warung_id = ?', [profile.warungId])
    for (const item of req.body.hours) {
      await connection.execute(
        'INSERT INTO operating_hours (warung_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)',
        [profile.warungId, item.dayOfWeek, item.openTime, item.closeTime, item.isClosed],
      )
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  sendOk(res, null, 200, 'Jam operasional berhasil diperbarui.')
}))

umkmRouter.post('/photos', validate(photoSchema), asyncHandler(async (req, res) => {
  const profile = await getProfile(req.auth!.sub)
  if (!profile.warungId) throw new ApiError(409, 'WARUNG_NOT_READY', 'Warung belum disetujui admin.')
  const id = randomUUID()
  await pool.execute(
    'INSERT INTO photos (id, warung_id, url, alt_text, type) VALUES (?, ?, ?, ?, ?)',
    [id, profile.warungId, req.body.url, req.body.altText ?? null, req.body.type],
  )
  sendOk(res, { id }, 201, 'Foto berhasil ditambahkan.')
}))
