import pino from 'pino'
import { describe, expect, it } from 'vitest'
import { loggerOptions } from '../src/config/logger.js'

describe('log credential protection', () => {
  it('meredaksi header sesi dan password dari log permintaan', () => {
    let written = ''
    const logger = pino({ ...loggerOptions, enabled: true }, { write: (chunk: string) => { written += chunk } })
    logger.info({
      req: { headers: { authorization: 'Bearer private-test-token', cookie: 'private-test-cookie' }, body: { password: 'private-test-password' } },
      res: { headers: { 'set-cookie': ['private-test-refresh-cookie'] } },
    }, 'redaction-test')
    expect(written).toContain('redaction-test')
    expect(written).toContain('[REDACTED]')
    expect(written).not.toContain('private-test-')
  })
})
