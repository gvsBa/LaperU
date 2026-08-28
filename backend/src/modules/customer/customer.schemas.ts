import { z } from 'zod'

export const idParamSchema = z.object({ id: z.uuid() })

const rating = z.number().int().min(1).max(5)
export const reviewSchema = z.object({
  cleanlinessRating: rating,
  comfortRating: rating,
  comment: z.string().trim().max(1500).optional(),
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
  detail: z.string().trim().max(1200).optional(),
  reason: z.string().trim().min(3).max(160),
  targetId: z.uuid(),
  targetType: z.enum(['INFORMATION', 'REVIEW', 'WARUNG']),
})
