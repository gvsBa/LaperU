import { describe, expect, it } from 'vitest'
import { operatingHoursSchema } from '../src/modules/umkm/umkm.schemas.js'

const week = () => Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek, openTime: '08:00', closeTime: '20:00', isClosed: false,
}))

describe('kontrak jam operasional', () => {
  it('menolak jam terbalik dan jam identik pada hari buka', () => {
    for (const closeTime of ['07:00', '08:00']) {
      expect(operatingHoursSchema.safeParse({ hours: week().map(day => ({ ...day, closeTime })) }).success).toBe(false)
    }
  })
  it('menerima tepat tujuh hari unik', () => {
    expect(operatingHoursSchema.safeParse({ hours: week() }).success).toBe(true)
  })

  it('menolak hari duplikat sebelum operasi penggantian data', () => {
    const hours = week()
    hours[6]!.dayOfWeek = 0
    expect(operatingHoursSchema.safeParse({ hours }).success).toBe(false)
  })

  it('menolak hari buka dengan jam yang belum lengkap', () => {
    const hours = week().map((day) => ({ ...day, openTime: null }))
    expect(operatingHoursSchema.safeParse({ hours }).success).toBe(false)
  })

  it('menerima hari tutup dengan kedua jam null', () => {
    const hours = week().map((day) => ({ ...day, isClosed: true, openTime: null, closeTime: null }))
    expect(operatingHoursSchema.safeParse({ hours }).success).toBe(true)
  })
})
