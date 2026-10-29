import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest, clearAuthSession } from '../../services/apiClient'
import PasswordInput from '../common/PasswordInput'

export default function AccountSecurity() {
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [confirm, setConfirm] = useState('')
  const [codes, setCodes] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function run(action) {
    if (busy) return
    setBusy(true); setError('')
    try { await action() } catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }
  function download() {
    const url = URL.createObjectURL(new Blob(['KODE PEMULIHAN LAPERU — RAHASIA\nSimpan di tempat pribadi, jangan di GitHub.\nReset membatalkan seluruh set kode lama.\n\n' + codes.join('\n')], { type: 'text/plain' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'laperu-kode-pemulihan.txt'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <div className="security-settings">
    <div className="section-eyebrow">PRIVASI & AKSES</div><h2>Keamanan akun</h2><p>Jaga aksesmu dengan kata sandi kuat dan kode cadangan pribadi.</p>
    {error && <p className="auth-form__message" role="alert">{error}</p>}
    <section className="account-card"><h3>Kode pemulihan offline</h3><p>Buat 5 kode rahasia sebelum lupa kata sandi. Ditampilkan sekali; membuat set baru membatalkan set sebelumnya. Setelah satu kode dipakai untuk reset, seluruh set lama tidak berlaku.</p>
      <form className="auth-form" onSubmit={event => { event.preventDefault(); void run(async () => { const result = await apiRequest('/auth/recovery-codes', { method: 'POST', auth: true, body: { currentPassword } }); setCodes(result.codes); setCurrent('') }) }}>
        <PasswordInput label="Kata sandi saat ini untuk kode pemulihan" value={currentPassword} onChange={event => setCurrent(event.target.value)} autoComplete="current-password" required maxLength={72} />
        <button className="button button--dark" disabled={busy}>{busy ? 'Memproses…' : 'Buat kode pemulihan'}</button>
      </form>
      {codes.length > 0 && <div className="recovery-codes" role="status"><strong>Simpan sekarang. Kode tidak bisa ditampilkan ulang.</strong><ul>{codes.map(code => <li key={code}><code>{code}</code></li>)}</ul><button className="button button--outline" onClick={download}>Unduh kode rahasia</button><button className="button button--outline" onClick={() => setCodes([])}>Sudah disimpan, sembunyikan</button></div>}
    </section>
    <section className="account-card"><h3>Ganti kata sandi</h3><p>Semua sesi dan kode pemulihan lama akan dibatalkan. Kamu perlu masuk kembali.</p>
      <form className="auth-form" onSubmit={event => { event.preventDefault(); if (newPassword !== confirm) { setError('Konfirmasi kata sandi belum sama.'); return } void run(async () => { await apiRequest('/auth/change-password', { method: 'POST', auth: true, body: { currentPassword, newPassword } }); clearAuthSession(); window.location.assign('/login') }) }}>
        <PasswordInput label="Kata sandi saat ini" value={currentPassword} onChange={event => setCurrent(event.target.value)} autoComplete="current-password" required maxLength={72} />
        <PasswordInput label="Kata sandi baru" value={newPassword} onChange={event => setNew(event.target.value)} autoComplete="new-password" minLength={8} maxLength={72} required />
        <PasswordInput label="Konfirmasi kata sandi baru" value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password" minLength={8} maxLength={72} required />
        <p className="auth-help">Minimal 8 karakter, huruf dan angka; maksimal 72 byte UTF-8.</p>
        <button className="button button--dark" disabled={busy}>Perbarui kata sandi</button>
      </form>
    </section><Link to="/forgot-password">Panduan pemulihan akun</Link>
  </div>
}
