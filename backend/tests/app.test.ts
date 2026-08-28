import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('LaperU API', () => {
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
})
