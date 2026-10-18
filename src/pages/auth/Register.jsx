import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../auth/useAuth.js'
import { safeNextPath } from '../../services/authService.js'

function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', businessName: '', ownerName: '', phone: '', address: '' })
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading, registerCustomer, registerUmkm } = useAuth()
  const isUmkm = searchParams.get('role') === 'umkm'
  const destination = safeNextPath(searchParams.get('next'))

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending || loading) return
    if (form.fullName.trim().length < 2) {
      setMessage('Nama lengkap minimal 2 karakter.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMessage('Masukkan alamat email yang valid.')
      return
    }
    if (form.password.length < 8 || form.password.length > 72 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setMessage('Password harus 8–72 karakter dan mengandung huruf serta angka.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Konfirmasi password belum sama.')
      return
    }
    if (isUmkm && (form.businessName.trim().length < 2 || form.ownerName.trim().length < 2 || form.phone.trim().length < 8 || form.address.trim().length < 8)) {
      setMessage('Lengkapi nama warung dan pemilik (minimal 2 karakter), nomor telepon serta alamat (minimal 8 karakter).')
      return
    }
    setPending(true)
    setMessage('')
    const input = { fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), password: form.password }
    try {
      if (isUmkm) {
        await registerUmkm({ ...input, businessName: form.businessName.trim(), ownerName: form.ownerName.trim(), phone: form.phone.trim(), address: form.address.trim() })
        navigate('/account', { replace: true })
      } else {
        await registerCustomer(input)
        navigate(destination, { replace: true })
      }
    } catch (error) {
      setMessage(error.message || 'Akun belum berhasil dibuat. Silakan coba lagi.')
    } finally {
      setPending(false)
    }
  }

  if (!loading && user && !pending) return <Navigate to="/account" replace />

  return (
    <AuthLayout title={isUmkm ? 'Daftar sebagai pemilik warung' : 'Buat akun mahasiswa'} subtitle={isUmkm ? 'Buat akun UMKM. Warung baru tampil setelah pengajuan disetujui admin.' : 'Daftar dan temukan tempat makan favoritmu.'}>
      <div className="auth-role-switch" aria-label="Jenis akun">
        <Link to={`/register?role=customer&next=${encodeURIComponent(destination)}`} aria-current={!isUmkm ? 'page' : undefined}>Mahasiswa</Link>
        <Link to="/register?role=umkm" aria-current={isUmkm ? 'page' : undefined}>Pemilik warung</Link>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={pending || loading}>
        <label>
          Nama lengkap
          <input name="fullName" type="text" value={form.fullName} onChange={updateField} placeholder="Nama lengkapmu" autoComplete="name" maxLength={120} disabled={pending || loading} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="nama@email.com" autoComplete="email" maxLength={190} disabled={pending || loading} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Minimal 8 karakter, huruf dan angka" autoComplete="new-password" maxLength={72} disabled={pending || loading} required />
        </label>
        <label>
          Konfirmasi password
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} placeholder="Ulangi password" autoComplete="new-password" maxLength={72} disabled={pending || loading} required />
        </label>
        {isUmkm && <>
          <label>Nama warung<input name="businessName" type="text" value={form.businessName} onChange={updateField} placeholder="Nama usaha kulinermu" autoComplete="organization" maxLength={160} disabled={pending || loading} required /></label>
          <label>Nama pemilik<input name="ownerName" type="text" value={form.ownerName} onChange={updateField} placeholder="Nama pemilik usaha" maxLength={120} disabled={pending || loading} required /></label>
          <label>Nomor telepon usaha<input name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="08xxxxxxxxxx" autoComplete="tel" maxLength={30} disabled={pending || loading} required /></label>
          <label>Alamat warung<textarea name="address" value={form.address} onChange={updateField} placeholder="Jalan, nomor, dan wilayah warung" autoComplete="street-address" maxLength={500} rows={3} disabled={pending || loading} required /></label>
          <p className="auth-help">Pendaftaran ini membuat akun dan draft pengajuan. Halaman untuk melengkapi foto serta mengirim pengajuan masih dalam pengembangan.</p>
        </>}
        {message && <p className="auth-form__message" role="alert">{message}</p>}
        <button className="auth-submit" type="submit" disabled={pending || loading}>{pending ? 'Membuat akun…' : loading ? 'Memuat sesi…' : isUmkm ? 'Buat akun UMKM' : 'Buat akun mahasiswa'}</button>
      </form>
      <p className="auth-switch">Sudah punya akun? <Link to={`/login?next=${encodeURIComponent(isUmkm ? '/account' : destination)}`}>Masuk</Link></p>
    </AuthLayout>
  )
}

export default Register
