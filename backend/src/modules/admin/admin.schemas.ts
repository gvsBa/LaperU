import { z } from 'zod'
import { idParamSchema } from '../customer/customer.schemas.js'

export { idParamSchema }

export const applicationListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['APPROVED', 'DRAFT', 'PENDING', 'REJECTED', 'REVISION', 'SUSPENDED']).optional(),
})

export const decisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'REVISION']),
  note: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.decision !== 'APPROVED' && (!value.note || value.note.length < 5)) {
    context.addIssue({ code: 'custom', message: 'Catatan minimal 5 karakter wajib untuk revisi atau penolakan.', path: ['note'] })
  }
})

export const userStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) })
export const reportStatusSchema = z.object({ adminNote: z.string().trim().max(1000).optional(), status: z.enum(['DISMISSED', 'RESOLVED']) })
