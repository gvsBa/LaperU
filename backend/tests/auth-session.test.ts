import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshSession, registerCustomer } from '../src/modules/auth/auth.service.js'

const mocks = vi.hoisted(() => ({
  connection: {
    beginTransaction: vi.fn(), commit: vi.fn(), execute: vi.fn(), release: vi.fn(), rollback: vi.fn(),
  },
  pool: { execute: vi.fn(), getConnection: vi.fn() },
}))
vi.mock('../src/db/pool.js', () => ({ pool: mocks.pool }))

const currentToken = 'test-refresh-token'
const user = {
  id: '11111111-1111-4111-8111-111111111111',
  refreshId: '22222222-2222-4222-8222-222222222222',
  email: 'session@example.test', fullName: 'Session QA', passwordHash: 'unused', role: 'CUSTOMER', status: 'ACTIVE',
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.pool.getConnection.mockResolvedValue(mocks.connection)
  mocks.connection.beginTransaction.mockResolvedValue(undefined)
  mocks.connection.commit.mockResolvedValue(undefined)
  mocks.connection.rollback.mockResolvedValue(undefined)
})

describe('refresh session transaction', () => {
  it('membatasi metadata sesi sesuai kapasitas kolom database', async () => {
    mocks.connection.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[user], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
    await refreshSession(currentToken, { userAgent: 'x'.repeat(1000), ip: 'y'.repeat(100) })
    const values = mocks.connection.execute.mock.calls[2]![1]
    expect(values[3]).toHaveLength(500)
    expect(values[4]).toHaveLength(64)
  })
  it('mengunci token, mencabutnya, dan menyimpan penggantinya dalam transaksi yang sama', async () => {
    mocks.connection.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[user], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])

    const session = await refreshSession(currentToken, { userAgent: 'QA test', ip: '127.0.0.1' })
    expect(mocks.pool.execute).not.toHaveBeenCalled()
    expect(mocks.connection.beginTransaction).toHaveBeenCalledOnce()
    expect(mocks.connection.execute).toHaveBeenNthCalledWith(1,
      expect.stringMatching(/UPDATE refresh_tokens[\s\S]*token_hash = \?[\s\S]*revoked_at IS NULL[\s\S]*expires_at > NOW\(\)/),
      [createHash('sha256').update(currentToken).digest('hex')],
    )
    expect(mocks.connection.execute).toHaveBeenNthCalledWith(2,
      expect.stringMatching(/SELECT[\s\S]*token_hash = \?/), [createHash('sha256').update(currentToken).digest('hex')],
    )
    expect(mocks.connection.execute).toHaveBeenNthCalledWith(3,
      expect.stringContaining('INSERT INTO refresh_tokens'),
      expect.arrayContaining([user.id, createHash('sha256').update(session.refreshToken).digest('hex'), 'QA test', '127.0.0.1']),
    )
    expect(mocks.connection.beginTransaction.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.connection.execute.mock.invocationCallOrder[0]!)
    expect(mocks.connection.commit.mock.invocationCallOrder[0])
      .toBeGreaterThan(mocks.connection.execute.mock.invocationCallOrder[2]!)
    expect(session.refreshToken).not.toBe(currentToken)
    expect(session.user).not.toHaveProperty('passwordHash')
    expect(mocks.connection.commit).toHaveBeenCalledOnce()
    expect(mocks.connection.rollback).not.toHaveBeenCalled()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it.each([
    ['tidak ditemukan atau sudah tidak berlaku', []],
    ['akun ditangguhkan', [{ ...user, status: 'SUSPENDED' }]],
  ])('menolak token %s tanpa membuat sesi baru', async (_label, rows) => {
    mocks.connection.execute.mockResolvedValueOnce([{ affectedRows: 1 }, []]).mockResolvedValueOnce([rows, []])
    await expect(refreshSession(currentToken, {})).rejects.toMatchObject({ status: 401, code: 'INVALID_REFRESH_TOKEN' })
    expect(mocks.connection.execute).toHaveBeenCalledTimes(2)
    expect(mocks.connection.commit).not.toHaveBeenCalled()
    expect(mocks.connection.rollback).toHaveBeenCalledOnce()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it('rollback bila penyimpanan token pengganti gagal', async () => {
    const failure = new Error('Refresh token insert failed')
    mocks.connection.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[user], []])
      .mockRejectedValueOnce(failure)
    await expect(refreshSession(currentToken, {})).rejects.toBe(failure)
    expect(mocks.connection.commit).not.toHaveBeenCalled()
    expect(mocks.connection.rollback).toHaveBeenCalledOnce()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it('menolak token yang sudah diklaim tanpa membuat sesi baru', async () => {
    mocks.connection.execute.mockResolvedValueOnce([{ affectedRows: 0 }, []])
    await expect(refreshSession(currentToken, {})).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN', status: 401 })
    expect(mocks.connection.execute).toHaveBeenCalledOnce()
    expect(mocks.connection.commit).not.toHaveBeenCalled()
    expect(mocks.connection.rollback).toHaveBeenCalledOnce()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it('meneruskan kegagalan query claim dan tetap melepaskan koneksi', async () => {
    const failure = new Error('Database query failed')
    mocks.connection.execute.mockRejectedValueOnce(failure)
    await expect(refreshSession(currentToken, {})).rejects.toBe(failure)
    expect(mocks.connection.commit).not.toHaveBeenCalled()
    expect(mocks.connection.rollback).toHaveBeenCalledOnce()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it('mengulang seluruh transaksi setelah deadlock lalu menolak token yang sudah dipakai', async () => {
    mocks.connection.execute
      .mockRejectedValueOnce(Object.assign(new Error('Deadlock'), { code: 'ER_LOCK_DEADLOCK' }))
      .mockResolvedValueOnce([{ affectedRows: 0 }, []])
    await expect(refreshSession(currentToken, {})).rejects.toMatchObject({ status: 401, code: 'INVALID_REFRESH_TOKEN' })
    expect(mocks.connection.beginTransaction).toHaveBeenCalledTimes(2)
    expect(mocks.connection.rollback).toHaveBeenCalledTimes(2)
    expect(mocks.connection.release).toHaveBeenCalledTimes(2)
    expect(mocks.connection.commit).not.toHaveBeenCalled()
  })

  it('membatasi retry deadlock sampai tiga percobaan', async () => {
    const failure = Object.assign(new Error('Deadlock'), { code: 'ER_LOCK_DEADLOCK' })
    mocks.connection.execute.mockRejectedValue(failure)
    await expect(refreshSession(currentToken, {})).rejects.toBe(failure)
    expect(mocks.connection.beginTransaction).toHaveBeenCalledTimes(3)
    expect(mocks.connection.release).toHaveBeenCalledTimes(3)
  })
})

describe('customer registration transaction', () => {
  const input = { fullName: 'Customer QA', email: 'customer@example.test', password: 'TestPassword123' }

  it('menyimpan akun dan sesi secara atomik', async () => {
    mocks.connection.execute.mockResolvedValue([{ affectedRows: 1 }, []])
    const result = await registerCustomer(input, {})
    expect(result.user.role).toBe('CUSTOMER')
    expect(mocks.pool.execute).not.toHaveBeenCalled()
    expect(mocks.connection.beginTransaction).toHaveBeenCalledOnce()
    expect(mocks.connection.execute).toHaveBeenCalledTimes(2)
    expect(mocks.connection.commit).toHaveBeenCalledOnce()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })

  it('rollback akun jika penyimpanan sesi gagal sehingga email dapat dicoba lagi', async () => {
    const failure = new Error('Session storage unavailable')
    mocks.connection.execute.mockResolvedValueOnce([{ affectedRows: 1 }, []]).mockRejectedValueOnce(failure)
    await expect(registerCustomer(input, {})).rejects.toBe(failure)
    expect(mocks.connection.rollback).toHaveBeenCalledOnce()
    expect(mocks.connection.commit).not.toHaveBeenCalled()
    expect(mocks.connection.release).toHaveBeenCalledOnce()
  })
})
