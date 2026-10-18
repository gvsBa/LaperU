import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/services/apiClient', () => ({ apiRequest: vi.fn() }))

import { apiRequest } from '../src/services/apiClient'
import {
  addFavorite,
  getFavorites,
  getFeaturedRestaurants,
  getFilterOptions,
  getWarung,
  listWarungs,
  normalizeWarung,
  removeFavorite,
  rupiah,
} from '../src/services/restaurantService.js'

const referenceItem = {
  id: 'warung-1', name: 'Warung Mahasiswa', slug: 'warung-mahasiswa',
  category: 'Nasi', rating: '4.25', isOpen: 1,
  priceMin: 10000, priceMax: 18000, distanceKm: '1.24',
}

beforeEach(() => { vi.resetAllMocks() })

describe('restaurant display normalization', () => {
  it('preserves source fields, normalizes numeric strings, and does not mutate the API object', () => {
    const original = Object.freeze({ ...referenceItem, priceMin: '10000', priceMax: '18000', reviewCount: 3 })
    const result = normalizeWarung(original)

    expect(result).toMatchObject({
      id: 'warung-1', slug: 'warung-mahasiswa', name: 'Warung Mahasiswa',
      category: 'Nasi', rating: 4.25, isOpen: true, reviewCount: 3,
      priceRange: `${rupiah(10000)} – ${rupiah(18000)}`, distance: '1.2 km',
    })
    expect(result).not.toBe(original)
    expect(original).toMatchObject({ rating: '4.25', isOpen: 1, priceMin: '10000' })
    expect(original).not.toHaveProperty('priceRange')
  })

  it.each([
    [0, false], [1, true], ['0', false], ['1', true],
    [false, false], [true, true], [null, null], [undefined, null],
  ])('normalizes the SQL boolean value %s to %s without treating null as closed', (value, expected) => {
    expect(normalizeWarung({ ...referenceItem, isOpen: value }).isOpen).toBe(expected)
  })

  it('uses explicit missing-data labels for nullable API fields and a zero rating', () => {
    const result = normalizeWarung({ id: 'nullable', category: null, rating: null, isOpen: null, priceMin: null, priceMax: null, distanceKm: null })
    expect(result).toMatchObject({
      id: 'nullable', category: 'Kategori belum diisi', rating: 0, isOpen: null,
      priceRange: 'Harga belum diisi', distance: 'Jarak belum tersedia',
    })
    expect(rupiah(null)).toBe('Belum diisi')
    expect(rupiah(undefined)).toBe('Belum diisi')
  })

  it('supports favorites responses that omit open state, category and distance', () => {
    // GET /customer/favorites deliberately returns a smaller shape than /warungs.
    const favorite = normalizeWarung({ id: 'fav', name: 'Warung favorit', rating: '0', priceMin: 0, priceMax: null })
    expect(favorite).toMatchObject({
      isOpen: null, rating: 0, category: 'Kategori belum diisi',
      distance: 'Jarak belum tersedia', priceRange: `Mulai ${rupiah(0)}`,
    })
  })

  it.each([
    [0, 0, `${rupiah(0)} – ${rupiah(0)}`],
    [12000, null, `Mulai ${rupiah(12000)}`],
    [null, 20000, `Hingga ${rupiah(20000)}`],
    [undefined, undefined, 'Harga belum diisi'],
  ])('formats partial or zero price ranges (%s, %s)', (priceMin, priceMax, expected) => {
    expect(normalizeWarung({ ...referenceItem, priceMin, priceMax }).priceRange).toBe(expected)
  })

  it('does not confuse numeric zero values with missing data', () => {
    expect(normalizeWarung({ ...referenceItem, distanceKm: 0, rating: 0, isOpen: 0 })).toMatchObject({
      distance: '0.0 km', rating: 0, isOpen: false,
    })
    // Intl may render a breaking or nonbreaking space depending on the runtime.
    expect(rupiah(15000).replace(/\s/g, '')).toBe('Rp15.000')
  })
})

