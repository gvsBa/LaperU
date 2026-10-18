import { NavLink } from 'react-router-dom'
import Icon from '../common/Icon'
import { useAuth } from '../../auth/useAuth.js'

function QuickSidebar() {
  const { user, loading } = useAuth()
  const items = [
    { to: '/', icon: 'home', label: 'Beranda' },
    { to: '/explore', icon: 'compass', label: 'Jelajahi' },
    ...(!user || user.role === 'CUSTOMER' ? [{ to: '/favorites', icon: 'heart', label: 'Favorit' }] : []),
    ...(!user && !loading ? [{ to: '/register?role=umkm', icon: 'store', label: 'Daftar UMKM' }] : []),
    { to: '/account', icon: 'user', label: user ? 'Akun saya' : 'Akun' },
  ]
  return (
    <aside className="quick-nav" aria-label="Navigasi cepat">
      <div className="quick-nav__line" />
      {items.map((item) => (
        <NavLink key={item.label} to={item.to} end={item.to === '/'} title={item.label} aria-label={item.label}>
          <Icon name={item.icon} size={21} filled={item.icon === 'heart'} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  )
}

export default QuickSidebar
