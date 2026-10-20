import { NavLink, Link } from 'react-router-dom'
import { useState } from 'react'
import Logo from '../common/Logo'
import Icon from '../common/Icon'
import { useAuth } from '../../auth/useAuth.js'

const navItems = [
  { to: '/', label: 'Beranda' },
  { to: '/explore', label: 'Jelajahi' },
  { to: '/#rekomendasi', label: 'Rekomendasi' },
  { to: '/#tentang', label: 'Tentang' },
]

function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, loading } = useAuth()
  const actions = loading ? <span className="session-status" role="status">Memuat sesi…</span> : user ? (
    <>
      {user.role === 'CUSTOMER' && <Link to="/favorites" className="button button--outline" onClick={() => setOpen(false)}>Favorit</Link>}
      <Link to="/account" className="button button--dark" onClick={() => setOpen(false)} title={user.fullName}>Akun saya</Link>
    </>
  ) : (
    <>
      <Link to="/register" className="button button--outline" onClick={() => setOpen(false)}>Daftar</Link>
      <Link to="/login" className="button button--dark" onClick={() => setOpen(false)}>Masuk</Link>
    </>
  )

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Logo />
        <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-label="Buka navigasi" aria-expanded={open}>
          <Icon name="menu" size={25} />
        </button>
        <nav className={`navbar__nav ${open ? 'is-open' : ''}`}>
          {navItems.map((item) => item.to.includes('#') ? (
            <a key={item.to} href={item.to} onClick={() => setOpen(false)}>{item.label}</a>
          ) : (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setOpen(false)}>{item.label}</NavLink>
          ))}
          <div className="navbar__mobile-actions">
            {actions}
          </div>
        </nav>
        <div className="navbar__actions">
          {actions}
        </div>
      </div>
    </header>
  )
}

export default Navbar
