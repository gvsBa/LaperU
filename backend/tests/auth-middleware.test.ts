import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../src/config/env.js'
import { authenticate } from '../src/middleware/auth.js'
import { errorHandler } from '../src/middleware/error-handler.js'

const database = vi.hoisted(() => ({ execute: vi.fn() }))
vi.mock('../src/db/pool.js', () => ({ pool: database }))
vi.mock('../src/config/logger.js', () => ({ logger: { error: vi.fn() } }))

const app = express()
app.get('/protected', authenticate, (req, res) => res.json({ user: req.auth }))
app.use(errorHandler)

const userId = '11111111-1111-4111-8111-111111111111'

function token(expiresIn = 60) {
  return jwt.sign({ role: 'CUSTOMER' }, env.JWT_ACCESS_SECRET, {
    audience: 'laperu-web', issuer: 'laperu-api', subject: userId, expiresIn,
  })
}

beforeEach(() => vi.clearAllMocks())

describe('authentication middleware', () => {
  it('menolak JWT yang tidak valid sebelum mengakses database', async () => {
    const response = await request(app).get('/protected').set('Authorization', 'Bearer not-a-valid-jwt')
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('INVALID_ACCESS_TOKEN')
    expect(database.execute).not.toHaveBeenCalled()
  })

  it('menolak JWT kedaluwarsa sebelum mengakses database', async () => {
    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token(-1)}`)
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('INVALID_ACCESS_TOKEN')
    expect(database.execute).not.toHaveBeenCalled()
  })

  it('meneruskan kegagalan database sebagai error server, bukan sesi tidak valid', async () => {
    database.execute.mockRejectedValueOnce(new Error('Database connection unavailable'))
    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(500)
    expect(response.body.code).toBe('INTERNAL_ERROR')
  })

  it('menolak akun yang ditangguhkan dengan status 403', async () => {
    database.execute.mockResolvedValueOnce([[{ role: 'CUSTOMER', status: 'SUSPENDED' }], []])
    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(403)
    expect(response.body.code).toBe('ACCOUNT_SUSPENDED')
  })

  it('menolak akun yang sudah tidak ada', async () => {
    database.execute.mockResolvedValueOnce([[], []])
    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('UNAUTHENTICATED')
  })

  it('menggunakan role terkini dari database setelah JWT tervalidasi', async () => {
    database.execute.mockResolvedValueOnce([[{ role: 'UMKM', status: 'ACTIVE' }], []])
    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(200)
    expect(response.body.user).toEqual({ sub: userId, role: 'UMKM' })
    expect(database.execute).toHaveBeenCalledWith(expect.any(String), [userId])
  })
})
