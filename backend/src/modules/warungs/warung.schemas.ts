import { z } from 'zod'

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true')

export const warungListSchema = z.object({
  category: z.string().trim().min(1).optional(),
  facility: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  openNow: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  payment: z.string().trim().min(1).optional(),
  q: z.string().trim().max(100).optional(),
})

export const warungSlugSchema = z.object({ slug: z.string().min(1).max(190) })
