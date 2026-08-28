import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import type { AuthMode, SignUpPayload } from '../types/auth'
import { PasswordField } from '../components/PasswordField'
import { ApiError, registerCustomer } from '../lib/api'

interface SignUpPageProps {
  onModeChange: (mode: AuthMode) => void
}

interface SignUpErrors {
  acceptTerms?: string
  confirmPassword?: string
  email?: string
  fullName?: string
  password?: string
}

export function SignUpPage({ onModeChange }: SignUpPageProps) {
  const [form, setForm] = useState<SignUpPayload>({
    fullName: '',
    email: '',
    password: '',
    acceptTerms: false,
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignUpErrors>({})
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordChecks = useMemo(
    () => [
      { label: 'Minimal 8 karakter', valid: form.password.length >= 8 },
      { label: 'Memiliki huruf dan angka', valid: /[A-Za-z]/.test(form.password) && /\d/.test(form.password) },
    ],
    [form.password],
  )

  function validate() {
    const nextErrors: SignUpErrors = {}
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Masukkan nama lengkap.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Masukkan alamat email yang valid.'
    if (!passwordChecks.every((check) => check.valid)) nextErrors.password = 'Kata sandi belum memenuhi ketentuan.'
    if (!confirmPassword) nextErrors.confirmPassword = 'Ulangi kata sandi.'
    else if (confirmPassword !== form.password) nextErrors.confirmPassword = 'Konfirmasi kata sandi tidak sama.'
    if (!form.acceptTerms) nextErrors.acceptTerms = 'Persetujuan diperlukan untuk membuat akun.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await registerCustomer(form.fullName.trim(), form.email.trim(), form.password)
      setMessage('Akun berhasil dibuat. Kamu sudah terhubung ke LaperU.')
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <header className="auth-header auth-header--compact">
        <p className="eyebrow">Bergabung dengan LaperU</p>
        <h2>Buat akun mahasiswa</h2>
        <p>Simpan warung favorit dan bagikan ulasan yang membantu.</p>
      </header>

      <form className="auth-form auth-form--signup" noValidate onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="signup-name">Nama lengkap</label>
          <input
            aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
            aria-invalid={Boolean(errors.fullName)}
            autoComplete="name"
            className={errors.fullName ? 'input--error' : undefined}
            id="signup-name"
            name="fullName"
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="Nama lengkap"
            required
            type="text"
            value={form.fullName}
          />
          {errors.fullName ? <span className="field-error" id="signup-name-error">{errors.fullName}</span> : null}
        </div>

        <div className="field-group">
          <label htmlFor="signup-email">Email</label>
          <input
            aria-describedby={errors.email ? 'signup-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={errors.email ? 'input--error' : undefined}
            id="signup-email"
            name="email"
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="nama@email.com"
            required
            type="email"
            value={form.email}
          />
          {errors.email ? <span className="field-error" id="signup-email-error">{errors.email}</span> : null}
        </div>

        <PasswordField
          autoComplete="new-password"
          error={errors.password}
          id="signup-password"
          label="Kata sandi"
          name="password"
          onChange={(password) => setForm({ ...form, password })}
          value={form.password}
        />

        <div className="password-rules" aria-label="Ketentuan kata sandi">
          {passwordChecks.map((check) => (
            <span className={check.valid ? 'is-valid' : ''} key={check.label}>
              <Check aria-hidden="true" /> {check.label}
            </span>
          ))}
        </div>

        <PasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          id="signup-confirm-password"
          label="Konfirmasi kata sandi"
          name="confirmPassword"
          onChange={setConfirmPassword}
          placeholder="Ulangi kata sandi"
          value={confirmPassword}
        />

        <div>
          <label className="checkbox-label checkbox-label--terms">
            <input
              aria-describedby={errors.acceptTerms ? 'terms-error' : undefined}
              aria-invalid={Boolean(errors.acceptTerms)}
              checked={form.acceptTerms}
              onChange={(event) => setForm({ ...form, acceptTerms: event.target.checked })}
              type="checkbox"
            />
            <span>
              Saya menyetujui <a href="#terms">Syarat Penggunaan</a> dan{' '}
              <a href="#privacy">Kebijakan Privasi</a>.
            </span>
          </label>
          {errors.acceptTerms ? <span className="field-error" id="terms-error">{errors.acceptTerms}</span> : null}
        </div>

        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Memproses…' : 'Buat akun'} <ArrowRight aria-hidden="true" />
        </button>

        <p aria-live="polite" className="form-message">{message}</p>
      </form>

      <p className="auth-switch">
        Sudah punya akun?{' '}
        <button className="text-button" onClick={() => onModeChange('login')} type="button">
          Masuk
        </button>
      </p>
    </>
  )
}
