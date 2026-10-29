import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import { getFeaturedRestaurants } from '../../services/restaurantService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
import FoodArtwork from '../../components/restaurant/FoodArtwork'
import ListingNotice from '../../components/restaurant/ListingNotice'
const loadFeatured = signal => getFeaturedRestaurants({ signal })

const categories = [
  {
    icon: '☕',
    title: 'Sarapan',
    description: 'Awali hari dengan pilihan sarapan yang praktis dan mengenyangkan.',
    category: 'Nasi',
  },
  {
    icon: '🍜',
    title: 'Makanan Utama',
    description: 'Cari makanan berat favorit buat makan siang sampai malam.',
    category: 'Ayam',
  },
  {
    icon: '🥤',
    title: 'Minuman',
    description: 'Pilihan minuman segar buat nemenin aktivitas di kampus.',
    category: 'Minuman',
  },
  {
    icon: '🍰',
    title: 'Camilan',
    description: 'Temukan teman ngemil untuk jeda di antara aktivitasmu.',
    category: 'Camilan',
  },
]

const testimonials = [
  {
    quote: 'Cari sesuai selera dan anggaran.',
    text: 'Bandingkan menu, simpan favorit, dan bagikan ulasan melalui akunmu.',
    name: 'Untuk mahasiswa',
    place: 'Temukan • Simpan • Ulas',
    initials: '01',
  },
  {
    quote: 'Warungmu, informasi yang terkelola.',
    text: 'Kelola menu, jam operasional, fasilitas, dan balas ulasan setelah pengajuan disetujui.',
    name: 'Untuk pemilik warung',
    place: 'Ajukan • Kelola • Tanggapi',
    initials: '02',
  },
  {
    quote: 'Informasi yang bisa ditinjau bersama.',
    text: 'Tinjau pengajuan usaha, tangani laporan, dan moderasi ulasan melalui dashboard admin.',
    name: 'Untuk pengelola',
    place: 'Tinjau • Moderasi • Pantau',
    initials: '03',
  },
]

function Home() {
  const remote = useRemote(loadFeatured, [])
  const featuredMenus = remote.data

  return (
    <>
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero__content">
          <span className="home-hero__heart home-hero__heart--one">
            <Icon name="heart" size={23} filled />
          </span>
          <span className="home-hero__heart home-hero__heart--two">
            <Icon name="heart" size={20} filled />
          </span>
          <span className="home-hero__heart home-hero__heart--three">
            <Icon name="heart" size={21} filled />
          </span>

          <h1 id="home-hero-title">Kuliner enak buat<br />hari yang lebih nikmat.</h1>
          <p>Temukan menu dan warung favoritmu di sekitar Telkom University.</p>

          <Link to="/explore" className="home-hero__button">
            Jelajahi Menu
          </Link>
        </div>
      </section>

      <section className="home-featured" id="rekomendasi"><div className="section-intro"><span className="section-eyebrow">DEKAT KAMPUS, DEKAT SELERA</span><h2>Mulai dari pilihan ini.</h2><p>Jelajahi referensi kuliner lokal dan coba pengalaman lengkap di katalog simulasi.</p><Link to="/explore">Lihat semua warung →</Link></div><RemoteStatus remote={remote} />
        <div className="home-featured__grid">
          {featuredMenus.map((item) => (
            <article className="home-menu-card" key={item.id}>
              <div className="home-menu-card__media">
                <Link to={`/restaurants/${item.slug}`} aria-label={`Lihat ${item.name}`}>
                  {item.photoUrl ? <img className="home-menu-card__image" src={item.photoUrl} alt={item.name} loading="lazy" /> : <FoodArtwork category={item.category} />}
                </Link>

                <Link
                  to="/account?tab=activity&filter=favorite"
                  className="home-menu-card__favorite"
                  aria-label={`Simpan ${item.name} ke favorit`}
                >
                  <Icon name="heart" size={18} />
                </Link>
              </div>

              <div className="home-menu-card__body">
                <div>
                  <ListingNotice restaurant={item} compact /><h2>{item.name}</h2>
                  <p>{item.category}</p>
                </div>
                <strong>{item.priceRange}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-categories" id="menu">
        <h2>Ada selera untuk setiap jeda.</h2>

        <div className="home-categories__grid">
          {categories.map((category) => (
            <article className="home-category-card" key={category.title}>
              <span className="home-category-card__icon" aria-hidden="true">{category.icon}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <Link to={`/explore?category=${encodeURIComponent(category.category)}`}>Jelajahi Menu</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-testimonials" id="tentang">
        <h2>Satu tempat, banyak kemudahan.</h2><p>Dari mencari makan sampai mengelola warung di sekitar kampus.</p>

        <div className="home-testimonials__grid">
          {testimonials.map((testimonial) => (
            <article className="home-testimonial-card" key={testimonial.name}>
              <h3>{testimonial.quote}</h3>
              <p>{testimonial.text}</p>

              <div className="home-testimonial-card__person">
                <span>{testimonial.initials}</span>
                <div>
                  <strong>{testimonial.name}</strong>
                  <small>{testimonial.place}</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default Home
