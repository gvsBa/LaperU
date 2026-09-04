import { NavLink } from 'react-router-dom'
import Icon from '../common/Icon'

const items = [
  { to: '/', icon: 'home', label: 'Beranda' },
  { to: '/explore', icon: 'compass', label: 'Jelajahi' },
  { to: '/login?next=/favorites', icon: 'heart', label: 'Favorit' },
  { to: '/register?role=umkm', icon: 'store', label: 'Daftar UMKM' },
  { to: '/login', icon: 'user', label: 'Akun' },
]

function QuickSidebar() {
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
