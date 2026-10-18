import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../auth/useAuth.js'

const roleLabels = { ADMIN: 'Admin', UMKM: 'Pemilik warung', CUSTOMER: 'Mahasiswa / Customer' }
const statusLabels = { ACTIVE: 'Aktif', PENDING: 'Menunggu persetujuan', SUSPENDED: 'Ditangguhkan' }

function Account() {
  const { user, loading, error, logout } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [loggedOut, setLoggedOut] = useState(false)

  async function handleLogout() {
    if (pending) return
    setPending(true)
    setMessage('')
    try {
      await logout()
      setLoggedOut(true)
    } catch (failure) {
      setMessage(`Sesi lokal telah dihapus, tetapi keluar dari server belum terkonfirmasi. ${failure.message || 'Silakan coba lagi saat koneksi tersedia.'}`)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout title="Akun LaperU" subtitle="Informasi akun yang terhubung ke layanan LaperU.">
      {loading ? <p className="session-status" role="status">Memuat sesi…</p> : user ? (
        <section className="account-card" aria-label="Informasi akun">
          <dl className="account-details">
            <div><dt>Nama</dt><dd>{user.fullName}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Jenis akun</dt><dd>{roleLabels[user.role] ?? user.role}</dd></div>
            <div><dt>Status</dt><dd>{statusLabels[user.status] ?? user.status}</dd></div>
          </dl>
          {user.role === 'UMKM' && <p className="auth-help">Dashboard pemilik warung belum tersedia pada frontend ini. Akun baru memiliki draft pengajuan; status menunggu persetujuan tidak berarti pengajuan sudah dikirim ke admin.</p>}
          {user.role === 'ADMIN' && <p className="auth-help">Dashboard persetujuan dan pengelolaan admin belum tersedia pada frontend ini.</p>}
          {user.role === 'CUSTOMER' && <p className="auth-switch"><Link to="/favorites">Lihat warung favoritmu</Link></p>}
          <button type="button" className="auth-submit" disabled={pending} onClick={handleLogout}>{pending ? 'Sedang keluar…' : 'Keluar dari akun'}</button>
        </section>
      ) : (
        <section className="account-card">
          <p className="session-status" role="status">{loggedOut ? 'Kamu sudah keluar dari akun.' : 'Kamu belum masuk ke akun.'}</p>
          {error && !message && <p className="auth-form__message" role="alert">{typeof error === 'string' ? error : error.message}</p>}
          <p className="auth-switch"><Link to="/login?next=/account">Masuk ke akun</Link></p>
          <p className="auth-switch"><Link to="/register">Buat akun mahasiswa</Link></p>
        </section>
      )}
      {message && <><p className="auth-form__message" role="alert">{message}</p>{!user && <button type="button" className="auth-submit" disabled={pending} onClick={handleLogout}>{pending ? 'Sedang keluar…' : 'Coba keluar lagi'}</button>}</>}
      <p className="auth-switch"><Link to="/explore">Kembali jelajahi warung</Link></p>
    </AuthLayout>
  )
}

export default Account
