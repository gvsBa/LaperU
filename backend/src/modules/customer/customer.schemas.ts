import { z } from 'zod'
import { safeText } from '../../utils/safe-text.js'

export const idParamSchema = z.object({ id: z.uuid() })

const rating = z.number().int().min(1).max(5)
export const reviewSchema = z.object({
  cleanlinessRating: rating,
  comfortRating: rating,
  comment: safeText({ max: 1500, optional: true }),
  portionRating: rating,
  priceRating: rating,
  speedRating: rating,
  tasteRating: rating,
  warungId: z.uuid(),
})

export const reviewUpdateSchema = reviewSchema.omit({ warungId: true }).partial().refine((value) => Object.keys(value).length > 0, {
  message: 'Minimal satu data ulasan harus diubah.',
})

export const reportSchema = z.object({
  detail: safeText({ max: 1200, optional: true }),
  reason: safeText({ min: 3, max: 160 }),
  targetId: z.uuid(),
  targetType: z.enum(['INFORMATION', 'REVIEW', 'WARUNG']),
})

export const reviewListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
})
