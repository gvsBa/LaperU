import { z } from 'zod'
import { idParamSchema } from '../customer/customer.schemas.js'

export { idParamSchema }

export const applicationUpdateSchema = z.object({
  address: z.string().trim().min(8).max(500).optional(),
  businessName: z.string().trim().min(2).max(160).optional(),
  businessType: z.string().trim().max(100).optional(),
  ownerName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(8).max(30).optional(),
  storefrontPhotoUrl: z.url().max(1000).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data harus diubah.' })

export const warungUpdateSchema = z.object({
  address: z.string().trim().min(8).max(500).optional(),
  categoryId: z.uuid().nullable().optional(),
  description: z.string().trim().max(2000).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  name: z.string().trim().min(2).max(160).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  priceMax: z.number().int().nonnegative().nullable().optional(),
  priceMin: z.number().int().nonnegative().nullable().optional(),
  statusOverride: z.enum(['AUTO', 'CLOSED', 'OPEN']).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Minimal satu data warung harus diubah.' })

export const menuCreateSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  isAvailable: z.boolean().default(true),
  name: z.string().trim().min(2).max(160),
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
  altText: z.string().trim().max(255).optional(),
  type: z.enum(['MENU', 'STOREFRONT', 'VENUE']),
  url: z.url().max(1000),
})
