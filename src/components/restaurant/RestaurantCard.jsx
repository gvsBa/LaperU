import { Link } from 'react-router-dom'
import Icon from '../common/Icon'

export default function RestaurantCard({ restaurant }) {
  return <article className="restaurant-card">
    <div className="restaurant-card__media">
      <Link to={`/restaurants/${restaurant.slug}`} className="restaurant-card__image-wrap" aria-label={`Lihat ${restaurant.name}`}>
        <div className="restaurant-placeholder"><Icon name="store" size={36} /><span>Foto belum tersedia</span></div>
      </Link>
      {restaurant.isOpen !== null && <span className={`status ${restaurant.isOpen ? 'status--open' : 'status--closed'}`}>{restaurant.isOpen ? 'Buka' : 'Tutup'}</span>}
    </div>
    <div className="restaurant-card__body"><div className="restaurant-card__heading">
      <Link to={`/restaurants/${restaurant.slug}`}>{restaurant.name}</Link>
      <span><Icon name="star" size={15} filled /> {restaurant.rating ? restaurant.rating.toFixed(1) : '—'}</span>
    </div><p>{restaurant.category}</p><div className="restaurant-card__meta"><span>{restaurant.distance}</span><span>{restaurant.priceRange}</span></div></div>
  </article>
}
