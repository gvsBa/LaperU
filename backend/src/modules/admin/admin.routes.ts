import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../db/pool.js'
import { authenticate, requireRole } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/api-error.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { sendOk } from '../../utils/response.js'
import {
  adminWarungListSchema,
  adminWarungUpdateSchema,
  applicationListSchema,
  decisionSchema,
  idParamSchema,
  referenceDataSchema,
  referenceDataUpdateSchema,
  reportStatusSchema,
  reviewModerationSchema,
  userListSchema,
  userStatusSchema,
} from './admin.schemas.js'

interface CountRow extends RowDataPacket { total: number }
interface GenericRow extends RowDataPacket { [key: string]: unknown }

function slugify(value: string, suffix: string) {
  const base = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${base || 'warung'}-${suffix.slice(0, 6)}`
}

export const adminRouter = Router()
adminRouter.use(authenticate, requireRole('ADMIN'))

adminRouter.get('/dashboard', asyncHandler(async (_req, res) => {
  const [[users], [umkm], [warungs], [reports]] = await Promise.all([
    pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM users WHERE role = 'CUSTOMER'"),
    pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM users WHERE role = 'UMKM'"),
    pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM warungs WHERE is_active = 1 AND approval_status = 'APPROVED'"),
    pool.query<CountRow[]>("SELECT COUNT(*) AS total FROM reports WHERE status = 'OPEN'"),
  ])
  sendOk(res, {
    activeWarungs: warungs[0]?.total ?? 0,
    customers: users[0]?.total ?? 0,
    openReports: reports[0]?.total ?? 0,
    umkmAccounts: umkm[0]?.total ?? 0,
  })
}))

adminRouter.get('/users', validate(userListSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { limit: number; page: number; role?: string; status?: string }
  const where = ["role <> 'ADMIN'"]
  const params: Array<string | number> = []
  if (query.role) { where.push('role = ?'); params.push(query.role) }
  if (query.status) { where.push('status = ?'); params.push(query.status) }
  const offset = (query.page - 1) * query.limit
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT id, full_name AS fullName, email, role, status, created_at AS createdAt
     FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  )
  const [count] = await pool.query<CountRow[]>(`SELECT COUNT(*) AS total FROM users WHERE ${where.join(' AND ')}`, params)
  const total = count[0]?.total ?? 0
  sendOk(res, { items: rows, pagination: { limit: query.limit, page: query.page, total, totalPages: Math.ceil(total / query.limit) } })
}))

adminRouter.get('/warungs', validate(adminWarungListSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { limit: number; page: number; q?: string }
  const where = query.q ? 'WHERE w.name LIKE ? OR w.address LIKE ?' : ''
  const params: Array<string | number> = query.q ? [`%${query.q}%`, `%${query.q}%`] : []
  const offset = (query.page - 1) * query.limit
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT w.id, w.name, w.slug, w.address, w.approval_status AS approvalStatus, w.is_active AS isActive,
      c.name AS category, u.email AS ownerEmail, w.updated_at AS updatedAt
     FROM warungs w JOIN umkm_profiles up ON up.id = w.umkm_profile_id
     JOIN users u ON u.id = up.user_id LEFT JOIN categories c ON c.id = w.category_id
     ${where} ORDER BY w.updated_at DESC LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  )
  const [count] = await pool.query<CountRow[]>(`SELECT COUNT(*) AS total FROM warungs w ${where}`, params)
  const total = count[0]?.total ?? 0
  sendOk(res, { items: rows, pagination: { limit: query.limit, page: query.page, total, totalPages: Math.ceil(total / query.limit) } })
}))

adminRouter.patch('/warungs/:id', validate(idParamSchema, 'params'), validate(adminWarungUpdateSchema), asyncHandler(async (req, res) => {
  const warungId = String(req.params.id)
  const columns: Record<string, string> = {
    address: 'address', categoryId: 'category_id', description: 'description', isActive: 'is_active', name: 'name',
  }
  const entries = Object.entries(req.body as Record<string, unknown>).filter(([key]) => columns[key])
  const assignments = entries.map(([key]) => `${columns[key]} = ?`).join(', ')
  const values = entries.map(([, value]) => value as string | number | boolean | null)
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE warungs SET ${assignments}, updated_at = NOW() WHERE id = ?`,
    [...values, warungId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'WARUNG_NOT_FOUND', 'Warung tidak ditemukan.')
  await pool.execute(
    'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, \'WARUNG\', ?, ?)',
    [randomUUID(), req.auth!.sub, 'WARUNG_UPDATED', warungId, JSON.stringify({ fields: entries.map(([key]) => key) })],
  )
  sendOk(res, null, 200, 'Data warung berhasil diperbarui.')
}))

