import { z } from 'zod'
import { safeText } from '../../utils/safe-text.js'
import { idParamSchema } from '../customer/customer.schemas.js'

export { idParamSchema }

export const applicationUpdateSchema = z.object({
  address: safeText({ min: 8, max: 500, optional: true }),
  businessName: safeText({ min: 2, max: 160, optional: true }),
  businessType: safeText({ max: 100, optional: true }),
  ownerName: safeText({ min: 2, max: 120, optional: true }),
  phone: safeText({ min: 8, max: 30, optional: true }),
  storefrontPhotoUrl: z.url().max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data harus diubah.' })

export const warungUpdateSchema = z.object({
  address: safeText({ min: 8, max: 500, optional: true }),
  categoryId: z.uuid().nullable().optional(),
  description: safeText({ max: 2000, optional: true }),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  name: safeText({ min: 2, max: 160, optional: true }),
  phone: safeText({ max: 30 }).nullable().optional(),
  priceMax: z.number().int().nonnegative().nullable().optional(),
  priceMin: z.number().int().nonnegative().nullable().optional(),
  statusOverride: z.enum(['AUTO', 'CLOSED', 'OPEN']).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data warung harus diubah.' })

export const menuCreateSchema = z.object({
  description: safeText({ max: 1000, optional: true }),
  isAvailable: z.boolean().default(true),
  name: safeText({ min: 2, max: 160 }),
  photoUrl: z.url().max(1000).optional(),
  price: z.number().int().nonnegative(),
})

export const menuUpdateSchema = menuCreateSchema.partial().extend({ isActive: z.boolean().optional() })
  .refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data menu harus diubah.' })

export const operatingHoursSchema = z.object({
  hours: z.array(z.object({
    closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  })).length(7),
})

export const photoSchema = z.object({
  altText: safeText({ max: 255, optional: true }),
  type: z.enum(['MENU', 'STOREFRONT', 'VENUE']),
  url: z.url().max(1000),
})

export const relationIdsSchema = z.object({
  ids: z.array(z.uuid()).max(50).refine((ids) => new Set(ids).size === ids.length, { message: 'ID tidak boleh duplikat.' }),
})

export const reviewReplySchema = z.object({
  reply: safeText({ min: 1, max: 1500 }),
})
