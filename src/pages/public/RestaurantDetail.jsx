import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { addFavorite, getFavorites, getWarung, removeFavorite, rupiah } from '../../services/restaurantService'
import ActionForm from '../../components/management/ActionForm'
import ReviewFields from '../../components/restaurant/ReviewFields'
import { createReview } from '../../services/reviewService'
import { saveData } from '../../services/managementService'
const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function RestaurantDetail() {
  const { slug } = useParams()
  return <Detail key={slug} slug={slug} />
}
function Detail({ slug }) {
  const { user } = useAuth()
  const [warung, setWarung] = useState(null)
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState({ owner: null, warungId: null, saved: false })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const [menuOpen, setMenuOpen] = useState(true)
  const favoriteReady = favorite.owner === user?.id && favorite.warungId === warung?.id
  useEffect(() => {
    const controller = new AbortController()
    getWarung(slug, { signal: controller.signal }).then((data) => { if (!controller.signal.aborted) { setWarung(data); setError('') } })
      .catch((error) => { if (!controller.signal.aborted) setError(error.status === 404 ? 'Warung tidak ditemukan atau sudah tidak dipublikasikan.' : error.message) })
    return () => controller.abort()
  }, [slug, retry])
  useEffect(() => {
    if (user?.role !== 'CUSTOMER' || !warung) return
    const controller = new AbortController()
    getFavorites({ signal: controller.signal }).then((items) => { if (!controller.signal.aborted) { setFavorite({ owner: user.id, warungId: warung.id, saved: items.some((item) => item.id === warung.id) }); setMessage('') } })
      .catch((error) => { if (!controller.signal.aborted) setMessage(error.message) })
    return () => controller.abort()
  }, [user?.id, user?.role, warung, retry])
  async function toggleFavorite() {
    setSaving(true); setMessage('')
    try { await (favorite.saved ? removeFavorite(warung.id) : addFavorite(warung.id)); setFavorite({ owner: user.id, warungId: warung.id, saved: !favorite.saved }); setMessage(favorite.saved ? 'Warung dihapus dari favorit.' : 'Warung disimpan ke favorit.') }
    catch (error) { setMessage(error.message) }
    finally { setSaving(false) }
  }
  if (error) return <main className="detail-page"><h1>Warung belum dapat dibuka</h1><p role="alert">{error}</p><button className="button button--outline" onClick={() => setRetry((n) => n + 1)}>Coba lagi</button> <Link to="/explore">Kembali jelajahi</Link></main>
  if (!warung || warung.slug !== slug) return <main className="detail-page"><p role="status">Memuat detail warung…</p></main>
  return <div className="restaurant-detail-page">
    <header className="detail-header"><div className="detail-header__inner"><Link className="detail-back" to="/explore">← Detail warung</Link><Link to="/account">Akun saya</Link></div></header>
    <main className="detail-main">
      <section className="detail-hero" aria-label={`Galeri ${warung.name}`}>
        <div className="detail-hero__title"><span>Warung sekitar Telkom University</span><strong>{warung.name}</strong></div>
        <div className="detail-hero__photos">{warung.photos.length ? warung.photos.slice(0, 4).map((photo) => <img className="detail-hero__photo" key={photo.id} src={photo.url} alt={photo.altText || warung.name} loading="lazy" />) : <p>Foto warung belum ditambahkan.</p>}</div>
      </section>
      <section className="detail-summary"><div><p className="detail-summary__category">{warung.category}</p><h1>{warung.name}</h1><p>{warung.description || 'Deskripsi warung belum diisi.'}</p><p className="detail-summary__meta">{warung.address}</p><p>{warung.priceRange}</p><div className="detail-rating"><strong>{warung.rating ? `${warung.rating.toFixed(1)} / 5` : 'Belum ada rating'}</strong><small>({warung.reviewCount} ulasan)</small></div></div><span className={`detail-status ${warung.isOpen ? 'is-open' : 'is-closed'}`}>{warung.isOpen ? 'Sedang buka' : 'Sedang tutup'}</span></section>
      <div className="detail-actions">
        <a href={warung.mapUrl} target="_blank" rel="noreferrer" className="button button--dark">Buka rute di Maps</a>
        <button type="button" aria-expanded={menuOpen} aria-controls="menu-warung" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? 'Tutup menu' : 'Tampilkan menu'}</button>
        {user?.role === 'CUSTOMER' ? <button disabled={saving || !favoriteReady} onClick={toggleFavorite}>{saving ? 'Menyimpan…' : favorite.saved ? 'Hapus dari favorit' : 'Simpan favorit'}</button> : !user ? <Link to={`/login?next=${encodeURIComponent(`/restaurants/${slug}`)}`}>Masuk untuk menyimpan favorit</Link> : <span>Favorit tersedia untuk Customer.</span>}
      </div>
      {message && <p role="status">{message} {!favoriteReady && <button onClick={() => setRetry((n) => n + 1)}>Coba lagi</button>}</p>}
      {menuOpen && <section id="menu-warung" className="detail-section"><h2>Menu dan harga</h2>{warung.menus.length ? <ul className="detail-menu">{warung.menus.map((menu) => <li key={menu.id}>{menu.photoUrl && <img className="management-photo" src={menu.photoUrl} alt={menu.name} loading="lazy" />}<div><strong>{menu.name}</strong>{menu.description && <p>{menu.description}</p>}<span>{Number(menu.isAvailable) ? 'Tersedia' : 'Sedang tidak tersedia'}</span></div><strong>{rupiah(menu.price)}</strong></li>)}</ul> : <p>Menu belum ditambahkan oleh pemilik.</p>}</section>}
      <div className="detail-columns"><section className="detail-section"><h2>Jam operasional</h2>{warung.hours.length ? <ul>{warung.hours.map((day) => <li key={day.dayOfWeek}>{days[day.dayOfWeek]}: {Number(day.isClosed) ? 'Tutup' : `${day.openTime?.slice(0, 5) || '—'} – ${day.closeTime?.slice(0, 5) || '—'}`}</li>)}</ul> : <p>Jam operasional belum diisi.</p>}</section>
        <section className="detail-section"><h2>Fasilitas & pembayaran</h2><p>{warung.facilities.map((item) => item.name).join(', ') || 'Fasilitas belum diisi.'}</p><p>{warung.payments.map((item) => item.name).join(', ') || 'Metode pembayaran belum diisi.'}</p></section></div>
      <section className="detail-reviews"><div className="detail-section-heading"><div><span>Pengalaman pengunjung</span><h2>Ulasan pengunjung</h2></div><strong>{warung.reviewCount} ulasan</strong></div>
        <div className="detail-review-list">{warung.reviews.length ? warung.reviews.map((review) => <article className="detail-review-card detail-review-card--live" key={review.id}><div className="detail-review-card__content"><h3>{review.customerName} · {Number(review.averageRating).toFixed(1)} / 5</h3><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('id-ID')}</time><p>{review.comment || 'Tidak ada komentar tertulis.'}</p>{review.umkmReply && <blockquote>Balasan pemilik: {review.umkmReply}</blockquote>}
          {user?.role === 'CUSTOMER' && <details><summary>Laporkan ulasan</summary><ActionForm submitLabel="Kirim laporan ulasan" reset onSubmit={(form) => saveData('/customer/reports', 'POST', { targetType: 'REVIEW', targetId: review.id, reason: form.get('reason') })}><label>Alasan laporan<input name="reason" required minLength={3} maxLength={160} /></label></ActionForm></details>}
        </div></article>) : <p>Belum ada ulasan yang ditampilkan.</p>}</div>
      </section>
      {user?.role === 'CUSTOMER' && <section key={user.id} className="management-card"><h2>Tulis ulasan</h2><p>Satu ulasan per warung. Nilai 1 paling rendah, 5 paling tinggi. <Link to="/reviews">Kelola ulasan saya</Link></p>
        <ActionForm submitLabel="Kirim ulasan" reset onSaved={() => setRetry((n) => n + 1)} onSubmit={(form) => createReview(warung.id, form)}><ReviewFields /></ActionForm>
        <details><summary>Laporkan informasi warung</summary><ActionForm submitLabel="Kirim laporan warung" reset onSubmit={(form) => saveData('/customer/reports', 'POST', { targetType: 'WARUNG', targetId: warung.id, reason: form.get('reason'), detail: form.get('detail') })}><label>Alasan laporan<input name="reason" required minLength={3} maxLength={160} /></label><label>Detail laporan<textarea name="detail" maxLength={1200} /></label></ActionForm></details>
      </section>}
    </main>
  </div>
}
