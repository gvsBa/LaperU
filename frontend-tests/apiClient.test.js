import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const user = { id: 'customer-1', fullName: 'QA Customer', email: 'qa@example.test', role: 'CUSTOMER', status: 'ACTIVE' }
const envelope = (data, status = 200) => new Response(JSON.stringify({ success: true, data }), { status })
const failure = (status, code = 'INVALID_ACCESS_TOKEN', details) => new Response(JSON.stringify({ success: false, code, message: 'Pesan server', details }), { status })
const deferred = () => {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

let client
let auth
let fetchMock

beforeEach(async () => {
  vi.resetModules()
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  client = await import('../src/services/apiClient.js')
  auth = await import('../src/services/authService.js')
})

afterEach(() => vi.unstubAllGlobals())

async function signIn() {
  fetchMock.mockResolvedValueOnce(envelope({ accessToken: 'old-access', user }))
  await auth.login(user.email, 'Password123')
  fetchMock.mockClear()
}

describe('API request contract', () => {
  it('mengirim cookie dan JSON serta membuka envelope data', async () => {
    fetchMock.mockResolvedValueOnce(envelope({ accepted: true }))
    await expect(client.apiRequest('/example', { method: 'POST', body: { name: 'QA' } })).resolves.toEqual({ accepted: true })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/example')
    expect(options.credentials).toBe('include')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.headers.get('Authorization')).toBeNull()
    expect(options.body).toBe('{"name":"QA"}')
  })

  it('mempertahankan FormData tanpa memasang Content-Type manual', async () => {
    const form = new FormData()
    form.append('name', 'QA')
    fetchMock.mockResolvedValueOnce(envelope({ uploaded: true }))
    await client.apiRequest('/upload', { method: 'POST', body: form, headers: { 'Content-Type': 'wrong' } })
    expect(fetchMock.mock.calls[0][1].body).toBe(form)
    expect(fetchMock.mock.calls[0][1].headers.get('Content-Type')).toBeNull()
  })

  it('menyimpan status, code dan details dari error API', async () => {
    const details = { fieldErrors: { email: ['Email tidak valid'] } }
    fetchMock.mockResolvedValueOnce(failure(422, 'VALIDATION_ERROR', details))
    await expect(client.apiRequest('/example')).rejects.toMatchObject({ name: 'ApiError', status: 422, code: 'VALIDATION_ERROR', details })
  })

  it('menolak respons sukses non-envelope', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>Vite fallback</html>', { status: 200 }))
    await expect(client.apiRequest('/example')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('membedakan error jaringan dan pembatalan request', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(client.apiRequest('/example')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    const abort = new DOMException('Aborted', 'AbortError')
    fetchMock.mockRejectedValueOnce(abort)
    await expect(client.apiRequest('/example')).rejects.toBe(abort)
  })

  it('menolak path eksternal sebelum mengirim request', async () => {
    await expect(client.apiRequest('https://example.test/private')).rejects.toMatchObject({ code: 'INVALID_API_PATH' })
    await expect(client.apiRequest('//example.test/private')).rejects.toMatchObject({ code: 'INVALID_API_PATH' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tidak menyegarkan ulang login gagal secara rekursif', async () => {
    fetchMock.mockResolvedValueOnce(failure(401, 'INVALID_CREDENTIALS'))
    await expect(client.apiRequest('/auth/login', { auth: true, method: 'POST', body: {} })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('memory session and refresh', () => {
  it('memberi tahu subscriber dan tidak memakai localStorage', async () => {
    const storage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }
    vi.stubGlobal('localStorage', storage)
    const changed = vi.fn()
    const unsubscribe = client.subscribeAuthSession(changed)
    await signIn()
    expect(client.getAuthSession()).toEqual({ user, accessToken: 'old-access' })
    expect(changed).toHaveBeenCalledTimes(2)
    unsubscribe()
    client.clearAuthSession()
    expect(changed).toHaveBeenCalledTimes(2)
    expect(storage.getItem).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('memulihkan sesi dari cookie lalu mengirim Bearer untuk request private', async () => {
    fetchMock.mockResolvedValueOnce(envelope({ accessToken: 'restored-access', user }))
    fetchMock.mockResolvedValueOnce(envelope(user))
    await expect(client.apiRequest('/auth/me', { auth: true })).resolves.toEqual(user)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/refresh')
    expect(fetchMock.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer restored-access')
  })

  it('menggabungkan refresh paralel dan retry tiap request sekali', async () => {
    await signIn()
    const rotation = deferred()
    fetchMock.mockImplementation((url, options) => {
      if (url.endsWith('/auth/refresh')) return rotation.promise
      return Promise.resolve(options.headers.get('Authorization') === 'Bearer old-access'
        ? failure(401) : envelope({ value: url }))
    })
    const first = client.apiRequest('/customer/favorites', { auth: true })
    const second = client.apiRequest('/customer/reviews', { auth: true })
    await vi.waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1))
    rotation.resolve(envelope({ accessToken: 'new-access', user }))
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(client.getAuthSession().accessToken).toBe('new-access')
  })

  it('membatasi retry 401 dan menghapus sesi bila token baru juga ditolak', async () => {
    await signIn()
    fetchMock.mockResolvedValueOnce(failure(401))
    fetchMock.mockResolvedValueOnce(envelope({ accessToken: 'new-access', user }))
    fetchMock.mockResolvedValueOnce(failure(401))
    await expect(client.apiRequest('/customer/favorites', { auth: true })).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(client.getAuthSession()).toEqual({ user: null, accessToken: null })
  })

  it('menghapus sesi jika refresh cookie kedaluwarsa', async () => {
    await signIn()
    fetchMock.mockResolvedValueOnce(failure(401))
    fetchMock.mockResolvedValueOnce(failure(401, 'INVALID_REFRESH_TOKEN'))
    await expect(client.apiRequest('/customer/favorites', { auth: true })).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' })
    expect(client.getAuthSession().user).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('tidak mencoba refresh untuk larangan akses 403', async () => {
    await signIn()
    fetchMock.mockResolvedValueOnce(failure(403, 'FORBIDDEN'))
    await expect(client.apiRequest('/admin/users', { auth: true })).rejects.toMatchObject({ status: 403 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('logout menunggu rotasi cookie dan mencegah refresh lama memulihkan user', async () => {
    await signIn()
    const rotation = deferred()
    fetchMock.mockImplementation((url) => url.endsWith('/auth/refresh') ? rotation.promise : Promise.resolve(envelope(null)))
    const restoring = client.refreshSession()
    const rejected = expect(restoring).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    const loggingOut = auth.logout()
    expect(client.getAuthSession().user).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
    rotation.resolve(envelope({ accessToken: 'too-late', user }))
    await rejected
    await loggingOut
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/v1/auth/refresh', '/api/v1/auth/logout'])
    expect(client.getAuthSession()).toEqual({ user: null, accessToken: null })
  })

  it('respons 401 request lama setelah logout tidak memulai refresh baru', async () => {
    await signIn()
    const oldRequest = deferred()
    fetchMock.mockImplementation((url) => url.endsWith('/auth/logout') ? Promise.resolve(envelope(null)) : oldRequest.promise)
    const pending = client.apiRequest('/customer/favorites', { auth: true })
    const rejected = expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    await auth.logout()
    oldRequest.resolve(failure(401))
    await rejected
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(client.getAuthSession().user).toBeNull()
  })

  it('menghapus sesi lokal meskipun request logout gagal', async () => {
    await signIn()
    fetchMock.mockRejectedValueOnce(new TypeError('Offline'))
    await expect(auth.logout()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
    expect(client.getAuthSession().user).toBeNull()
  })

  it.each(['login', 'registerCustomer', 'registerUmkm'])('logout menunggu cookie dari %s yang masih berjalan sebelum mencabut sesi', async (method) => {
    const issuance = deferred()
    let browserCookie = null
    fetchMock.mockImplementation((url) => {
      if (url.endsWith('/auth/logout')) {
        browserCookie = null
        return Promise.resolve(envelope(null))
      }
      if (url.endsWith('/auth/refresh')) return Promise.resolve(browserCookie
        ? envelope({ accessToken: 'restored-unexpectedly', user }) : failure(401, 'MISSING_REFRESH_TOKEN'))
      return issuance.promise.then(() => {
        browserCookie = 'issued-cookie'
        return envelope({ accessToken: 'late-issuance', user })
      })
    })
    const pending = method === 'login'
      ? auth.login(user.email, 'Password123')
      : auth[method]({ email: user.email, password: 'Password123' })
    const rejected = expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const loggingOut = auth.logout()
    expect(client.getAuthSession().user).toBeNull()
    expect(fetchMock).toHaveBeenCalledOnce()
    issuance.resolve()
    await rejected
    await loggingOut
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/logout')
    expect(browserCookie).toBeNull()
    await expect(auth.restoreSession()).rejects.toMatchObject({ code: 'MISSING_REFRESH_TOKEN' })
    expect(client.getAuthSession().user).toBeNull()
  })

  it('mengurutkan login bersamaan sehingga akun terakhir juga memiliki cookie terakhir', async () => {
    const firstIssuance = deferred()
    const secondUser = { ...user, id: 'customer-2', email: 'second@example.test' }
    let cookieOwner = null
    fetchMock.mockImplementation((url, options) => {
      if (url.endsWith('/auth/refresh')) return Promise.resolve(envelope({ accessToken: 'restored', user: cookieOwner }))
      const email = JSON.parse(options.body).email
      if (email === user.email) return firstIssuance.promise.then(() => {
        cookieOwner = user
        return envelope({ accessToken: 'first', user })
      })
      cookieOwner = secondUser
      return Promise.resolve(envelope({ accessToken: 'second', user: secondUser }))
    })
    const first = auth.login(user.email, 'Password123')
    const firstRejected = expect(first).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    const second = auth.login(secondUser.email, 'Password123')
    expect(fetchMock).toHaveBeenCalledOnce()
    firstIssuance.resolve()
    await firstRejected
    await expect(second).resolves.toEqual(secondUser)
    expect(cookieOwner).toEqual(secondUser)
    expect(client.getAuthSession().user).toEqual(secondUser)
    client.clearAuthSession()
    await expect(auth.restoreSession()).resolves.toEqual(secondUser)
  })

  it('login yang dimulai setelah logout menunggu logout selesai tanpa deadlock', async () => {
    await signIn()
    const revocation = deferred()
    fetchMock.mockImplementation((url) => url.endsWith('/auth/logout')
      ? revocation.promise : Promise.resolve(envelope({ accessToken: 'next-login', user })))
    const loggingOut = auth.logout()
    const nextLogin = auth.login(user.email, 'Password123')
    expect(fetchMock).toHaveBeenCalledOnce()
    revocation.resolve(envelope(null))
    await loggingOut
    await expect(nextLogin).resolves.toEqual(user)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/api/v1/auth/logout', '/api/v1/auth/login'])
    expect(client.getAuthSession().accessToken).toBe('next-login')
  })

  it('logout kedua membatalkan login yang antre sesudah logout pertama', async () => {
    await signIn()
    const revocation = deferred()
    fetchMock.mockReturnValueOnce(revocation.promise)
    const firstLogout = auth.logout()
    const queuedLogin = auth.login(user.email, 'Password123')
    const rejected = expect(queuedLogin).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    const lastLogout = auth.logout()
    revocation.resolve(envelope(null))
    await Promise.all([firstLogout, lastLogout, rejected])
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(client.getAuthSession().user).toBeNull()
  })

  it('refresh selama login menunggu hasil login tanpa merotasi cookie lain', async () => {
    const issuance = deferred()
    fetchMock.mockReturnValueOnce(issuance.promise)
    const loggingIn = auth.login(user.email, 'Password123')
    const restoring = client.refreshSession()
    expect(fetchMock).toHaveBeenCalledOnce()
    issuance.resolve(envelope({ accessToken: 'issued', user }))
    await expect(loggingIn).resolves.toEqual(user)
    await expect(restoring).resolves.toEqual(user)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(client.getAuthSession().accessToken).toBe('issued')
  })

  it.each([false, true])('menolak respons private sukses yang datang setelah logout (retry=%s)', async (retry) => {
    await signIn()
    const oldResponse = deferred()
    if (retry) {
      fetchMock.mockResolvedValueOnce(failure(401))
      fetchMock.mockResolvedValueOnce(envelope({ accessToken: 'rotated', user }))
    }
    fetchMock.mockImplementation((url) => url.endsWith('/auth/logout') ? Promise.resolve(envelope(null)) : oldResponse.promise)
    const pending = client.apiRequest('/customer/favorites', { auth: true })
    const rejected = expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(retry ? 3 : 1))
    await auth.logout()
    oldResponse.resolve(envelope([{ id: 'private-old-account' }]))
    await rejected
    expect(client.getAuthSession().user).toBeNull()
  })

  it.each(['registerCustomer', 'registerUmkm'])('%s mengembalikan user dan menyimpan access token di memori', async (method) => {
    fetchMock.mockResolvedValueOnce(envelope({ accessToken: 'registered-access', user }, 201))
    await expect(auth[method]({ email: user.email, password: 'Password123' })).resolves.toEqual(user)
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/v1/auth/register/${method === 'registerCustomer' ? 'customer' : 'umkm'}`)
    expect(client.getAuthSession().accessToken).toBe('registered-access')
  })
})

describe('safe return destination', () => {
  it.each(['/explore?category=nasi', '/favorites', '/account#profile', '/restaurants/warung-qa?tab=menu'])('mengizinkan tujuan internal %s', (path) => {
    expect(auth.safeNextPath(path)).toBe(path)
  })

  it.each(['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/register', '/admin', '/explore/../login', '/%65xplore', '/restaurants/%2e%2e', '/restaurants//evil', '/explore\n'])('menolak tujuan tidak aman atau di luar allowlist %s', (path) => {
    expect(auth.safeNextPath(path)).toBe('/explore')
  })
})
