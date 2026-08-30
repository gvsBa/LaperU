import { z } from 'zod'
import { idParamSchema } from '../customer/customer.schemas.js'
import { safeText } from '../../utils/safe-text.js'

export { idParamSchema }

export const applicationListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['APPROVED', 'DRAFT', 'PENDING', 'REJECTED', 'REVISION', 'SUSPENDED']).optional(),
})

export const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REVISION']),
  note: safeText({ max: 1000, optional: true }),
}).superRefine((value, context) => {
  if (value.decision !== 'APPROVED' && (!value.note || value.note.length < 5)) {
    context.addIssue({ code: 'custom', message: 'Catatan minimal 5 karakter wajib untuk revisi atau penolakan.', path: ['note'] })
  }
})

export const userStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) })
export const reportStatusSchema = z.object({ adminNote: safeText({ max: 1000, optional: true }), status: z.enum(['DISMISSED', 'RESOLVED']) })

export const userListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
  role: z.enum(['CUSTOMER', 'UMKM']).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED']).optional(),
})

export const adminWarungListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
  q: safeText({ max: 100, optional: true }),
})

export const adminWarungUpdateSchema = z.object({
  address: safeText({ min: 8, max: 500, optional: true }),
  categoryId: z.uuid().nullable().optional(),
  description: safeText({ max: 2000, optional: true }),
  isActive: z.boolean().optional(),
  name: safeText({ min: 2, max: 160, optional: true }),
}).refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data warung harus diubah.' })

export const referenceDataSchema = z.object({
  name: safeText({ min: 2, max: 100 }),
})

export const referenceDataUpdateSchema = referenceDataSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Minimal satu data harus diubah.',
})

export const reviewModerationSchema = z.object({
  status: z.enum(['HIDDEN', 'VISIBLE']),
})
