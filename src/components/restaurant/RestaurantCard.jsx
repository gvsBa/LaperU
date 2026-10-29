import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { addFavorite } from '../../services/restaurantService'
import Icon from '../common/Icon'
import ListingNotice from './ListingNotice'

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const detailUrl = `/restaurants/${restaurant.slug}`
  async function handleFavorite() {
    if (!user) { navigate(`/login?next=${encodeURIComponent(detailUrl)}`); return }
    if (user.role !== 'CUSTOMER') { setMessage('Favorit hanya untuk Customer.'); return }
    if (busy) return
    setBusy(true)
    try { await addFavorite(restaurant.id); setMessage('Tersimpan di favorit.') }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  return (
    <article className="restaurant-card">
      <div className="restaurant-card__media">
        <Link
          to={detailUrl}
          className="restaurant-card__image-wrap"
          aria-label={`Lihat ${restaurant.name}`}
        >
          {restaurant.photoUrl ? <img className="restaurant-card__image" src={restaurant.photoUrl} alt={restaurant.name} loading="lazy" /> : <div className="restaurant-card__image"><span>Foto belum tersedia</span></div>}
        </Link>

        <span
          className={`status ${
            restaurant.isOpen ? 'status--open' : 'status--closed'
          }`}
        >
          {restaurant.isOpen == null ? 'Jam belum dikonfirmasi' : restaurant.isOpen ? 'Buka' : 'Tutup'}
        </span>

        <button
          className="favorite-button" disabled={busy}
          onClick={handleFavorite}
          aria-label={`Simpan ${restaurant.name} ke favorit`}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>

      <div className="restaurant-card__body">{message && <p role="status">{message}</p>}
        <ListingNotice restaurant={restaurant} compact />
        <div className="restaurant-card__heading">
          <Link to={detailUrl}>{restaurant.name}</Link>
          <span>
            <Icon name="star" size={15} filled /> {restaurant.rating}
          </span>
        </div>

        <p>{restaurant.category}</p>

        <div className="restaurant-card__meta">
          <span>
            <Icon name="mapPin" size={14} /> {restaurant.distance}
          </span>
          <span>{restaurant.priceRange}</span>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
