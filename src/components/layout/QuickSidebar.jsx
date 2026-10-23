import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import Icon from '../common/Icon'

const baseItems = [
  { to: '/', icon: 'home', label: 'Beranda' },
  { to: '/explore', icon: 'compass', label: 'Jelajahi' },
  { to: '/login?next=/favorites', icon: 'heart', label: 'Favorit' },
  { to: '/register?role=umkm', icon: 'store', label: 'Daftar UMKM' },
  { to: '/login', icon: 'user', label: 'Akun' },
]

function QuickSidebar({ variant = 'fixed',  onNavigate }) {
  const { user } = useAuth()
  const items = baseItems.map(item => item.label === 'Akun' ? { ...item, to: user ? '/account' : '/login' } : item.label === 'Favorit' ? { ...item, to: '/account?tab=activity&filter=favorite' } : item)
  if (user?.role === 'UMKM') items.push({ to: '/umkm', icon: 'store', label: 'Dashboard UMKM' })
  if (user?.role === 'ADMIN') items.push({ to: '/admin', icon: 'user', label: 'Dashboard Admin' })
  const isDrawer = variant === 'drawer'

  return (
    <aside
      className={`quick-nav ${isDrawer ? 'quick-nav--drawer' : ''}`}
      aria-label="Navigasi cepat"
    >
      {!isDrawer && <div className="quick-nav__line" />}

      {items.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          title={item.label}
          aria-label={item.label}
          onClick={onNavigate}
        >
          <Icon name={item.icon} size={21} filled={item.icon === 'heart'} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  )
}

export default QuickSidebar
