import { z } from 'zod'
import { safeText } from '../../utils/safe-text.js'

const password = z.string().min(8).max(72).regex(/[A-Za-z]/, 'Kata sandi harus memiliki huruf.').regex(/\d/, 'Kata sandi harus memiliki angka.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Kata sandi maksimal 72 byte UTF-8.')
const email = z.string().trim().toLowerCase().pipe(z.email().max(190))

export const customerRegistrationSchema = z.object({
  email,
  fullName: safeText({ min: 2, max: 120 }),
  password,
})

export const umkmRegistrationSchema = customerRegistrationSchema.extend({
  address: safeText({ min: 8, max: 500 }),
  businessName: safeText({ min: 2, max: 160 }),
  ownerName: safeText({ min: 2, max: 120 }),
  phone: safeText({ min: 8, max: 30 }),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
})

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>
export type UmkmRegistrationInput = z.infer<typeof umkmRegistrationSchema>
export type LoginInput = z.infer<typeof loginSchema>
