import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import type { AuthMode, LoginPayload } from '../types/auth'
import { PasswordField } from '../components/PasswordField'
import { ApiError, login } from '../lib/api'

interface LoginPageProps {
  onModeChange: (mode: AuthMode) => void
}

interface LoginErrors {
  email?: string
  password?: string
}

export function LoginPage({ onModeChange }: LoginPageProps) {
  const [form, setForm] = useState<LoginPayload>({
    email: '',
    password: '',
    remember: false,
  })
  const [errors, setErrors] = useState<LoginErrors>({})
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const nextErrors: LoginErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Masukkan alamat email yang valid.'
    }
    if (!form.password) {
      nextErrors.password = 'Kata sandi wajib diisi.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const result = await login(form.email.trim(), form.password)
      setMessage(`Berhasil masuk sebagai ${result.user.fullName}.`)
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="auth-header">
        <p className="eyebrow">Selamat datang kembali</p>
        <h2>Masuk ke LaperU</h2>
        <p>Akses daftar favorit, ulasan, dan rekomendasi kulinermu.</p>
      </header>

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="login-email">Email</label>
          <input
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={errors.email ? 'input--error' : undefined}
            id="login-email"
            name="email"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="nama@email.com"
            required
            type="email"
            value={form.email}
          />
          {errors.email ? (
            <span className="field-error" id="login-email-error">{errors.email}</span>
          ) : null}
        </div>

        <PasswordField
          autoComplete="current-password"
          error={errors.password}
          id="login-password"
          label="Kata sandi"
          name="password"
          onChange={(password) => setForm({ ...form, password })}
          value={form.password}
        />

        <div className="form-options">
          <label className="checkbox-label">
            <input
              checked={form.remember}
              onChange={(event) => setForm({ ...form, remember: event.target.checked })}
              type="checkbox"
            />
            <span>Ingat saya</span>
          </label>
          <button className="text-button" onClick={() => setMessage('Fitur reset kata sandi akan dihubungkan ke Backend.')} type="button">
            Lupa kata sandi?
          </button>
        </div>

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Memproses…' : 'Masuk'} <ArrowRight aria-hidden="true" />
        </button>

        <p aria-live="polite" className="form-message">{message}</p>
      </form>

      <p className="auth-switch">
        Belum punya akun?{' '}
        <button className="text-button" onClick={() => onModeChange('signup')} type="button">
          Buat akun
        </button>
      </p>
    </>
  )
}