adminRouter.delete('/warungs/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const warungId = String(req.params.id)
  const [result] = await pool.execute<ResultSetHeader>('UPDATE warungs SET is_active = 0, updated_at = NOW() WHERE id = ?', [warungId])
  if (!result.affectedRows) throw new ApiError(404, 'WARUNG_NOT_FOUND', 'Warung tidak ditemukan.')
  await pool.execute(
    'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id) VALUES (?, ?, \'WARUNG_DEACTIVATED\', \'WARUNG\', ?)',
    [randomUUID(), req.auth!.sub, warungId],
  )
  sendOk(res, null, 200, 'Warung dinonaktifkan tanpa menghapus riwayat.')
}))

for (const config of [
  { path: 'categories', table: 'categories', entity: 'CATEGORY' },
  { path: 'facilities', table: 'facilities', entity: 'FACILITY' },
] as const) {
  adminRouter.post(`/${config.path}`, validate(referenceDataSchema), asyncHandler(async (req, res) => {
    const id = randomUUID()
    await pool.execute(`INSERT INTO ${config.table} (id, name, slug) VALUES (?, ?, ?)`, [id, req.body.name, slugify(req.body.name, id)])
    sendOk(res, { id }, 201, `${config.entity} berhasil dibuat.`)
  }))

  adminRouter.patch(`/${config.path}/:id`, validate(idParamSchema, 'params'), validate(referenceDataUpdateSchema), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE ${config.table} SET name = ?, slug = ? WHERE id = ?`,
      [req.body.name, slugify(req.body.name, id), id],
    )
    if (!result.affectedRows) throw new ApiError(404, 'REFERENCE_NOT_FOUND', 'Data referensi tidak ditemukan.')
    sendOk(res, null, 200, `${config.entity} berhasil diperbarui.`)
  }))

  adminRouter.delete(`/${config.path}/:id`, validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
    const [result] = await pool.execute<ResultSetHeader>(`DELETE FROM ${config.table} WHERE id = ?`, [String(req.params.id)])
    if (!result.affectedRows) throw new ApiError(404, 'REFERENCE_NOT_FOUND', 'Data referensi tidak ditemukan.')
    sendOk(res, null, 200, `${config.entity} berhasil dihapus.`)
  }))
}

adminRouter.get('/applications', validate(applicationListSchema, 'query'), asyncHandler(async (req, res) => {
  const query = req.query as unknown as { limit: number; page: number; status?: string }
  const where = query.status ? 'WHERE us.status = ?' : ''
  const params: Array<string | number> = query.status ? [query.status] : []
  const offset = (query.page - 1) * query.limit
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT us.id, us.status, us.submitted_at AS submittedAt, us.reviewed_at AS reviewedAt,
      up.business_name AS businessName, up.owner_name AS ownerName, up.phone, u.email
     FROM umkm_submissions us JOIN umkm_profiles up ON up.id = us.umkm_profile_id
     JOIN users u ON u.id = up.user_id ${where}
     ORDER BY FIELD(us.status, 'PENDING', 'REVISION', 'DRAFT', 'APPROVED', 'REJECTED'), us.submitted_at ASC
     LIMIT ? OFFSET ?`,
    [...params, query.limit, offset],
  )
  const [count] = await pool.query<CountRow[]>(`SELECT COUNT(*) AS total FROM umkm_submissions us ${where}`, params)
  const total = count[0]?.total ?? 0
  sendOk(res, { items: rows, pagination: { limit: query.limit, page: query.page, total, totalPages: Math.ceil(total / query.limit) } })
}))

adminRouter.get('/applications/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const applicationId = String(req.params.id)
  const [rows] = await pool.execute<GenericRow[]>(
    `SELECT us.id, us.status, us.admin_note AS adminNote, us.submitted_at AS submittedAt, us.reviewed_at AS reviewedAt,
      up.id AS profileId, up.business_name AS businessName, up.owner_name AS ownerName, up.phone, up.address,
      up.business_type AS businessType, up.storefront_photo_url AS storefrontPhotoUrl,
      u.id AS userId, u.full_name AS fullName, u.email, u.status AS accountStatus
     FROM umkm_submissions us JOIN umkm_profiles up ON up.id = us.umkm_profile_id
     JOIN users u ON u.id = up.user_id WHERE us.id = ? LIMIT 1`,
    [applicationId],
  )
  if (!rows[0]) throw new ApiError(404, 'APPLICATION_NOT_FOUND', 'Pengajuan tidak ditemukan.')
  sendOk(res, rows[0])
}))

