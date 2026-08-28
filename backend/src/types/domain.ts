export type UserRole = 'ADMIN' | 'CUSTOMER' | 'UMKM'
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED'
export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'REVISION' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'

export interface PublicUser {
  email: string
  fullName: string
  id: string
  role: UserRole
  status: UserStatus
}

export interface AuthClaims {
  role: UserRole
  sub: string
}
