import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from '../common/Logo'
import SiteFooter from '../layout/SiteFooter'

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
            onClick={() => navigate('/explore')}
          >
            Keluar
          </button>
        </aside>

        <main className="umkm-main">
          <Outlet />
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}

export default UmkmLayout