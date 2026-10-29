import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('LaperU API', () => {
  it('mengembalikan 400 untuk JSON rusak tanpa membocorkan isi permintaan', async () => {
    const response = await request(app).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{invalid')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ success: false, code: 'INVALID_JSON', message: 'Format JSON tidak valid.' })
  })

  it('mengembalikan 413 untuk body JSON melebihi batas', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ value: 'a'.repeat(1024 * 1024) })
    expect(response.status).toBe(413)
    expect(response.body.code).toBe('PAYLOAD_TOO_LARGE')
  })
  it('membatasi endpoint kredensial tanpa menghabiskan kuota untuk pengecekan sesi', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({})
    expect(login.headers.ratelimit).toBeDefined()
    const session = await request(app).get('/api/v1/auth/me')
    expect(session.status).toBe(401)
    expect(session.headers.ratelimit).toBeUndefined()
  })
  it('menyediakan health check tanpa membutuhkan database', async () => {
    const response = await request(app).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ success: true, data: { service: 'laperu-api', status: 'up' } })
  })

  it('menolak registrasi Customer yang tidak valid sebelum menyentuh database', async () => {
    const response = await request(app).post('/api/v1/auth/register/customer').send({ email: 'bukan-email' })
    expect(response.status).toBe(422)
    expect(response.body).toMatchObject({ success: false, code: 'VALIDATION_ERROR' })
  })

  it('mengembalikan respons 404 yang konsisten', async () => {
    const response = await request(app).get('/api/v1/tidak-ada')
    expect(response.status).toBe(404)
    expect(response.body).toMatchObject({ success: false, code: 'NOT_FOUND' })
  })

  it('melindungi endpoint unggah gambar dari Guest', async () => {
    const response = await request(app)
      .post('/api/v1/umkm/uploads/images')
      .attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), 'sample.png')
    expect(response.status).toBe(401)
    expect(response.body).toMatchObject({ success: false, code: 'UNAUTHENTICATED' })
  })
})
