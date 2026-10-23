import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../auth/useAuth'
import { privateApi } from '../../services/managementService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../common/RemoteStatus'
import { Link, useLocation } from 'react-router-dom'
import Logo from '../common/Logo'
import SiteFooter from '../layout/SiteFooter'

const loadApplication = signal => privateApi('/umkm/application', { signal })

const navigation = [
  { label: 'Statistik', to: '/umkm', end: true },
  { label: 'Pengajuan', to: '/umkm/pengajuan' },
  { label: 'Profil Warung', to: '/umkm/profil-warung' },
  { label: 'Kelola Menu', to: '/umkm/menu' },
  { label: 'Jam Operasional', to: '/umkm/jam-operasional' },
  { label: 'Ulasan', to: '/umkm/ulasan' },
  { label: 'Foto', to: '/umkm/foto' },
  { label: 'Akun dan Pengaturan', to: '/umkm/akun' },
]

function UmkmLayout() {
  const navigate = useNavigate()
  const { logout, error } = useAuth()
  const location = useLocation()
  const application = useRemote(loadApplication)
  const reloadApplication = application.reload
  useEffect(() => { reloadApplication() }, [location.pathname, reloadApplication])
  const mayManage = application.data?.status === 'APPROVED' || ['/umkm/pengajuan', '/umkm/akun'].includes(location.pathname)

  return (
    <div className="umkm-page">
      <div className="umkm-workspace">
        <aside className="umkm-sidebar">
          <div className="umkm-sidebar__brand">
            <Logo />
          </div>

          <nav className="umkm-sidebar__nav" aria-label="Navigasi UMKM">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `umkm-sidebar__link${isActive ? ' is-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="umkm-sidebar__logout"
            onClick={async () => { try { await logout(); navigate('/explore') } catch { /* AuthProvider displays session errors. */ } }}
          >
            Keluar
          </button>
        </aside>

        <main className="umkm-main">
          <RemoteStatus remote={application} />{error && <p role="alert">{error}</p>}
          {mayManage ? <Outlet /> : application.data && <p>Status pengajuan: {application.data.status}. <Link to="/umkm/pengajuan">Lihat atau lengkapi pengajuan</Link></p>}
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}

export default UmkmLayout
