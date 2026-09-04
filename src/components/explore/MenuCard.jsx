import { Link } from 'react-router-dom'
import Icon from '../common/Icon'

function MenuCard({ item }) {
  return (
    <article className="menu-card">
      <Link to={`/restaurants/${item.restaurantId}`} className="menu-card__image-link" aria-label={`Lihat ${item.name}`}>
        <div className={`menu-card__image menu-sprite menu-sprite--${item.sprite} menu-sprite--${item.position}`} />
        <span className="menu-card__rating"><Icon name="star" size={11} filled /> {item.rating}</span>
      </Link>
      <div className="menu-card__body">
        <h3>{item.name}</h3>
        <p>{item.restaurant}</p>
        <div className="menu-card__details">
          <span>◷ {item.eta} menit</span>
          <span className="menu-card__score" aria-label={`Rating ${item.rating} dari 5`}>
            {[1, 2, 3, 4, 5].map((star) => <Icon key={star} name="star" size={11} filled={star <= Math.round(item.rating)} />)}
          </span>
        </div>
        <strong>Rp{item.price.toLocaleString('id-ID')}</strong>
      </div>
    </article>
  )
}

export default MenuCard
