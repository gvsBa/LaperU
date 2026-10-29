import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { getWarung, addFavorite } from '../../services/restaurantService'
import { privateApi, saveData } from '../../services/managementService'
import { useRemote } from '../../services/useRemote'
import { publicReviewView, scoreKeys } from '../../services/viewModels'
import RemoteStatus from '../../components/common/RemoteStatus'
import profileAvatar from '../../assets/images/profile-avatar.webp'
import SiteFooter from '../../components/layout/SiteFooter'
import ListingNotice from '../../components/restaurant/ListingNotice'
import FoodArtwork from '../../components/restaurant/FoodArtwork'

const reviewFields = [
  { key: 'taste', label: 'Rasa' },
  { key: 'price', label: 'Harga' },
  { key: 'portion', label: 'Porsi' },
  { key: 'place', label: 'Kebersihan' },
  { key: 'comfort', label: 'Kenyamanan' },
  { key: 'service', label: 'Kecepatan' },
]


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
  const { slug } = useParams()
  const { user } = useAuth()
  return <Detail key={slug + (user?.id || 'guest')} slug={slug} user={user} />
}
function Detail({ slug, user }) {
  const loader = useCallback(async signal => {
    const restaurant = await getWarung(slug, { signal })
    const own = user?.role === 'CUSTOMER' ? await privateApi(`/customer/reviews?warungId=${restaurant.id}`, { signal }) : null
    return { restaurant, myReview: own?.items[0] ? publicReviewView(own.items[0], true) : null }
  }, [slug, user?.role])
  const remote = useRemote(loader)
  const restaurant = remote.data?.restaurant
  const myReview = remote.data?.myReview
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
  const [reportText, setReportText] = useState('')
  const [reportError, setReportError] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)

  const isAuthenticated = user?.role === 'CUSTOMER'

  if (remote.loading || remote.error) return <main className="detail-not-found"><RemoteStatus remote={remote} /><Link to="/explore">Kembali ke Explore</Link></main>
  if (!restaurant) {
    return (
      <main className="detail-not-found">
        <h1>Warung tidak ditemukan.</h1>
        <p>Data warung yang kamu cari belum tersedia.</p>
        <Link to="/explore">Kembali ke Explore</Link>
      </main>
    )
  }

  const extra = { address: restaurant.address, hours: 'sesuai status pemilik' }
  const restaurantMenu = restaurant.menus
  const highlights = [...restaurant.facilities, ...restaurant.payments].map(item => item.name)
  const detailUrl = `/restaurants/${restaurant.slug}`
  const reviewCount = restaurant.reviewCount
  const displayedReviews = restaurant.reviews.filter(item => item.id !== myReview?.id).map(item => publicReviewView(item))
  if (myReview) displayedReviews.unshift(myReview)

  function openGoogleMaps() {
    const destination = restaurant.latitude != null && restaurant.longitude != null ? `${restaurant.latitude},${restaurant.longitude}` : `${restaurant.name}, ${extra.address}, Bandung`

    function openMap(origin) {
      const url = origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${encodeURIComponent(destination)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`

      window.open(url, '_blank', 'noopener,noreferrer')
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

  async function submitReview(event) {
    event.preventDefault()
    if (Object.values(reviewScores).some(score => score < 1) || !reviewText.trim()) { setReviewError('Isi semua rating dan ulasan terlebih dahulu.'); return }
    const body = { ...Object.fromEntries(Object.entries(scoreKeys).map(([key, field]) => [field, reviewScores[key]])), comment: reviewText.trim() }
    if (reviewMode !== 'edit') body.warungId = restaurant.id
    if (await remote.run(() => saveData(reviewMode === 'edit' ? `/customer/reviews/${myReview.id}` : '/customer/reviews', reviewMode === 'edit' ? 'PATCH' : 'POST', body))) { setReviewDialogOpen(false); setReviewError('') }
  }
  async function deleteMyReview() {
    if (await remote.run(() => saveData(`/customer/reviews/${myReview.id}`, 'DELETE'))) setDeleteDialogOpen(false)
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

  async function submitReport(event) {
    event.preventDefault()
    if (reportText.trim().length < 3) { setReportError('Alasan minimal 3 karakter.'); return }
    setReportError('')
    if (await remote.run(() => saveData('/customer/reports', 'POST', { targetType: reportTarget ? 'REVIEW' : 'WARUNG', targetId: reportTarget?.id || restaurant.id, reason: reportText.trim().slice(0, 160), detail: reportText.trim() }))) setReportSent(true)
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

      <main className="detail-main"><RemoteStatus remote={remote} />
        <ListingNotice restaurant={restaurant} />
        <section className="detail-hero" aria-label={`Galeri ${restaurant.name}`}>
          <div className="detail-hero__title">
            <span>Warung pilihan sekitar Telkom University</span>
            <strong>{restaurant.name}</strong>
          </div>

          <div className="detail-hero__photos">
            {restaurant.photos.length ? restaurant.photos.slice(0, 4).map(photo => <img key={photo.id} className="detail-hero__photo" src={photo.url} alt={photo.altText || restaurant.name} loading="lazy" />) : <FoodArtwork category={restaurant.category} />}
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
              <span aria-label={`Rating ${restaurant.rating} dari 5`}>{"★".repeat(Math.round(restaurant.rating))}</span>
              <strong>{restaurant.rating}</strong>
              <small>({reviewCount} ulasan)</small>
            </div>
          </div>

          <span
            className={
              restaurant.isOpen ? 'detail-status is-open' : 'detail-status is-closed'
            }
          >
            {restaurant.isOpen == null ? 'Jam operasional belum dikonfirmasi' : restaurant.isOpen ? `Buka ${extra.hours}` : 'Sedang tutup'}
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
            {displayedReviews.map((review) => (
              <article className="detail-review-card" key={review.id}>
                <div className="detail-review-card__profile">
                  <img src={profileAvatar} alt="" />
                </div>

                <div className="detail-review-card__content">
                  <div className="detail-review-card__top">
                    <div>
                      <h3>{review.name}</h3>
                      <div className="detail-review-card__rating">
                        <span>{'★'.repeat(Math.round(review.rating))}</span>
                        <time>{review.date}</time>
                      </div>
                    </div>
                  </div>

                  <p>{review.text}</p>{review.isMine && review.status === "HIDDEN" && <small>Ulasan ini disembunyikan Admin dari publik.</small>}{review.umkmReply && <blockquote>Balasan pemilik: {review.umkmReply}</blockquote>}

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

              </article>
            ))}
          </div>
        </section>

        <div className="detail-actions">
          {isAuthenticated && <><button disabled={remote.busy} onClick={() => remote.run(() => addFavorite(restaurant.id), 'Warung tersimpan di favorit.')}>Simpan favorit</button><button onClick={() => openReportDialog(null)}>Laporkan warung</button></>}
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
                  {item.photoUrl && <img className="detail-menu__image" src={item.photoUrl} alt={item.name} />}
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description} · {Number(item.isAvailable) ? "Tersedia" : "Habis"}</p>
                    <strong>Rp{Number(item.price).toLocaleString('id-ID')}</strong>
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

            <form onSubmit={submitReview}><RemoteStatus remote={remote} />
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
                  maxLength={1500} aria-label="Ulasan" value={reviewText}
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
                <button type="submit" disabled={remote.busy} className="detail-dialog__button">
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
                disabled={remote.busy} onClick={deleteMyReview}
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
            <h2 id="report-title">Laporkan {reportTarget ? "Ulasan" : "Warung"}</h2>
            <p>
              Laporkan <strong>{reportTarget?.name || restaurant.name}</strong> jika
              isinya tidak sesuai.
            </p>

            <form onSubmit={submitReport}><RemoteStatus remote={remote} />
              <label className="review-textarea">
                Masukkan laporan anda
                <textarea
                  maxLength={1200} aria-label="Alasan laporan" value={reportText}
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
                  <button type="submit" disabled={remote.busy} className="detail-dialog__button">
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
