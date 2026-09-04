import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import Icon from '../common/Icon'
import profileAvatar from '../../assets/images/profile-avatar.webp'

function ExploreHeader({ query, onQueryChange, onSearch, isAuthenticated }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="explore-header">
      <button className="explore-header__menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu" aria-expanded={menuOpen}>
        <Icon name="menu" size={22} />
      </button>
      <Logo />

      <form className="explore-search" onSubmit={onSearch} role="search">
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cari makanan atau warung" aria-label="Cari makanan atau warung" />
        <button type="submit" aria-label="Cari"><Icon name="search" size={18} /></button>
      </form>

      <button className="location-picker" type="button">
        <span><Icon name="mapPin" size={17} filled /></span>
        <strong>Telkom University</strong>
        <small>⌄</small>
      </button>

      <div className="explore-header__user">
        {isAuthenticated ? (
          <>
            <button className="notification-button" aria-label="Notifikasi"><Icon name="bell" size={20} /></button>
            <button type="button" className="profile-avatar" aria-label="Profil saya">
              <img src={profileAvatar} alt="Foto profil pengguna" />
            </button>
          </>
        ) : (
          <Link to="/login?next=/explore" className="explore-login">Masuk</Link>
        )}
      </div>

      {menuOpen && (
        <nav className="explore-drawer">
          <Link to="/">Beranda</Link>
          <Link to="/explore">Jelajahi</Link>
          <Link to={isAuthenticated ? '/explore?mode=account' : '/login'}>{isAuthenticated ? 'Profil' : 'Masuk'}</Link>
        </nav>
      )}
    </header>
  )
}

export default ExploreHeader