adminRouter.post('/applications/:id/decision', validate(idParamSchema, 'params'), validate(decisionSchema), asyncHandler(async (req, res) => {
  const applicationId = String(req.params.id)
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [rows] = await connection.execute<GenericRow[]>(
      `SELECT us.id, us.status, up.id AS profileId, up.user_id AS userId, up.business_name AS businessName,
        up.phone, up.address FROM umkm_submissions us JOIN umkm_profiles up ON up.id = us.umkm_profile_id
       WHERE us.id = ? FOR UPDATE`,
      [applicationId],
    )
    const application = rows[0]
    if (!application) throw new ApiError(404, 'APPLICATION_NOT_FOUND', 'Pengajuan tidak ditemukan.')
    if (application.status !== 'PENDING') throw new ApiError(409, 'APPLICATION_NOT_PENDING', 'Hanya pengajuan berstatus PENDING yang dapat ditinjau.')

    await connection.execute(
      'UPDATE umkm_submissions SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      [req.body.decision, req.body.note ?? null, req.auth!.sub, applicationId],
    )

    if (req.body.decision === 'APPROVED') {
      await connection.execute("UPDATE users SET status = 'ACTIVE' WHERE id = ?", [String(application.userId)])
      await connection.execute(
        `INSERT INTO warungs (id, umkm_profile_id, name, slug, address, phone, approval_status, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', 1)
         ON DUPLICATE KEY UPDATE approval_status = 'APPROVED', is_active = 1, updated_at = NOW()`,
        [randomUUID(), String(application.profileId), String(application.businessName), slugify(String(application.businessName), applicationId), String(application.address), String(application.phone)],
      )
    }

    await connection.execute(
      'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, \'UMKM_SUBMISSION\', ?, ?)',
      [randomUUID(), req.auth!.sub, `APPLICATION_${req.body.decision}`, applicationId, JSON.stringify({ note: req.body.note ?? null })],
    )
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
  sendOk(res, null, 200, `Pengajuan ditandai ${req.body.decision}.`)
}))

adminRouter.patch('/users/:id/status', validate(idParamSchema, 'params'), validate(userStatusSchema), asyncHandler(async (req, res) => {
  const userId = String(req.params.id)
  const [result] = await pool.execute<ResultSetHeader>('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ? AND role <> \'ADMIN\'', [req.body.status, userId])
  if (!result.affectedRows) throw new ApiError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.')
  await pool.execute(
    'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, \'USER\', ?, ?)',
    [randomUUID(), req.auth!.sub, 'USER_STATUS_CHANGED', userId, JSON.stringify({ status: req.body.status })],
  )
  sendOk(res, null, 200, 'Status pengguna berhasil diperbarui.')
}))

adminRouter.get('/reports', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT r.id, r.target_type AS targetType, r.target_id AS targetId, r.reason, r.detail, r.status,
      r.created_at AS createdAt, u.full_name AS reporterName, u.email AS reporterEmail
     FROM reports r JOIN users u ON u.id = r.reporter_id ORDER BY FIELD(r.status, 'OPEN', 'RESOLVED', 'DISMISSED'), r.created_at ASC`,
  )
  sendOk(res, rows)
}))

adminRouter.patch('/reports/:id', validate(idParamSchema, 'params'), validate(reportStatusSchema), asyncHandler(async (req, res) => {
  const reportId = String(req.params.id)
  const [result] = await pool.execute<ResultSetHeader>(
    'UPDATE reports SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    [req.body.status, req.body.adminNote ?? null, req.auth!.sub, reportId],
  )
  if (!result.affectedRows) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan.')
  sendOk(res, null, 200, 'Laporan berhasil ditinjau.')
}))

adminRouter.patch('/reviews/:id/status', validate(idParamSchema, 'params'), validate(reviewModerationSchema), asyncHandler(async (req, res) => {
  const reviewId = String(req.params.id)
  const [result] = await pool.execute<ResultSetHeader>('UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?', [req.body.status, reviewId])
  if (!result.affectedRows) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Ulasan tidak ditemukan.')
  await pool.execute(
    'INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, \'REVIEW_STATUS_CHANGED\', \'REVIEW\', ?, ?)',
    [randomUUID(), req.auth!.sub, reviewId, JSON.stringify({ status: req.body.status })],
  )
  sendOk(res, null, 200, 'Status ulasan berhasil diperbarui.')
}))

adminRouter.get('/audit-logs', asyncHandler(async (_req, res) => {
  const [rows] = await pool.query<GenericRow[]>(
    `SELECT al.id, al.action, al.entity_type AS entityType, al.entity_id AS entityId,
      al.metadata_json AS metadata, al.created_at AS createdAt, u.full_name AS adminName
     FROM audit_logs al JOIN users u ON u.id = al.admin_id ORDER BY al.created_at DESC LIMIT 200`,
  )
  sendOk(res, rows)
}))
