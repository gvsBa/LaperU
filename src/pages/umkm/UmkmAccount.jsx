import { useAuth } from '../../auth/useAuth'
import { privateApi } from '../../services/managementService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
import profileAvatar from '../../assets/images/profile-avatar.webp'
import AccountSecurity from '../../components/account/AccountSecurity'
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
    <AccountSecurity />
  </section>
}
