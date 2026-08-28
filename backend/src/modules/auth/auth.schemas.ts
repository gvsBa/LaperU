import { z } from 'zod'

const password = z.string().min(8).max(72).regex(/[A-Za-z]/, 'Kata sandi harus memiliki huruf.').regex(/\d/, 'Kata sandi harus memiliki angka.')

export const customerRegistrationSchema = z.object({
  email: z.email().max(190).transform((value) => value.trim().toLowerCase()),
  fullName: z.string().trim().min(2).max(120),
  password,
})

export const umkmRegistrationSchema = customerRegistrationSchema.extend({
  address: z.string().trim().min(8).max(500),
  businessName: z.string().trim().min(2).max(160),
  ownerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
})

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(72),
})

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>
export type UmkmRegistrationInput = z.infer<typeof umkmRegistrationSchema>
export type LoginInput = z.infer<typeof loginSchema>
