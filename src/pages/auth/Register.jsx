import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'

function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', terms: false })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (form.fullName.trim().length < 3) {
      setMessage('Nama lengkap minimal 3 karakter.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setMessage('Masukkan alamat email yang valid.')
      return
    }
    if (form.password.length < 8) {
      setMessage('Password minimal 8 karakter.')
      return
    }
    if (!form.terms) {
      setMessage('Kamu harus menyetujui syarat dan kebijakan privasi.')
      return
    }
    navigate('/login')
  }

  return (
    <AuthLayout title="Buat akun baru" subtitle="Daftar dan temukan tempat makan favoritmu.">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label>
          Nama lengkap
          <input name="fullName" type="text" value={form.fullName} onChange={updateField} placeholder="Nama lengkapmu" autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="nama@email.com" autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Minimal 8 karakter" autoComplete="new-password" />
        </label>
        <label className="auth-checkbox auth-checkbox--terms">
          <input name="terms" type="checkbox" checked={form.terms} onChange={updateField} />
          <span>Saya menyetujui <a href="#syarat">Syarat & Ketentuan</a> dan <a href="#privasi">Kebijakan Privasi</a>.</span>
        </label>
        {message && <p className="auth-form__message" role="alert">{message}</p>}
        <button className="auth-submit" type="submit">Daftar</button>
      </form>
      <p className="auth-switch">Sudah punya akun? <Link to="/login">Masuk</Link></p>
    </AuthLayout>
  )
}

export default Register
