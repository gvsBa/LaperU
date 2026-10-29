import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout'
import PasswordInput from '../../components/common/PasswordInput'
import { apiRequest, clearAuthSession } from '../../services/apiClient'

export default function Recovery() {
  const [form, setForm] = useState({ email: '', recoveryCode: '', newPassword: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const update = event => setForm({ ...form, [event.target.name]: event.target.value })
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    if (form.newPassword !== form.confirm) { setError('Konfirmasi kata sandi belum sama.'); return }
    setBusy(true); setError('')
    try {
      await apiRequest('/auth/reset-password', { method: 'POST', body: { email: form.email, recoveryCode: form.recoveryCode, newPassword: form.newPassword } })
      clearAuthSession(); setForm({ email: '', recoveryCode: '', newPassword: '', confirm: '' }); setDone(true)
    } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  return <AuthLayout title={done ? 'Akunmu siap kembali.' : 'Lupa kata sandi?'} subtitle="Pulihkan akun secara lokal, tanpa SMS atau OTP email.">
    {done ? <div className="recovery-success" role="status"><p>Kata sandi berhasil diperbarui. Semua sesi dan kode lama dibatalkan.</p><p>Setelah masuk, buat kode pemulihan baru di Keamanan akun.</p><Link className="button button--dark" to="/login">Masuk kembali</Link></div> : <form className="auth-form" onSubmit={submit}>
      <label>Email akun<input name="email" type="email" autoComplete="username" value={form.email} onChange={update} maxLength={190} required /></label>
      <label>Kode pemulihan<input name="recoveryCode" autoComplete="off" spellCheck={false} value={form.recoveryCode} onChange={update} placeholder="Kode rahasia yang pernah kamu simpan" maxLength={100} required /></label>
      <PasswordInput label="Kata sandi baru" name="newPassword" autoComplete="new-password" value={form.newPassword} onChange={update} minLength={8} maxLength={72} required />
      <PasswordInput label="Konfirmasi kata sandi baru" name="confirm" autoComplete="new-password" value={form.confirm} onChange={update} minLength={8} maxLength={72} required />
      <p className="auth-help">Minimal 8 karakter, mengandung huruf dan angka. Maksimal 72 byte UTF-8.</p>
      {error && <p className="auth-form__message" role="alert">{error}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? 'Memulihkan…' : 'Simpan kata sandi baru'}</button>
    </form>}
    <details className="recovery-help"><summary>Belum punya atau kehilangan kode?</summary><p>Jika masih bisa masuk, buat kode di Keamanan akun dengan kata sandi saat ini. Tanpa kata sandi maupun kode yang disimpan sebelumnya, email dan nama saja tidak cukup membuktikan kepemilikan. Hubungi pengelola lokal untuk pemeriksaan identitas melalui bukti yang sudah tercatat; tidak ada reset otomatis yang melewati verifikasi.</p></details>
    <p className="auth-switch"><Link to="/login">Kembali ke halaman masuk</Link></p>
  </AuthLayout>
}
