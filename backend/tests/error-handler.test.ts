import type { Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

const errorLog = vi.hoisted(() => vi.fn())
vi.mock('../src/config/logger.js', () => ({ logger: { error: errorLog } }))
import { errorHandler } from '../src/middleware/error-handler.js'

describe('unexpected error secrecy', () => {
  it('does not expose driver SQL/private values even in development', () => {
    const json = vi.fn()
    const response = { status: vi.fn().mockReturnValue({ json }) } as unknown as Response
    const error = Object.assign(new Error('SQL includes private-test-password-hash'), {
      code: 'ER_DUP_ENTRY', sql: 'INSERT private-test-token', sqlMessage: 'private-test-email',
    })
    errorHandler(error, {} as Request, response, vi.fn())
    expect(response.status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ success: false, code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' })
    expect(errorLog).toHaveBeenLastCalledWith({ code: 'ER_DUP_ENTRY' }, 'Unhandled backend error')
    expect(JSON.stringify([json.mock.calls, errorLog.mock.calls])).not.toContain('private-test-')
  })
})
