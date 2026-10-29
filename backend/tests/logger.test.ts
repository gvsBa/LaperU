import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { loggerOptions } from '../src/config/logger.js'

describe('log credential protection', () => {
  it('meredaksi header sesi dan password dari log permintaan', () => {
    let written = ''
    const logger = pino({ ...loggerOptions, enabled: true }, { write: (chunk: string) => { written += chunk } })
    logger.info({
      req: { headers: { authorization: 'Bearer private-test-token', cookie: 'private-test-cookie' }, body: { password: 'private-test-password', currentPassword: 'private-test-current', newPassword: 'private-test-new', recoveryCode: 'private-test-code' } },
      res: { headers: { 'set-cookie': ['private-test-refresh-cookie'] }, body: { data: { codes: ['private-test-recovery'] } } },
    }, 'redaction-test')
    expect(written).toContain('redaction-test')
    expect(written).toContain('[REDACTED]')
    expect(written).not.toContain('private-test-')
  })
})