describe('public restaurant API mapping', () => {
  it('serializes search/filter values, retains false/zero, omits only absent values and forwards cancellation', async () => {
    const signal = new AbortController().signal
    const filters = {
      q: 'nasi & mie / murah', category: 'nasi', facility: 'wi-fi', payment: 'qris',
      minPrice: 0, maxPrice: 20000, minRating: 4, openNow: false,
      latitude: -6.974, longitude: 107.632, radiusKm: 1.5, page: 2, limit: 12,
      omittedEmpty: '', omittedUndefined: undefined, omittedNull: null,
    }
    const pagination = { page: 2, limit: 12, total: 15, totalPages: 2 }
    apiRequest.mockResolvedValueOnce({ items: [referenceItem], pagination })

    const result = await listWarungs(filters, { signal })

    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [endpoint, options] = apiRequest.mock.calls[0]
    const url = new URL(endpoint, 'https://test.invalid')
    expect(url.pathname).toBe('/warungs')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: 'nasi & mie / murah', category: 'nasi', facility: 'wi-fi', payment: 'qris',
      minPrice: '0', maxPrice: '20000', minRating: '4', openNow: 'false',
      latitude: '-6.974', longitude: '107.632', radiusKm: '1.5', page: '2', limit: '12',
    })
    expect(options).toEqual({ signal })
    expect(result.items).toEqual([normalizeWarung(referenceItem)])
    expect(result.pagination).toEqual(pagination)
  })

  it('preserves an empty search result and pagination instead of substituting mock data', async () => {
    const empty = { items: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }
    apiRequest.mockResolvedValueOnce(empty)
    expect(await listWarungs()).toEqual(empty)
    const [endpoint] = apiRequest.mock.calls[0]
    expect(new URL(endpoint, 'https://test.invalid').search).toBe('')
  })

  it('requests four featured restaurants through the real list endpoint', async () => {
    const signal = new AbortController().signal
    apiRequest.mockResolvedValueOnce({ items: [referenceItem], pagination: { total: 1 } })
    expect(await getFeaturedRestaurants({ signal })).toEqual([normalizeWarung(referenceItem)])
    expect(apiRequest).toHaveBeenCalledWith('/warungs?limit=4', { signal })
  })

  it('encodes a detail slug as one path segment and preserves detail arrays', async () => {
    const signal = new AbortController().signal
    const menus = [{ id: 'menu-1', name: 'Nasi', price: 15000 }]
    const detail = { ...referenceItem, menus, hours: [], facilities: [], payments: [], photos: [], reviews: [] }
    apiRequest.mockResolvedValueOnce(detail)

    const result = await getWarung('nasi/ayam?promo=1#menu', { signal })

    expect(apiRequest).toHaveBeenCalledWith('/warungs/nasi%2Fayam%3Fpromo%3D1%23menu', { signal })
    expect(result).toEqual(normalizeWarung(detail))
    expect(result.menus).toEqual(menus)
  })

  it('returns backend reference data without manufacturing filter choices', async () => {
    const signal = new AbortController().signal
    const meta = { categories: [{ id: 'cat', name: 'Nasi', slug: 'nasi' }], facilities: [], paymentMethods: [] }
    apiRequest.mockResolvedValueOnce(meta)
    expect(await getFilterOptions({ signal })).toEqual(meta)
    expect(apiRequest).toHaveBeenCalledWith('/meta', { signal })
  })

  it('propagates backend failures and aborts instead of replacing them with an empty or mock result', async () => {
    const serverFailure = Object.assign(new Error('Warung tidak ditemukan.'), { status: 404, code: 'WARUNG_NOT_FOUND' })
    apiRequest.mockRejectedValueOnce(serverFailure)
    await expect(getWarung('missing')).rejects.toBe(serverFailure)

    const aborted = Object.assign(new Error('Request cancelled'), { name: 'AbortError' })
    apiRequest.mockRejectedValueOnce(aborted)
    await expect(listWarungs()).rejects.toBe(aborted)
  })
})

describe('authenticated favorites API mapping', () => {
  it('requires authentication, forwards options and normalizes each saved warung', async () => {
    const signal = new AbortController().signal
    const favorite = { id: 'fav-1', name: 'Favorit', priceMin: null, priceMax: 18000, rating: '4.5', favoritedAt: '2026-09-19T00:00:00.000Z' }
    apiRequest.mockResolvedValueOnce([favorite])

    const result = await getFavorites({ signal, auth: false })

    expect(apiRequest).toHaveBeenCalledWith('/customer/favorites', { signal, auth: true })
    expect(result).toEqual([normalizeWarung(favorite)])
    expect(result[0]).toMatchObject({ rating: 4.5, isOpen: null, favoritedAt: favorite.favoritedAt })
  })

  it('returns a genuinely empty favorites list', async () => {
    apiRequest.mockResolvedValueOnce([])
    expect(await getFavorites()).toEqual([])
    expect(apiRequest).toHaveBeenCalledWith('/customer/favorites', { auth: true })
  })

  it('maps add/remove to authenticated POST/DELETE and encodes the ID', async () => {
    const id = 'warung/id?key=1'
    const endpoint = `/customer/favorites/${encodeURIComponent(id)}`
    apiRequest.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    expect(await addFavorite(id)).toBeNull()
    expect(await removeFavorite(id)).toBeNull()
    expect(apiRequest).toHaveBeenNthCalledWith(1, endpoint, { method: 'POST', auth: true })
    expect(apiRequest).toHaveBeenNthCalledWith(2, endpoint, { method: 'DELETE', auth: true })
  })

  it('propagates rejected favorite operations without reporting success', async () => {
    const forbidden = Object.assign(new Error('Kamu tidak memiliki akses.'), { status: 403, code: 'FORBIDDEN' })
    apiRequest.mockRejectedValue(forbidden)
    await expect(getFavorites()).rejects.toBe(forbidden)
    await expect(addFavorite('warung-1')).rejects.toBe(forbidden)
    await expect(removeFavorite('warung-1')).rejects.toBe(forbidden)
  })
})
