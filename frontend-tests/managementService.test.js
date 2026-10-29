import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiClient', () => ({ apiRequest: vi.fn() }))
import { apiRequest } from '../src/services/apiClient'
import { privateApi, saveData, uploadImage } from '../src/services/managementService'
import { createReview, reviewPayload } from '../src/services/reviewService'
beforeEach(() => vi.resetAllMocks())

describe('management API contracts', () => {
  it('cannot disable authentication via caller options', async () => {
    await privateApi('/admin/users', { auth: false })
    expect(apiRequest).toHaveBeenCalledWith('/admin/users', { auth: true })
  })
  it('preserves the requested mutation method and body', async () => {
    await saveData('/umkm/warung', 'PUT', { name: 'Warung QA' })
    expect(apiRequest).toHaveBeenCalledWith('/umkm/warung', { method: 'PUT', body: { name: 'Warung QA' }, auth: true })
  })
  it('uploads multipart content using the expected field', async () => {
    const file = new File(['png-data'], 'sample.png', { type: 'image/png' })
    await uploadImage(file)
    const [path, options] = apiRequest.mock.calls[0]
    expect(path).toBe('/umkm/uploads/images')
    expect(options.method).toBe('POST')
    expect(options.auth).toBe(true)
    expect(options.body.get('image')).toBe(file)
  })
  it.each([
    [null, 'Pilih gambar'],
    [new File([], 'empty.png', { type: 'image/png' }), 'Pilih gambar'],
    [new File(['bad'], 'bad.svg', { type: 'image/svg+xml' }), 'Gunakan format'],
    [new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }), 'maksimal 2 MB'],
  ])('rejects invalid images before sending a request', async (file, message) => {
    await expect(uploadImage(file)).rejects.toThrow(message)
    expect(apiRequest).not.toHaveBeenCalled()
  })
  it('converts six ratings to numbers and preserves comment text', async () => {
    const form = new FormData()
    const keys = ['tasteRating', 'priceRating', 'portionRating', 'cleanlinessRating', 'comfortRating', 'speedRating']
    for (const key of keys) form.set(key, '4')
    form.set('comment', 'Ulasan QA')
    const expected = { ...Object.fromEntries(keys.map((key) => [key, 4])), comment: 'Ulasan QA' }
    expect(reviewPayload(form)).toEqual(expected)
    await createReview('warung-id', form)
    expect(apiRequest).toHaveBeenCalledWith('/customer/reviews', { method: 'POST', auth: true, body: { ...expected, warungId: 'warung-id' } })
  })
})
