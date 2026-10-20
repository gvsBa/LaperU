import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import Icon from '../common/Icon'
import { useAuth } from '../../auth/useAuth.js'

function ExploreHeader({ query, onQueryChange, onSearch, isSidebarOpen, onMenuToggle }) {
  const { user, loading } = useAuth()

  return (
    <header className="explore-header">
      <button className="explore-header__menu" type="button" onClick={onMenuToggle} aria-label={isSidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={isSidebarOpen}>
        <Icon name="menu" size={22} />
      </button>
      <Logo />

      <form className="explore-search" onSubmit={onSearch} role="search">
        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Cari makanan atau warung" aria-label="Cari makanan atau warung" />
        <button type="submit" aria-label="Cari"><Icon name="search" size={18} /></button>
      </form>

      <div className="location-picker" aria-label="Area jelajah Telkom University">
        <span><Icon name="mapPin" size={17} filled /></span>
        <strong>Telkom University</strong>
      </div>

      <div className="explore-header__user">
        {loading ? <span className="session-status" role="status">Memuat sesi…</span> : user ? (
          <Link to="/account" className="explore-login" title={user.fullName} aria-label={`Akun ${user.fullName}`}><Icon name="user" size={20} /><span>Akun saya</span></Link>
        ) : (
          <Link to="/login?next=/explore" className="explore-login">Masuk</Link>
        )}
      </div>

    </header>
  )
}

export default ExploreHeader
