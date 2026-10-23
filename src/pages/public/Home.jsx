import { Link } from 'react-router-dom'
import Icon from '../../components/common/Icon'
import { getFeaturedRestaurants } from '../../services/restaurantService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
const loadFeatured = signal => getFeaturedRestaurants({ signal })

const categories = [
  {
    icon: '☕',
    title: 'Sarapan',
    description: 'Awali hari dengan pilihan sarapan yang praktis dan mengenyangkan.',
    query: 'sarapan',
  },
  {
    icon: '🍜',
    title: 'Makanan Utama',
    description: 'Cari makanan berat favorit buat makan siang sampai malam.',
    query: 'makanan',
  },
  {
    icon: '🥤',
    title: 'Minuman',
    description: 'Pilihan minuman segar buat nemenin aktivitas di kampus.',
    query: 'minuman',
  },
  {
    icon: '🍰',
    title: 'Dessert',
    description: 'Yang manis-manis buat nutup hari atau sekadar ngemil.',
    query: 'dessert',
  },
]

const testimonials = [
  {
    quote: '“Makanannya enak dan harganya masih aman buat anak kos.”',
    text: 'Informasi harga sama lokasinya ngebantu banget pas lagi bingung mau makan di mana.',
    name: 'Sophie Robson',
    place: 'Sukabirus, Bojongsoang',
    initials: 'SR',
  },
  {
    quote: '“Tempatnya bersih dan pilihannya banyak.”',
    text: 'Jadi lebih gampang cari warung yang sesuai budget tanpa harus muter-muter dulu.',
    name: 'Matt Cannon',
    place: 'Ciganitri, Bojongsoang',
    initials: 'MC',
  },
  {
    quote: '“Menu dan fasilitas warungnya lengkap.”',
    text: 'Bisa cek rating, jarak, sampai metode pembayaran sebelum datang ke warungnya.',
    name: 'Andy Smith',
    place: 'Sukapura, Bojongsoang',
    initials: 'AS',
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

      <section className="home-featured" id="rekomendasi"><RemoteStatus remote={remote} />
        <div className="home-featured__grid">
          {featuredMenus.map((item) => (
            <article className="home-menu-card" key={item.id}>
              <div className="home-menu-card__media">
                <Link to={`/restaurants/${item.slug}`} aria-label={`Lihat ${item.name}`}>
                  {item.photoUrl ? <img className="home-menu-card__image" src={item.photoUrl} alt={item.name} /> : <div className="home-menu-card__image">Foto belum tersedia</div>}
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
                  <h2>{item.name}</h2>
                  <p>{item.category}</p>
                </div>
                <strong>{item.priceRange}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-categories" id="menu">
        <h2>Browse Our Menu</h2>

        <div className="home-categories__grid">
          {categories.map((category) => (
            <article className="home-category-card" key={category.title}>
              <span className="home-category-card__icon" aria-hidden="true">{category.icon}</span>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <Link to={`/explore?q=${category.query}`}>Jelajahi Menu</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-testimonials" id="tentang">
        <h2>Contoh pengalaman penggunaan</h2><p>Ilustrasi konten desain, bukan testimoni pengguna terverifikasi.</p>

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
