import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function RoleGate({ role, children }) {
  const { user, loading, error } = useAuth()
  const location = useLocation()
  if (loading) return <main className="management-page"><p role="status">Memuat sesi…</p></main>
  if (!user) return <main className="management-page"><h1>Silakan masuk</h1><p>{error || 'Halaman ini membutuhkan akun.'}</p><Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Masuk ke akun</Link></main>
  if (user.role !== role) return <main className="management-page"><h1>Akses tidak tersedia</h1><p>Halaman ini khusus untuk akun {role}.</p><Link to="/account">Kembali ke akun</Link></main>
  return <section key={user.id}>{children}</section>
}
