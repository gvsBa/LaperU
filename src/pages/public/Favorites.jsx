import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getFavorites } from '../../services/restaurantService'
import RestaurantCard from '../../components/restaurant/RestaurantCard'

export default function Favorites() {
  const { user, loading: sessionLoading } = useAuth()
  const [result, setResult] = useState({ owner: null, items: [], error: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (user?.role !== 'CUSTOMER') return
    const controller = new AbortController()
    getFavorites({ signal: controller.signal }).then((items) => { if (!controller.signal.aborted) setResult({ owner: user.id, items, error: '' }) })
      .catch((error) => { if (!controller.signal.aborted) setResult({ owner: user.id, items: [], error: error.message }) })
    return () => controller.abort()
  }, [user?.id, user?.role, retry])
  if (sessionLoading) return <main className="detail-page"><p role="status">Memeriksa sesi…</p></main>
  if (!user) return <main className="detail-page"><h1>Warung favorit</h1><p>Masuk untuk melihat daftar favoritmu.</p><Link className="button button--dark" to="/login?next=/favorites">Masuk</Link></main>
  if (user.role !== 'CUSTOMER') return <main className="detail-page"><h1>Warung favorit</h1><p>Fitur ini tersedia untuk akun Customer.</p><Link to="/account">Lihat akun</Link></main>
  return <main className="detail-page"><h1>Warung favoritmu</h1>
    {result.owner !== user.id ? <p role="status">Memuat favorit…</p> : result.error ? <p role="alert">{result.error} <button onClick={() => setRetry((n) => n + 1)}>Coba lagi</button></p> : result.items.length ? <div className="restaurant-grid">{result.items.map((item) => <RestaurantCard key={item.id} restaurant={item} />)}</div> : <p>Belum ada warung favorit. <Link to="/explore">Jelajahi warung</Link> untuk mulai menyimpan.</p>}
  </main>
}
