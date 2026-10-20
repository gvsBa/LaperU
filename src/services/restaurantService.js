import { apiRequest } from './apiClient'

export function rupiah(value) {
  return value == null ? 'Belum diisi' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function normalizeWarung(item) {
  const { priceMin, priceMax, distanceKm } = item
  return {
    ...item,
    isOpen: item.isOpen == null ? null : Boolean(Number(item.isOpen)),
    rating: Number(item.rating || 0),
    category: item.category || 'Kategori belum diisi',
    distance: distanceKm == null ? 'Jarak belum tersedia' : `${Number(distanceKm).toFixed(1)} km`,
    priceRange: priceMin == null && priceMax == null ? 'Harga belum diisi'
      : priceMin != null && priceMax != null ? `${rupiah(priceMin)} – ${rupiah(priceMax)}`
        : priceMin != null ? `Mulai ${rupiah(priceMin)}` : `Hingga ${rupiah(priceMax)}`,
  }
}

export async function listWarungs(filters = {}, { signal } = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  const result = await apiRequest(`/warungs?${query}`, { signal })
  return { ...result, items: result.items.map(normalizeWarung) }
}
export async function getFeaturedRestaurants(options = {}) { return (await listWarungs({ limit: 4 }, options)).items }
export async function getWarung(slug, options = {}) { return normalizeWarung(await apiRequest(`/warungs/${encodeURIComponent(slug)}`, options)) }
export const getFilterOptions = (options = {}) => apiRequest('/meta', options)
export const getFavorites = async (options = {}) => (await apiRequest('/customer/favorites', { ...options, auth: true })).map(normalizeWarung)
export const addFavorite = (id) => apiRequest(`/customer/favorites/${encodeURIComponent(id)}`, { method: 'POST', auth: true })
export const removeFavorite = (id) => apiRequest(`/customer/favorites/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true })
