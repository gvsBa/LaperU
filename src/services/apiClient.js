const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let session = { user: null, accessToken: null }
let generation = 0
let refreshTask = null
let logoutTask = null
let issuanceTask = null
let loggingOut = false
const listeners = new Set()

export function getAuthSession() {
  return session
}

export function subscribeAuthSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function publish(nextSession) {
  session = nextSession
  for (const listener of listeners) listener()
}

export function clearAuthSession() {
  generation += 1
  publish({ user: null, accessToken: null })
}

function sessionChanged() {
  return new ApiError('Sesi telah berubah. Silakan masuk kembali.', { status: 401, code: 'SESSION_CHANGED' })
}

export function applyAuthSession(data, expectedGeneration) {
  if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
  if (!data || typeof data.accessToken !== 'string' || !data.accessToken || !data.user?.id) {
    throw new ApiError('Respons sesi dari server tidak valid.', { code: 'INVALID_RESPONSE' })
  }
  publish({ user: data.user, accessToken: data.accessToken })
  return data.user
}

export function issueAuthSession(path, body) {
  const pendingLogout = logoutTask
  const pendingIssuance = issuanceTask
  const pendingRefresh = refreshTask?.promise
  clearAuthSession()
  const expectedGeneration = generation
  const task = (async () => {
    // Capture preceding operations only: a later logout may wait for this task.
    if (pendingLogout) await pendingLogout.catch(() => {})
    if (pendingIssuance) await pendingIssuance.catch(() => {})
    if (pendingRefresh) await pendingRefresh.catch(() => {})
    if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
    const data = await request(path, { method: 'POST', body })
    return applyAuthSession(data, expectedGeneration)
  })().finally(() => {
    if (issuanceTask === task) issuanceTask = null
  })
  issuanceTask = task
  return task
}

async function request(path, { method = 'GET', body, headers: suppliedHeaders, signal, token } = {}) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new ApiError('Alamat API tidak valid.', { code: 'INVALID_API_PATH' })
  }
  const headers = new Headers(suppliedHeaders)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  if (isForm) headers.delete('Content-Type')
  else if (body !== undefined) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      signal,
      ...(body !== undefined ? { body: isForm ? body : JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('Tidak dapat terhubung ke server. Coba lagi sebentar.', { code: 'NETWORK_ERROR' })
  }

  if (response.status === 204 && response.ok) return null
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.success === false) {
    throw new ApiError(typeof payload?.message === 'string' ? payload.message : 'Permintaan belum berhasil diproses.', {
      status: response.status,
      code: typeof payload?.code === 'string' ? payload.code : 'HTTP_ERROR',
      details: payload?.details,
    })
  }
  if (payload?.success !== true || !Object.hasOwn(payload, 'data')) {
    throw new ApiError('Respons dari server tidak valid.', { status: response.status, code: 'INVALID_RESPONSE' })
  }
  return payload.data
}

export function refreshSession() {
  if (loggingOut) return Promise.reject(sessionChanged())
  if (refreshTask?.generation === generation) return refreshTask.promise

  const expectedGeneration = generation
  const pendingIssuance = issuanceTask
  const task = { generation: expectedGeneration, promise: null }
  task.promise = (async () => {
    if (pendingIssuance) {
      await pendingIssuance
      if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
      return session.user
    }
    const data = await request('/auth/refresh', { method: 'POST' })
    applyAuthSession(data, expectedGeneration)
    return data.user
  })()
    .catch((error) => {
      if (generation === expectedGeneration && (error.status === 401 || error.status === 403)) clearAuthSession()
      throw error
    })
    .finally(() => {
      if (refreshTask === task) refreshTask = null
    })
  refreshTask = task
  return task.promise
}

export function logoutSession() {
  if (logoutTask) {
    clearAuthSession()
    return logoutTask
  }
  loggingOut = true
  const pendingRefresh = refreshTask?.promise
  const pendingIssuance = issuanceTask
  clearAuthSession()
  // Login, registration and refresh can all set cookies. Revoke only after
  // preceding responses finish, so none can restore the cookie after logout.
  logoutTask = (async () => {
    if (pendingIssuance) await pendingIssuance.catch(() => {})
    if (pendingRefresh) await pendingRefresh.catch(() => {})
    return request('/auth/logout', { method: 'POST' })
  })().finally(() => {
    loggingOut = false
    logoutTask = null
  })
  return logoutTask
}

export async function apiRequest(path, { auth = false, ...options } = {}) {
  // Login, registration and refresh must never trigger a recursive refresh.
  const privateRequest = auth && !/^\/auth\/(?:login|refresh|logout|register(?:\/[^/?#]+)?)(?:[?#]|$)/.test(path)
  if (!privateRequest) return request(path, options)

  options.signal?.throwIfAborted()
  const expectedGeneration = generation
  if (!session.accessToken) await refreshSession()
  if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
  options.signal?.throwIfAborted()
  const originalToken = session.accessToken
  try {
    const data = await request(path, { ...options, token: originalToken })
    if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
    return data
  } catch (error) {
    if (error.status !== 401) throw error
    if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
    // Another concurrent request may already have rotated this token.
    if (session.accessToken === originalToken) await refreshSession()
    if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
    options.signal?.throwIfAborted()
    const retryToken = session.accessToken
    try {
      const data = await request(path, { ...options, token: retryToken })
      if (generation !== expectedGeneration || loggingOut) throw sessionChanged()
      return data
    } catch (retryError) {
      if (retryError.status === 401 && generation === expectedGeneration && session.accessToken === retryToken) clearAuthSession()
      throw retryError
    }
  }
}
