import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { assertIntegrationDatabaseSafety } from '../../vitest.integration.config.js'

assertIntegrationDatabaseSafety()
const { app } = await import('../../src/app.js')
const { pool } = await import('../../src/db/pool.js')
let server: Server
let origin: string
let directory: string
const email = `cli-${randomUUID()}@example.test`
const password = 'CliTestOnly123'
const changedPassword = 'CliChanged456'
const recoveredPassword = 'CliRecovered789'
let codes: string[]
const script = fileURLToPath(new URL('../../scripts/account-security.ps1', import.meta.url))

async function cli(action: string, prompts: string[]) {
  // Prompt values stay out of process arguments and command history. The real
  // CLI/API is used; only terminal input is replaced for noninteractive QA.
  const command = `
    $global:answers = $env:LAPERU_CLI_INPUT | ConvertFrom-Json
    $global:answerIndex = 0
    function global:Read-Host {
      param([string]$Prompt, [switch]$AsSecureString)
      $value = $global:answers[$global:answerIndex]
      $global:answerIndex++
      if ($AsSecureString) {
        $secure = [Security.SecureString]::new()
        foreach ($character in $value.ToCharArray()) { $secure.AppendChar($character) }
        return $secure
      }
      return $value
    }
    & $env:LAPERU_CLI_SCRIPT -Action $env:LAPERU_CLI_ACTION -ApiOrigin $env:LAPERU_CLI_ORIGIN -RecoveryDirectory $env:LAPERU_CLI_DIRECTORY
  `
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
      windowsHide: true, env: { ...process.env, LAPERU_CLI_INPUT: JSON.stringify(prompts), LAPERU_CLI_SCRIPT: script,
        LAPERU_CLI_ACTION: action, LAPERU_CLI_ORIGIN: origin, LAPERU_CLI_DIRECTORY: directory },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    child.stdout.on('data', chunk => { output += String(chunk) })
    child.stderr.on('data', chunk => { output += String(chunk) })
    const timer = setTimeout(() => { child.kill(); reject(new Error('Local CLI timed out')) }, 25_000)
    child.on('error', error => { clearTimeout(timer); reject(error) })
    child.on('close', code => { clearTimeout(timer); resolve({ code, output }) })
  })
}

describe.skipIf(process.platform !== 'win32').sequential('Windows local account security CLI', () => {
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'laperu-security-cli-'))
    server = await new Promise<Server>(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('API did not bind')
    origin = `http://127.0.0.1:${address.port}`
    await request(app).post('/api/v1/auth/register/customer').send({ email, password, fullName: 'CLI Test Account' }).expect(201)
  })
  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    await pool.end()
    if (directory) await rm(directory, { recursive: true, force: true })
  })
  it('saves five recovery codes privately without echoing secrets', async () => {
    const result = await cli('generate', [email, password])
    expect(result.code, result.output).toBe(0)
    const files = await readdir(directory)
    expect(files).toHaveLength(1)
    const saved = JSON.parse(await readFile(join(directory, files[0]!), 'utf8'))
    codes = saved.codes
    expect(codes).toHaveLength(5)
    expect(saved.email).toBe(email)
    expect(result.output).not.toContain(password)
    for (const code of codes) expect(result.output).not.toContain(code)
  })
  it('refuses mismatched confirmation without changing the password', async () => {
    const result = await cli('reset', [email, codes[0]!, changedPassword, 'DoesNotMatch123'])
    expect(result.code).toBe(1)
    await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200)
    expect(result.output).not.toContain(codes[0])
  })
  it('resets using a saved code and refuses reuse', async () => {
    const result = await cli('reset', [email, codes[0]!, recoveredPassword, recoveredPassword])
    expect(result.code, result.output).toBe(0)
    expect(result.output).not.toContain(recoveredPassword)
    await request(app).post('/api/v1/auth/login').send({ email, password: recoveredPassword }).expect(200)
    const reused = await cli('reset', [email, codes[0]!, changedPassword, changedPassword])
    expect(reused.code).toBe(1)
  })
  it('changes password with the existing password without echoing it', async () => {
    const result = await cli('change', [email, recoveredPassword, changedPassword, changedPassword])
    expect(result.code, result.output).toBe(0)
    expect(result.output).not.toContain(changedPassword)
    expect(result.output).not.toContain(recoveredPassword)
    await request(app).post('/api/v1/auth/login').send({ email, password: changedPassword }).expect(200)
  })
})
