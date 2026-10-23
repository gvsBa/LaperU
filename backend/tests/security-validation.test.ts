import { describe, expect, it } from 'vitest'
import { customerRegistrationSchema, loginSchema } from '../src/modules/auth/auth.schemas.js'
import { reviewSchema } from '../src/modules/customer/customer.schemas.js'
import { detectImageFormat } from '../src/modules/media/image-upload.js'
import { warungListSchema } from '../src/modules/warungs/warung.schemas.js'

const reviewId = '11111111-1111-4111-8111-111111111111'

describe('validasi data keamanan QA', () => {
  it.each([
    ['tanpa-at.example.test', 'Valid123'],
    ["' OR '1'='1", 'Valid123'],
    ['user@example.test', '12345678'],
    ['user@example.test', 'TanpaAngka'],
    ['user@example.test', 'Pendek1'],
  ])('menolak kombinasi registrasi yang tidak valid: %s', (email, password) => {
    const result = customerRegistrationSchema.safeParse({ email, fullName: 'Pengguna QA', password })
    expect(result.success).toBe(false)
  })

  it('menolak payload SQLi pada email login sebelum query database', () => {
    expect(loginSchema.safeParse({ email: "admin'--", password: 'Valid123' }).success).toBe(false)
  })

  it('menolak markup XSS pada field teks ulasan', () => {
    const result = reviewSchema.safeParse({
      cleanlinessRating: 5,
      comfortRating: 5,
      comment: "<img src=x onerror=alert('qa')>",
      portionRating: 5,
      priceRating: 5,
      speedRating: 5,
      tasteRating: 5,
      warungId: reviewId,
    })
    expect(result.success).toBe(false)
  })

  it('mengenali signature PNG dan JPEG serta menolak konten palsu', () => {
    expect(detectImageFormat(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png')
    expect(detectImageFormat(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe('jpeg')
    expect(detectImageFormat(Buffer.from('not-an-image'))).toBeNull()
  })

  it('mewajibkan pasangan koordinat untuk filter jarak', () => {
    expect(warungListSchema.safeParse({ sort: 'nearest' }).success).toBe(false)
    expect(warungListSchema.safeParse({ sort: 'cheapest' }).success).toBe(true)
    expect(warungListSchema.safeParse({ sort: 'name; DROP TABLE users' }).success).toBe(false)
    expect(warungListSchema.safeParse({ latitude: -6.97, radiusKm: 3 }).success).toBe(false)
    expect(warungListSchema.safeParse({ latitude: -6.97, longitude: 107.63, radiusKm: 3 }).success).toBe(true)
  })
})
