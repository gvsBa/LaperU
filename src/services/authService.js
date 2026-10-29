import { issueAuthSession, logoutSession, refreshSession } from './apiClient.js'

export function login(email, password) {
  return issueAuthSession('/auth/login', { email, password })
}

export function registerCustomer(input) {
  return issueAuthSession('/auth/register/customer', input)
}

export function registerUmkm(input) {
  return issueAuthSession('/auth/register/umkm', input)
}

export const logout = logoutSession
export const restoreSession = refreshSession

export function safeNextPath(value, fallback = '/explore') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  if ([...value].some((character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)) return fallback
  const pathname = value.split(/[?#]/, 1)[0]
  if (pathname.includes('%') || pathname.includes('//') || /(?:^|\/)\.{1,2}(?:\/|$)/.test(pathname)) return fallback
  return /^(?:\/explore|\/favorites|\/account|\/admin(?:\/(?:pengajuan|warung|pengguna|ulasan-laporan|master-data|audit-log))?|\/umkm(?:\/(?:pengajuan|profil-warung|menu|jam-operasional|ulasan|foto|akun))?|\/reviews|\/restaurants\/[a-zA-Z0-9_-]+)$/.test(pathname) ? value : fallback
}
