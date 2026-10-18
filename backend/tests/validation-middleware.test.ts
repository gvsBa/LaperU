import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validate } from '../src/middleware/validate.js'
import { errorHandler } from '../src/middleware/error-handler.js'

const app = express()
app.get('/query', validate(z.object({ page: z.coerce.number().int().min(1).default(1) }), 'query'), (req, res) => {
  res.json(req.query)
})
app.use(errorHandler)

describe('query validation with Express 5', () => {
  it('passes typed and defaulted query data to the route without assigning to a getter', async () => {
    const supplied = await request(app).get('/query?page=2').expect(200)
    expect(supplied.body).toEqual({ page: 2 })
    const defaulted = await request(app).get('/query').expect(200)
    expect(defaulted.body).toEqual({ page: 1 })
  })
  it('rejects invalid query data before the route', async () => {
    const result = await request(app).get('/query?page=-1').expect(422)
    expect(result.body.code).toBe('VALIDATION_ERROR')
  })
})
