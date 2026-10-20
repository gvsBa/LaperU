import { apiRequest } from './apiClient'

export const privateApi = (path, options = {}) => apiRequest(path, { ...options, auth: true })
export const saveData = (path, method, body) => privateApi(path, { method, body })
export async function uploadImage(file) {
  if (!(file instanceof File) || file.size === 0) throw new Error('Pilih gambar JPG atau PNG terlebih dahulu.')
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('Gunakan format JPG atau PNG.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 2 MB.')
  const body = new FormData()
  body.append('image', file)
  return privateApi('/umkm/uploads/images', { method: 'POST', body })
}
