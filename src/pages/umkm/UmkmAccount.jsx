import { useState } from 'react'
import profileAvatar from '../../assets/images/profile-avatar.webp'

const initialSessions = [
  {
    id: 1,
    device: 'Chrome Windows',
    location: 'Bandung',
    lastActive: '2 jam lalu',
    isCurrent: true,
  },
  {
    id: 2,
    device: 'Safari iPhone',
    location: 'Ngawi',
    lastActive: '1 hari lalu',
    isCurrent: false,
  },
  {
    id: 3,
    device: 'Chrome Android',
    location: 'Bali',
    lastActive: '1 detik lalu',
    isCurrent: false,
  },
]

const loginHistory = [
  { id: 1, time: '13 Okt 2026 12.00', device: 'Chrome Windows', location: 'Bandung', status: 'Perangkat ini' },
  { id: 2, time: '10 Okt 2026 09.12', device: 'Safari iPhone', location: 'Ngawi', status: 'Gagal' },
  { id: 3, time: '7 Okt 2026 13.00', device: 'Chrome Android', location: 'Bali', status: 'Gagal' },
]

function UmkmAccount() {
  const [profile, setProfile] = useState({
    fullName: 'Nama Pemilik',
    email: 'pemilik@gmail.com',
    phone: '0812-3456-7890',
    businessName: 'Warung Saya',
  })

  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  })

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessions, setSessions] = useState(initialSessions)
  const [notice, setNotice] = useState('')
  const [passwordError, setPasswordError] = useState('')

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function saveProfile(event) {
    event.preventDefault()
    setNotice('Data profil berhasil disimpan secara lokal.')
  }

  function changePassword(event) {
    event.preventDefault()

    if (password.next.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.')
      return
    }

    if (password.next !== password.confirm) {
      setPasswordError('Konfirmasi kata sandi belum sama.')
      return
    }

    setPasswordError('')
    setPassword({ current: '', next: '', confirm: '' })
    setNotice('Kata sandi berhasil diperbarui secara lokal.')
  }

  function saveTwoFactor(event) {
    event.preventDefault()
    setNotice(
      twoFactorEnabled
        ? 'Verifikasi dua langkah berhasil diaktifkan secara lokal.'
        : 'Verifikasi dua langkah berhasil dimatikan secara lokal.',
    )
  }

  function removeSession(id) {
    setSessions((current) => current.filter((session) => session.id !== id))
    setNotice('Sesi perangkat berhasil dikeluarkan.')
  }

  function logoutOtherSessions() {
    setSessions((current) => current.filter((session) => session.isCurrent))
    setNotice('Semua sesi perangkat lain berhasil dikeluarkan.')
  }

  function deactivateAccount() {
    const confirmed = window.confirm(
      'Yakin ingin menonaktifkan akun? Aksi ini nanti harus diproses oleh backend.',
    )

    if (confirmed) {
      setNotice('Permintaan nonaktif akun tercatat secara lokal.')
    }
  }

  return (
    <section className="umkm-account">
      <div className="umkm-account__profile">
        <img src={profileAvatar} alt="" />
        <div>
          <strong>{profile.fullName}</strong>
          <span>{profile.email}</span>
        </div>
      </div>

      {notice && (
        <p className="umkm-account__notice">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi">
            ×
          </button>
        </p>
      )}

      <form className="umkm-account__card" onSubmit={saveProfile}>
        <h2>Data profil</h2>

        <div className="umkm-account__grid">
          <label>
            Nama lengkap
            <input
              value={profile.fullName}
              onChange={(event) => updateProfile('fullName', event.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => updateProfile('email', event.target.value)}
            />
          </label>

          <label>
            No. telepon
            <input
              value={profile.phone}
              onChange={(event) => updateProfile('phone', event.target.value)}
            />
          </label>

          <label>
            Nama usaha
            <input
              value={profile.businessName}
              onChange={(event) => updateProfile('businessName', event.target.value)}
            />
          </label>
        </div>

        <div className="umkm-account__actions">
          <button type="reset" className="umkm-account__button is-outline">
            Batal
          </button>
          <button type="submit" className="umkm-account__button">
            Simpan
          </button>
        </div>
      </form>

      <form className="umkm-account__card" onSubmit={changePassword}>
        <h2>Ubah kata sandi</h2>

        <div className="umkm-account__grid umkm-account__grid--password">
          <label>
            Kata sandi lama
            <input
              type="password"
              value={password.current}
              onChange={(event) =>
                setPassword((current) => ({ ...current, current: event.target.value }))
              }
            />
          </label>

          <label>
            Kata sandi baru
            <input
              type="password"
              value={password.next}
              onChange={(event) =>
                setPassword((current) => ({ ...current, next: event.target.value }))
              }
            />
          </label>

          <label>
            Konfirmasi kata sandi
            <input
              type="password"
              value={password.confirm}
              onChange={(event) =>
                setPassword((current) => ({ ...current, confirm: event.target.value }))
              }
            />
          </label>
        </div>

        <p className="umkm-account__hint">
          Minimal 8 karakter dengan kombinasi huruf dan angka.
        </p>

        {passwordError && <p className="umkm-account__error">{passwordError}</p>}

        <div className="umkm-account__actions">
          <button type="reset" className="umkm-account__button is-outline">
            Batal
          </button>
          <button type="submit" className="umkm-account__button">
            Perbarui Sandi
          </button>
        </div>
      </form>

      <form className="umkm-account__card" onSubmit={saveTwoFactor}>
        <h2>Verifikasi dua langkah</h2>

        <label className="umkm-account__email-field">
          Email pemulihan
          <input type="email" value={profile.email} readOnly />
        </label>

        <label className="umkm-account__checkbox">
          <input
            type="checkbox"
            checked={twoFactorEnabled}
            onChange={(event) => setTwoFactorEnabled(event.target.checked)}
          />
          <span>Aktifkan verifikasi dua langkah</span>
        </label>

        <div className="umkm-account__actions">
          <button type="button" className="umkm-account__button is-outline">
            Batal
          </button>
          <button type="submit" className="umkm-account__button">
            Simpan
          </button>
        </div>
      </form>

      <section className="umkm-account__card">
        <h2>Sesi login</h2>

        <div className="umkm-account__table-wrap">
          <table className="umkm-account__table">
            <thead>
              <tr>
                <th>Perangkat</th>
                <th>Lokasi</th>
                <th>Terakhir aktif</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.device}</td>
                  <td>{session.location}</td>
                  <td>{session.lastActive}</td>
                  <td>
                    {session.isCurrent ? (
                      <span className="umkm-account__current-session">Perangkat ini</span>
                    ) : (
                      <button
                        type="button"
                        className="umkm-account__text-button"
                        onClick={() => removeSession(session.id)}
                      >
                        Keluarkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="umkm-account__card">
        <div className="umkm-account__card-heading">
          <h2>Riwayat login</h2>
          <button
            type="button"
            className="umkm-account__button umkm-account__button--small"
            onClick={logoutOtherSessions}
          >
            Keluar semua sesi
          </button>
        </div>

        <div className="umkm-account__table-wrap">
          <table className="umkm-account__table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Perangkat</th>
                <th>Lokasi</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loginHistory.map((history) => (
                <tr key={history.id}>
                  <td>{history.time}</td>
                  <td>{history.device}</td>
                  <td>{history.location}</td>
                  <td>
                    <span
                      className={
                        history.status === 'Gagal'
                          ? 'umkm-account__login-status is-failed'
                          : 'umkm-account__login-status'
                      }
                    >
                      {history.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="umkm-account__danger-zone">
          <button
            type="button"
            className="umkm-account__button is-danger"
            onClick={deactivateAccount}
          >
            Nonaktifkan akun
          </button>
        </div>
      </section>
    </section>
  )
}

export default UmkmAccount