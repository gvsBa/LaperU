import { Link } from 'react-router-dom'
import logo from '../../assets/images/laperu-logo.svg'

const footerGroups = [
  {
    title: 'Jelajahi',
    links: [
      { label: 'Beranda', to: '/' },
      { label: 'Jelajahi warung', to: '/explore' },
      { label: 'Favorit', to: '/login?next=/favorites' },
    ],
  },
  {
    title: 'UMKM',
    links: [
      { label: 'Daftar warung', to: '/register?role=umkm' },
      { label: 'Panduan verifikasi', to: '/register?role=umkm' },
      { label: 'Dashboard UMKM', to: '/umkm' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { label: 'FAQ', to: '/#tentang' },
      { label: 'Hubungi kami', to: '/#tentang' },
      { label: 'Laporkan masalah', to: '/#tentang' },
    ],
  },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" aria-label="LaperU - Beranda">
            <img src={logo} alt="LaperU" className="site-footer__logo" />
          </Link>
          <p>Aplikasi informasi kuliner di sekitar Telkom University.</p>
        </div>

        {footerGroups.map((group) => (
          <nav className="site-footer__group" key={group.title} aria-label={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={link.label} to={link.to}>{link.label}</Link>
            ))}
          </nav>
        ))}
      </div>

      <div className="site-footer__bottom" aria-hidden="true" />
    </footer>
  )
}

export default SiteFooter