export type AuthMode = 'login' | 'signup'

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

export interface SignUpPayload {
  fullName: string
  email: string
  password: string
  acceptTerms: boolean
}
