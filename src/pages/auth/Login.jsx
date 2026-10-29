import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../auth/useAuth.js'
import { safeNextPath } from '../../services/authService.js'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading, login } = useAuth()
  const destination = safeNextPath(searchParams.get('next'))

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending || loading) return
    if (!form.email.trim() || !form.password) {
      setMessage('Email dan password wajib diisi.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMessage('Masukkan alamat email yang valid.')
      return
    }
    setPending(true)
    setMessage('')
    try {
      const loggedInUser = await login(form.email.trim().toLowerCase(), form.password)
      navigate(searchParams.has('next') ? destination : loggedInUser.role === 'CUSTOMER' ? '/explore' : '/account', { replace: true })
    } catch (error) {
      setMessage(error.message || 'Belum berhasil masuk. Silakan coba lagi.')
    } finally {
      setPending(false)
    }
  }

  if (!loading && user && !pending) return <Navigate to={searchParams.has('next') ? destination : user.role === 'CUSTOMER' ? '/explore' : '/account'} replace />

  return (
    <AuthLayout title="Selamat datang kembali!" subtitle="Masuk untuk melanjutkan aktivitasmu di LaperU.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={pending || loading}>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="nama@email.com" autoComplete="email" maxLength={190} disabled={pending || loading} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Masukkan password" autoComplete="current-password" maxLength={72} disabled={pending || loading} required />
        </label>
        <p className="auth-help"><Link to="/forgot-password">Lupa kata sandi? Pulihkan dengan kode cadangan</Link></p>
        {message && <p className="auth-form__message" role="alert">{message}</p>}
        <button className="auth-submit" type="submit" disabled={pending || loading}>{pending ? 'Sedang masuk…' : loading ? 'Memuat sesi…' : 'Masuk'}</button>
      </form>
      <p className="auth-switch">Belum punya akun? <Link to={`/register?next=${encodeURIComponent(destination)}`}>Daftar</Link></p>
    </AuthLayout>
  )
}

export default Login
