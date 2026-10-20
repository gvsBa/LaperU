import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import restaurants from '../../mocks/restaurants'
import menuItems from '../../mocks/menuItems'
import profileAvatar from '../../assets/images/profile-avatar.webp'
import SiteFooter from '../../components/layout/SiteFooter'

const detailExtras = {
  1: { address: 'Jl. Telekomunikasi No. 1, Sukapura', hours: '09.00–22.00', reviewCount: 120 },
  2: { address: 'Jl. Telekomunikasi No. 8, Sukapura', hours: '10.00–22.00', reviewCount: 86 },
  3: { address: 'Jl. Sukabirus No. 19, Dayeuhkolot', hours: '09.00–21.00', reviewCount: 74 },
  4: { address: 'Jl. Telekomunikasi No. 15, Sukapura', hours: '10.00–21.00', reviewCount: 98 },
  5: { address: 'Jl. Sukapura No. 5, Dayeuhkolot', hours: '08.00–22.00', reviewCount: 66 },
  6: { address: 'Jl. Cikoneng No. 4, Sukapura', hours: '10.00–21.00', reviewCount: 52 },
  7: { address: 'Jl. Sukabirus No. 10, Dayeuhkolot', hours: '10.00–23.00', reviewCount: 91 },
  8: { address: 'Jl. Telekomunikasi No. 22, Sukapura', hours: '10.00–22.00', reviewCount: 78 },
}

const reviews = [
  {
    id: 1,
    name: 'Nadia Putri',
    date: '10 Mei 2024',
    rating: 5,
    text: 'Tempatnya nyaman buat makan bareng teman. Pelayanannya ramah, makanannya enak, dan harganya masih aman buat anak kampus.',
  },
  {
    id: 2,
    name: 'Rizky Maulana',
    date: '28 April 2024',
    rating: 5,
    text: 'Menu favorit saya di sini. Porsinya pas, cepat disajikan, dan pilihan pembayarannya juga lengkap pakai QRIS.',
  },
  {
    id: 3,
    name: 'Aulia N.',
    date: '14 April 2024',
    rating: 4,
    text: 'Lokasinya gampang dicari dan ada tempat makan di lokasi. Cocok kalau lagi cari makan siang dekat kampus.',
  },
]

const galleryPositions = ['one', 'two', 'three', 'four']

function formatFacility(item) {
  if (item === 'WiFi') return 'Wi-Fi'
  return item
}

