import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'

function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [message, setMessage] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.email.trim() || !form.password) {
      setMessage('Email dan password wajib diisi.')
      return
    }

    const destination = searchParams.get('next') || '/explore?mode=account'
    navigate(destination === '/explore' ? '/explore?mode=account' : destination)
  }

  return (
    <AuthLayout title="Selamat datang kembali!" subtitle="Masuk untuk melanjutkan aktivitasmu di LaperU.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="nama@email.com" autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Masukkan password" autoComplete="current-password" />
        </label>
        <div className="auth-form__options">
          <label className="auth-checkbox">
            <input name="remember" type="checkbox" checked={form.remember} onChange={updateField} />
            <span>Ingat saya</span>
          </label>
          <a href="#lupa-password">Lupa password?</a>
        </div>
        {message && <p className="auth-form__message" role="alert">{message}</p>}
        <button className="auth-submit" type="submit">Masuk</button>
      </form>
      <p className="auth-switch">Belum punya akun? <Link to="/register">Daftar</Link></p>
    </AuthLayout>
  )
}

export default Login
