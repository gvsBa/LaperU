import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <header className="site-header">
        <BrandMark />
        <p>Kuliner sekitar Telkom University</p>
      </header>

      <section className="auth-panel" aria-label="Autentikasi LaperU">
        <div className="auth-card">{children}</div>
      </section>

      <footer className="site-footer">
        <span>© 2026 LaperU</span>
        <span>Untuk TelUtizen</span>
      </footer>
    </main>
  )
}