function RestaurantDetail() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const restaurant = restaurants.find((item) => item.id === restaurantId)

  const [menuOpen, setMenuOpen] = useState(false)
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)

  if (!restaurant) {
    return (
      <main className="detail-not-found">
        <h1>Warung tidak ditemukan.</h1>
        <p>Data warung yang kamu cari belum tersedia.</p>
        <Link to="/explore">Kembali ke Explore</Link>
      </main>
    )
  }

  const extra = detailExtras[restaurant.id]
  const restaurantMenu = menuItems.filter((item) => item.restaurantId === restaurant.id)
  const highlights = [
    ...restaurant.facilities,
    ...restaurant.paymentMethods.filter((item) => !restaurant.facilities.includes(item)),
  ]

  function openGoogleMaps() {
    const destination = `${restaurant.name}, ${extra.address}, Bandung`

    function openMap(origin) {
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${encodeURIComponent(destination)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`

      window.open(url, '_blank')
      setRouteDialogOpen(false)
    }

    if (!navigator.geolocation) {
      openMap()
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => openMap(coords),
      () => openMap(),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="restaurant-detail-page">
      <header className="detail-header">
        <div className="detail-header__inner">
          <Link to="/explore" className="detail-back">
            <span aria-hidden="true">←</span>
            Detail warung
          </Link>
        </div>
      </header>

      <main className="detail-main">
        <section className="detail-hero" aria-label={`Galeri ${restaurant.name}`}>
          <div className="detail-hero__title">
            <span>Warung pilihan sekitar Telkom University</span>
            <strong>{restaurant.name}</strong>
          </div>

          <div className="detail-hero__photos">
            {galleryPositions.map((position) => (
              <div
                key={position}
                className={`detail-hero__photo food-sprite food-sprite--${position}`}
              />
            ))}
          </div>
        </section>

        <section className="detail-summary">
          <div>
            <p className="detail-summary__category">{restaurant.category}</p>
            <h1>{restaurant.name}</h1>

            <p className="detail-summary__meta">
              {extra.address} · {highlights.map(formatFacility).join(' · ')}
            </p>

            <div className="detail-rating">
              <span aria-label={`Rating ${restaurant.rating} dari 5`}>★★★★★</span>
              <strong>{restaurant.rating}</strong>
              <small>({extra.reviewCount} ulasan)</small>
            </div>
          </div>

          <span className={restaurant.isOpen ? 'detail-status is-open' : 'detail-status is-closed'}>
            {restaurant.isOpen ? `Buka ${extra.hours}` : 'Sedang tutup'}
          </span>
        </section>

        <section className="detail-reviews" aria-labelledby="review-title">
          <div className="detail-section-heading">
            <div>
              <span>Pengalaman pengunjung</span>
              <h2 id="review-title">Ulasan</h2>
            </div>
            <strong>{extra.reviewCount} ulasan</strong>
          </div>

          <div className="detail-review-list">
            {reviews.map((review, reviewIndex) => (
              <article className="detail-review-card" key={review.id}>
                <div className="detail-review-card__profile">
                  <img src={profileAvatar} alt="" />
                </div>

                <div className="detail-review-card__content">
                  <div className="detail-review-card__top">
                    <div>
                      <h3>{review.name}</h3>
                      <div className="detail-review-card__rating">
                        <span>{'★'.repeat(review.rating)}</span>
                        <time>{review.date}</time>
                      </div>
                    </div>
                  </div>

                  <p>{review.text}</p>
                </div>

                <div className="detail-review-card__gallery">
                  {galleryPositions.map((position, imageIndex) => (
                    <div
                      key={position}
                      className={`detail-review-card__image food-sprite food-sprite--${galleryPositions[(imageIndex + reviewIndex) % galleryPositions.length]}`}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="detail-actions">
          <button type="button" onClick={() => setRouteDialogOpen(true)}>
            Rute Peta
          </button>

          <button
            type="button"
            className={menuOpen ? 'is-active' : ''}
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
          >
            {menuOpen ? 'Tutup Menu' : 'Tampilkan Menu'}
          </button>
        </div>

        {menuOpen && (
          <section className="detail-menu" aria-labelledby="menu-title">
            <div className="detail-section-heading">
              <div>
                <span>Menu yang tersedia</span>
                <h2 id="menu-title">Menu {restaurant.name}</h2>
              </div>
            </div>

            <div className="detail-menu__grid">
              {restaurantMenu.map((item) => (
                <article className="detail-menu__item" key={item.id}>
                  <div className={`detail-menu__image menu-sprite menu-sprite--${item.sprite} menu-sprite--${item.position}`} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.category}</p>
                    <strong>Rp{item.price.toLocaleString('id-ID')}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {routeDialogOpen && (
        <div
          className="detail-route-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRouteDialogOpen(false)
          }}
        >
          <section className="detail-route-modal__content" role="dialog" aria-modal="true" aria-labelledby="route-title">
            <h2 id="route-title">Rute ke {restaurant.name}</h2>
            <p>Membutuhkan izin lokasi untuk membuka rute di Google Maps.</p>

            <div className="detail-route-modal__notice">
              Ingin membuka Maps?
            </div>

            <div className="detail-route-modal__actions">
              <button type="button" onClick={openGoogleMaps}>Buka</button>
              <button type="button" onClick={() => setRouteDialogOpen(false)}>Batal</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default RestaurantDetail