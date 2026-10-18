import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { addFavorite, getFavorites, getWarung, removeFavorite, rupiah } from '../../services/restaurantService'
const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']

export default function RestaurantDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [warung, setWarung] = useState(null)
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState({ owner: null, warungId: null, saved: false })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
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
  return <main className="detail-page">
    <Link to="/explore">← Kembali jelajahi</Link>
    <section className="detail-summary"><p className="section-heading__eyebrow">{warung.category}</p><h1>{warung.name}</h1><p>{warung.description || 'Deskripsi warung belum diisi.'}</p><p>{warung.address}</p><p>{warung.priceRange} · {warung.isOpen ? 'Sedang buka' : 'Tutup'} · {warung.reviewCount} ulasan</p>
      <div className="detail-actions"><a href={warung.mapUrl} target="_blank" rel="noreferrer" className="button button--dark">Buka rute di Maps</a>
        {user?.role === 'CUSTOMER' ? <button disabled={saving || !favoriteReady} onClick={toggleFavorite} className="button button--outline">{saving ? 'Menyimpan…' : favorite.saved ? 'Hapus dari favorit' : 'Simpan favorit'}</button> : !user ? <Link className="button button--outline" to={`/login?next=${encodeURIComponent(`/restaurants/${slug}`)}`}>Masuk untuk menyimpan favorit</Link> : <span>Favorit tersedia untuk akun Customer.</span>}
      </div>{message && <p role="status">{message} {!favoriteReady && <button onClick={() => setRetry((n) => n + 1)}>Coba lagi</button>}</p>}
    </section>
    {warung.photos.length > 0 && <section className="detail-gallery" aria-label="Foto warung">{warung.photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.altText || warung.name} loading="lazy" />)}</section>}
    <section className="detail-section"><h2>Menu dan harga</h2>{warung.menus.length ? <ul className="detail-menu">{warung.menus.map((menu) => <li key={menu.id}><div><strong>{menu.name}</strong>{menu.description && <p>{menu.description}</p>}<span>{Number(menu.isAvailable) ? 'Tersedia' : 'Sedang tidak tersedia'}</span></div><strong>{rupiah(menu.price)}</strong></li>)}</ul> : <p>Menu belum ditambahkan oleh pemilik.</p>}</section>
    <div className="detail-columns"><section className="detail-section"><h2>Jam operasional</h2>{warung.hours.length ? <ul>{warung.hours.map((day) => <li key={day.dayOfWeek}>{days[day.dayOfWeek]}: {Number(day.isClosed) ? 'Tutup' : `${day.openTime?.slice(0, 5) || '—'} – ${day.closeTime?.slice(0, 5) || '—'}`}</li>)}</ul> : <p>Jam operasional belum diisi.</p>}</section>
      <section className="detail-section"><h2>Fasilitas & pembayaran</h2><p>{warung.facilities.map((item) => item.name).join(', ') || 'Fasilitas belum diisi.'}</p><p>{warung.payments.map((item) => item.name).join(', ') || 'Metode pembayaran belum diisi.'}</p></section></div>
    <section className="detail-section"><h2>Ulasan pengunjung</h2><p>Rating warung: {warung.rating ? `${warung.rating.toFixed(1)} / 5` : 'Belum ada rating'}</p>{warung.reviews.length ? warung.reviews.map((review) => <article className="detail-review" key={review.id}><h3>{review.customerName} · {Number(review.averageRating).toFixed(1)} / 5</h3><p>{review.comment || 'Tidak ada komentar tertulis.'}</p>{review.umkmReply && <blockquote>Balasan pemilik: {review.umkmReply}</blockquote>}</article>) : <p>Belum ada ulasan yang ditampilkan.</p>}</section>
  </main>
}
