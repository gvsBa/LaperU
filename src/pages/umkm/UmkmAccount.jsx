import { useAuth } from '../../auth/useAuth'
import { privateApi } from '../../services/managementService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
import profileAvatar from '../../assets/images/profile-avatar.webp'
const loadApplication = signal => privateApi('/umkm/application', { signal })

export default function UmkmAccount() {
  const { user } = useAuth()
  const remote = useRemote(loadApplication)
  return <section className="umkm-account">
    <div className="umkm-account__profile"><img src={profileAvatar} alt="" /><div><strong>{user.fullName}</strong><span>{user.email}</span></div></div>
    <RemoteStatus remote={remote} />
    <section className="umkm-account__card"><h2>Data profil</h2><p>Data akun dari server. Identitas usaha dapat diperbarui melalui Pengajuan atau Profil Warung. Perubahan identitas akun belum tersedia.</p>
      <div className="umkm-account__grid">
        {[['Nama lengkap', user.fullName], ['Email', user.email], ['No. telepon', remote.data?.phone], ['Nama usaha', remote.data?.businessName]].map(([label, value]) => <label key={label}>{label}<input readOnly value={value || ''} /></label>)}
      </div>
    </section>
    <section className="umkm-account__card"><h2>Ubah kata sandi</h2><p>Belum tersedia pada Backend. Tidak ada perubahan password yang dijalankan di sini.</p><fieldset disabled className="umkm-account__grid umkm-account__grid--password">
      {['Kata sandi lama', 'Kata sandi baru', 'Konfirmasi kata sandi'].map(label => <label key={label}>{label}<input type="password" /></label>)}
      <button className="umkm-account__button">Perbarui Sandi</button>
    </fieldset></section>
    <section className="umkm-account__card"><h2>Verifikasi dua langkah</h2><p>Belum tersedia. Akun tidak diklaim terlindungi 2FA.</p><fieldset disabled><label className="umkm-account__checkbox"><input type="checkbox" />Aktifkan verifikasi dua langkah</label><button className="umkm-account__button">Simpan</button></fieldset></section>
    {['Sesi login', 'Riwayat login'].map(title => <section key={title} className="umkm-account__card"><h2>{title}</h2><p>Daftar perangkat dan riwayat login belum tersedia. Gunakan Keluar di sidebar untuk mengakhiri sesi saat ini.</p></section>)}
  </section>
}
