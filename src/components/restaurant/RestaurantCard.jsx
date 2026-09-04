import { Link, useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate()

  function handleFavorite() {
    navigate(`/login?next=/restaurants/${restaurant.id}`)
  }

  return (
    <article className="restaurant-card">
      <div className="restaurant-card__media">
        <Link to={`/restaurants/${restaurant.id}`} className="restaurant-card__image-wrap" aria-label={`Lihat ${restaurant.name}`}>
          <div className={`restaurant-card__image food-sprite food-sprite--${restaurant.imagePosition}`} />
        </Link>
        <span className={`status ${restaurant.isOpen ? 'status--open' : 'status--closed'}`}>{restaurant.isOpen ? 'Buka' : 'Tutup'}</span>
        <button className="favorite-button" onClick={handleFavorite} aria-label={`Simpan ${restaurant.name} ke favorit`}>
          <Icon name="heart" size={19} />
        </button>
      </div>
      <div className="restaurant-card__body">
        <div className="restaurant-card__heading">
          <Link to={`/restaurants/${restaurant.id}`}>{restaurant.name}</Link>
          <span><Icon name="star" size={15} filled /> {restaurant.rating}</span>
        </div>
        <p>{restaurant.category}</p>
        <div className="restaurant-card__meta">
          <span><Icon name="mapPin" size={14} /> {restaurant.distance}</span>
          <span>{restaurant.priceRange}</span>
        </div>
      </div>
    </article>
  )
}

export default RestaurantCard
