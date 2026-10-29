import { z } from 'zod'

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true')

export const warungListSchema = z.object({
  dataset: z.enum(['reference', 'simulation']).optional(),
  category: z.string().trim().min(1).optional(),
  facility: z.string().trim().min(1).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  openNow: booleanQuery.optional(),
  page: z.coerce.number().int().min(1).default(1),
  payment: z.string().trim().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['recommended', 'rating', 'cheapest', 'nearest']).optional(),
  radiusKm: z.coerce.number().positive().max(50).optional(),
}).superRefine((value, context) => {
  if ((value.latitude === undefined) !== (value.longitude === undefined)) {
    context.addIssue({ code: 'custom', message: 'Latitude dan longitude harus dikirim bersama.', path: ['latitude'] })
  }
  if (value.sort === 'nearest' && value.latitude === undefined) {
    context.addIssue({ code: 'custom', message: 'Urutan terdekat membutuhkan lokasi.', path: ['sort'] })
  }
  if (value.radiusKm !== undefined && value.latitude === undefined) {
    context.addIssue({ code: 'custom', message: 'radiusKm membutuhkan latitude dan longitude.', path: ['radiusKm'] })
  }
})

export const warungSlugSchema = z.object({ slug: z.string().min(1).max(190) })
