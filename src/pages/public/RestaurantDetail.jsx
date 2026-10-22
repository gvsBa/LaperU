import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
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

const starterReviews = [
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

const reviewFields = [
  { key: 'taste', label: 'Rasa' },
  { key: 'price', label: 'Harga' },
  { key: 'portion', label: 'Porsi' },
  { key: 'place', label: 'Tempat' },
  { key: 'comfort', label: 'Kenyamanan' },
  { key: 'service', label: 'Service' },
]

const galleryPositions = ['one', 'two', 'three', 'four']

function emptyScores() {
  return {
    taste: 0,
    price: 0,
    portion: 0,
    place: 0,
    comfort: 0,
    service: 0,
  }
}

function formatFacility(item) {
  if (item === 'WiFi') return 'Wi-Fi'
  return item
}

function RestaurantDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const restaurantId = Number(id)
  const restaurant = restaurants.find((item) => item.id === restaurantId)

  const [menuOpen, setMenuOpen] = useState(false)
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)
  const [guestDialogOpen, setGuestDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState('create')
  const [reviewScores, setReviewScores] = useState(emptyScores)
  const [reviewText, setReviewText] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [myReview, setMyReview] = useState(null)
  const [reportText, setReportText] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)

  const isAuthenticated = searchParams.get('mode') === 'account'

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
  const restaurantMenu = menuItems.filter(
    (item) => item.restaurantId === restaurant.id,
  )

  const highlights = [
    ...restaurant.facilities,
    ...restaurant.paymentMethods.filter(
      (item) => !restaurant.facilities.includes(item),
    ),
  ]

  const detailUrl = `/restaurants/${restaurant.id}?mode=account`
  const reviewCount = extra.reviewCount + (myReview ? 1 : 0)
  const displayedReviews = myReview ? [myReview, ...starterReviews] : starterReviews

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

  function openReviewDialog(mode) {
    if (!isAuthenticated) {
      setGuestDialogOpen(true)
      return
    }

    setReviewMode(mode)
    setReviewError('')

    if (mode === 'edit' && myReview) {
      setReviewScores(myReview.scores)
      setReviewText(myReview.text)
    } else {
      setReviewScores(emptyScores())
      setReviewText('')
    }

    setReviewDialogOpen(true)
  }

  function submitReview(event) {
    event.preventDefault()

    const scores = Object.values(reviewScores)
    const isComplete = scores.every((score) => score > 0)

    if (!isComplete || !reviewText.trim()) {
      setReviewError('Isi semua rating dan ulasan terlebih dahulu.')
      return
    }

    const averageRating = Math.round(
      scores.reduce((total, score) => total + score, 0) / scores.length,
    )

    const nextReview = {
      id: 'my-review',
      name: 'Kamu',
      date: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      rating: averageRating,
      text: reviewText.trim(),
      scores: reviewScores,
      isMine: true,
    }

    setMyReview(nextReview)
    setReviewDialogOpen(false)
    setReviewText('')
    setReviewScores(emptyScores())
  }

  function deleteMyReview() {
    setMyReview(null)
    setDeleteDialogOpen(false)
  }

  function openReportDialog(review) {
    if (!isAuthenticated) {
      setGuestDialogOpen(true)
      return
    }

    setReportTarget(review)
    setReportText('')
    setReportError('')
    setReportSent(false)
    setReportDialogOpen(true)
  }

  function submitReport(event) {
    event.preventDefault()

    if (!reportText.trim()) {
      setReportError('Laporan tidak boleh kosong.')
      return
    }

    setReportError('')
    setReportSent(true)
  }

  return (
    <div className="restaurant-detail-page">
      <header className="detail-header">
        <div className="detail-header__inner">
          <Link
            to={`/explore${isAuthenticated ? '?mode=account' : ''}`}
            className="detail-back"
          >
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
              <small>({reviewCount} ulasan)</small>
            </div>
          </div>

          <span
            className={
              restaurant.isOpen ? 'detail-status is-open' : 'detail-status is-closed'
            }
          >
            {restaurant.isOpen ? `Buka ${extra.hours}` : 'Sedang tutup'}
          </span>
        </section>

        <section className="detail-reviews" aria-labelledby="review-title">
          <div className="detail-section-heading">
            <div>
              <span>Pengalaman pengunjung</span>
              <h2 id="review-title">Ulasan</h2>
            </div>
            <strong>{reviewCount} ulasan</strong>
          </div>

          <div className="detail-review-list">
            {displayedReviews.map((review, reviewIndex) => (
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

                  <div className="detail-review-card__actions">
                    {review.isMine ? (
                      <>
                        <button type="button" onClick={() => openReviewDialog('edit')}>
                          Edit ulasan
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => setDeleteDialogOpen(true)}
                        >
                          Hapus ulasan
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => openReportDialog(review)}>
                        Laporkan
                      </button>
                    )}
                  </div>
                </div>

                <div className="detail-review-card__gallery">
                  {galleryPositions.map((position, imageIndex) => (
                    <div
                      key={position}
                      className={`detail-review-card__image food-sprite food-sprite--${
                        galleryPositions[
                          (imageIndex + reviewIndex) % galleryPositions.length
                        ]
                      }`}
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
            className="detail-actions__review"
            onClick={() => openReviewDialog(myReview ? 'edit' : 'create')}
          >
            {myReview ? 'Edit Ulasan Saya' : 'Beri Ulasan'}
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
                  <div
                    className={`detail-menu__image menu-sprite menu-sprite--${item.sprite} menu-sprite--${item.position}`}
                  />
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
        <div className="detail-dialog" role="presentation">
          <button
            type="button"
            className="detail-dialog__backdrop"
            onClick={() => setRouteDialogOpen(false)}
            aria-label="Tutup popup rute"
          />

          <section
            className="detail-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="route-title"
          >
            <h2 id="route-title">Rute ke {restaurant.name}</h2>
            <p>Membutuhkan izin lokasi untuk membuka rute di Google Maps.</p>

            <div className="detail-dialog__notice">Ingin membuka Maps?</div>

            <div className="detail-dialog__actions">
              <button
                type="button"
                className="detail-dialog__button detail-dialog__button--outline"
                onClick={openGoogleMaps}
              >
                Buka
              </button>
              <button
                type="button"
                className="detail-dialog__button"
                onClick={() => setRouteDialogOpen(false)}
              >
                Batal
              </button>
            </div>
          </section>
        </div>
      )}

      {guestDialogOpen && (
        <div className="detail-dialog" role="presentation">
          <button
            type="button"
            className="detail-dialog__backdrop"
            onClick={() => setGuestDialogOpen(false)}
            aria-label="Tutup popup login"
          />

          <section
            className="detail-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-title"
          >
            <h2 id="guest-title">Anda belum login</h2>
            <p>
              Untuk memberi rating dan ulasan, silakan masuk ke akun atau daftar
              terlebih dahulu.
            </p>

            <div className="detail-dialog__actions">
              <Link
                to={`/register?next=${encodeURIComponent(detailUrl)}`}
                className="detail-dialog__button detail-dialog__button--outline"
              >
                Daftar
              </Link>
              <Link
                to={`/login?next=${encodeURIComponent(detailUrl)}`}
                className="detail-dialog__button"
              >
                Masuk
              </Link>
            </div>
          </section>
        </div>
      )}

      {reviewDialogOpen && (
        <div className="detail-dialog" role="presentation">
          <button
            type="button"
            className="detail-dialog__backdrop"
            onClick={() => setReviewDialogOpen(false)}
            aria-label="Tutup form ulasan"
          />

          <section
            className="detail-dialog__panel detail-dialog__panel--review"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-dialog-title"
          >
            <h2 id="review-dialog-title">
              {reviewMode === 'edit' ? 'Edit Ulasan' : 'Beri Ulasan'}
            </h2>

            <form onSubmit={submitReview}>
              <div className="review-score-grid">
                {reviewFields.map((field) => (
                  <label className="review-score" key={field.key}>
                    <span>{field.label}</span>
                    <div>
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          className={reviewScores[field.key] >= score ? 'is-filled' : ''}
                          onClick={() =>
                            setReviewScores((current) => ({
                              ...current,
                              [field.key]: score,
                            }))
                          }
                          aria-label={`Rating ${field.label} ${score} dari 5`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </label>
                ))}
              </div>

              <label className="review-textarea">
                Ulasan
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Bagikan pengalaman kamu di warung ini..."
                />
              </label>

              {reviewError && <p className="detail-form-error">{reviewError}</p>}

              <div className="detail-dialog__actions">
                <button
                  type="button"
                  className="detail-dialog__button detail-dialog__button--outline"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="detail-dialog__button">
                  Kirim
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteDialogOpen && (
        <div className="detail-dialog" role="presentation">
          <button
            type="button"
            className="detail-dialog__backdrop"
            onClick={() => setDeleteDialogOpen(false)}
            aria-label="Tutup konfirmasi hapus"
          />

          <section
            className="detail-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Hapus Ulasan?</h2>
            <p>Ulasan dihapus dari rating warung.</p>

            <div className="detail-dialog__actions">
              <button
                type="button"
                className="detail-dialog__button detail-dialog__button--outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="detail-dialog__button"
                onClick={deleteMyReview}
              >
                Hapus
              </button>
            </div>
          </section>
        </div>
      )}

      {reportDialogOpen && (
        <div className="detail-dialog" role="presentation">
          <button
            type="button"
            className="detail-dialog__backdrop"
            onClick={() => setReportDialogOpen(false)}
            aria-label="Tutup form laporan"
          />

          <section
            className="detail-dialog__panel detail-dialog__panel--report"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
          >
            <h2 id="report-title">Laporkan Ulasan</h2>
            <p>
              Laporkan ulasan dari <strong>{reportTarget?.name}</strong> jika
              isinya tidak sesuai.
            </p>

            <form onSubmit={submitReport}>
              <label className="review-textarea">
                Masukkan laporan anda
                <textarea
                  value={reportText}
                  onChange={(event) => setReportText(event.target.value)}
                  placeholder="Tulis alasan laporan..."
                  disabled={reportSent}
                />
              </label>

              {reportError && <p className="detail-form-error">{reportError}</p>}
              {reportSent && (
                <p className="detail-form-success">
                  Laporan berhasil dikirim dan akan diperiksa Admin.
                </p>
              )}

              <div className="detail-dialog__actions">
                <button
                  type="button"
                  className="detail-dialog__button detail-dialog__button--outline"
                  onClick={() => setReportDialogOpen(false)}
                >
                  {reportSent ? 'Tutup' : 'Batal'}
                </button>

                {!reportSent && (
                  <button type="submit" className="detail-dialog__button">
                    Kirim laporan
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default RestaurantDetail