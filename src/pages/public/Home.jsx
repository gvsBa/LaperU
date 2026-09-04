import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import { getFeaturedRestaurants } from '../../services/restaurantService'

function Home() {
  const [query, setQuery] = useState('')
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getFeaturedRestaurants()
      .then(setRestaurants)
      .catch(() => setError('Rekomendasi warung belum dapat dimuat.'))
      .finally(() => setLoading(false))
  }, [])

  function handleSearch(event) {
    event.preventDefault()
    const keyword = query.trim()
    navigate(keyword ? `/explore?q=${encodeURIComponent(keyword)}` : '/explore')
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__overlay" />
        <div className="hero__content">
          <span className="hero__eyebrow">Kuliner sekitar Telkom University</span>
          <h1 id="hero-title">Makan enak,<br />nggak pakai bingung.</h1>
          <p>Temukan warung favorit sesuai selera, jarak, harga, dan fasilitas yang kamu butuhkan.</p>
          <form className="search-box" onSubmit={handleSearch} role="search">
            <Icon name="search" size={20} />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari warung atau menu..." aria-label="Cari warung atau menu" />
            <button type="submit">Cari</button>
          </form>
          <div className="hero__actions">
            <Link to="/explore" className="button button--primary">Jelajahi Warung</Link>
            <a href="#rekomendasi" className="button button--glass">Lihat Rekomendasi</a>
          </div>
        </div>
      </section>

      <section className="recommendations" id="rekomendasi">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">Pilihan di dekatmu</span>
            <h2>Rekomendasi Warung</h2>
          </div>
          <Link to="/explore">Lihat semua <Icon name="arrow" size={17} /></Link>
        </div>

        {loading && (
          <div className="restaurant-grid" aria-label="Memuat rekomendasi">
            {[1, 2, 3, 4].map((item) => <div className="restaurant-skeleton" key={item} />)}
          </div>
        )}
        {error && <p className="state-message">{error}</p>}
        {!loading && !error && (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} />)}
          </div>
        )}
      </section>

      <section className="about-strip" id="tentang">
        <div>
          <span className="section-heading__eyebrow">Kenapa LaperU?</span>
          <h2>Satu tempat buat cari kuliner sekitar kampus.</h2>
        </div>
        <p>LaperU membantu mahasiswa menemukan tempat makan berdasarkan menu, harga, jarak, rating, fasilitas, dan status buka. Informasi warung dikelola langsung oleh UMKM agar tetap relevan.</p>
        <Link to="/register?role=umkm" className="button button--dark">Daftarkan Warung</Link>
      </section>
    </>
  )
}

export default Home
