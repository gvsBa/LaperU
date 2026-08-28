const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'

interface ApiEnvelope<T> {
  data: T
  message?: string
  success: boolean
}

export interface AuthUser {
  email: string
  fullName: string
  id: string
  role: 'ADMIN' | 'CUSTOMER' | 'UMKM'
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
}

export interface AuthResult {
  accessToken: string
  user: AuthUser
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new ApiError('Backend belum dapat dihubungi. Pastikan server API sedang berjalan.', 0)
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? 'Permintaan tidak dapat diproses.', response.status)
  }

  return payload.data
}

export async function login(email: string, password: string) {
  const result = await request<AuthResult>('/auth/login', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  })
  setAccessToken(result.accessToken)
  return result
}

export async function registerCustomer(fullName: string, email: string, password: string) {
  const result = await request<AuthResult>('/auth/register/customer', {
    body: JSON.stringify({ email, fullName, password }),
    method: 'POST',
  })
  setAccessToken(result.accessToken)
  return result
}
