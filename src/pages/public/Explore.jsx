import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ExploreHeader from '../../components/explore/ExploreHeader'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import { getFilterOptions, listWarungs } from '../../services/restaurantService'
import { useAuth } from '../../auth/useAuth'

export default function Explore() {
  const [params, setParams] = useSearchParams()
  const queryKey = params.toString()
  const [query, setQuery] = useState(params.get('q') || '')
  const [metadata, setMetadata] = useState({ categories: [] })
  const [metadataError, setMetadataError] = useState('')
  const [result, setResult] = useState({ items: [], pagination: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const { user } = useAuth()
  useEffect(() => {
    const controller = new AbortController()
    getFilterOptions({ signal: controller.signal }).then(setMetadata).catch((error) => { if (!controller.signal.aborted) setMetadataError(error.message) })
    return () => controller.abort()
  }, [retry])
  useEffect(() => {
    const controller = new AbortController()
    const filters = new URLSearchParams(queryKey)
    const requestFilters = Object.fromEntries(['q', 'category', 'maxPrice', 'openNow', 'page'].map((key) => [key, filters.get(key)]))
    Promise.resolve().then(() => { if (!controller.signal.aborted) { setLoading(true); setError(''); setQuery(filters.get('q') || '') } })
    listWarungs({ ...requestFilters, limit: 12 }, { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult(data) })
      .catch((error) => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [queryKey, retry])
  function updateFilter(key, value) {
    const next = new URLSearchParams(params); next.delete('mode')
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  function handleSearch(event) { event.preventDefault(); updateFilter('q', query.trim()) }
  const pagination = result.pagination
  return <div className="explore-page">
    <ExploreHeader query={query} onQueryChange={setQuery} onSearch={handleSearch} />
    <main className="explore-main">
      <div className="category-tabs" aria-label="Kategori warung">
        <button className={!params.get('category') ? 'active' : ''} onClick={() => updateFilter('category', '')}>Semua</button>
        {metadata.categories.map((category) => <button key={category.id} className={params.get('category') === category.slug ? 'active' : ''} onClick={() => updateFilter('category', category.slug)}>{category.name}</button>)}
      </div>
      {metadataError && <p role="status">Kategori belum dapat dimuat. Pencarian tetap bisa dicoba.</p>}
      <form className="discovery-filters" onSubmit={(event) => { event.preventDefault(); updateFilter('maxPrice', new FormData(event.currentTarget).get('maxPrice')) }}>
        <label>Maksimal budget (Rp)<input key={params.get('maxPrice') || 'empty'} name="maxPrice" type="number" min="0" step="1000" defaultValue={params.get('maxPrice') || ''} placeholder="Contoh: 20000" /></label>
        <button className="button button--outline" type="submit">Terapkan budget</button>
        <label className="filter-check"><input type="checkbox" checked={params.get('openNow') === 'true'} onChange={(event) => updateFilter('openNow', event.target.checked ? 'true' : '')} />Sedang buka</label>
        <button className="button button--outline" type="button" onClick={() => { setQuery(''); setParams({}) }}>Reset filter</button>
      </form>
      <div className="explore-result-heading"><div><span>{loading ? 'Memuat warung…' : error ? 'Data belum tersedia' : `${pagination?.total || 0} warung ditemukan`}</span><h1>{params.get('q') ? `Hasil untuk “${params.get('q')}”` : 'Jelajahi warung sekitar kampus'}</h1></div><span>Urutan: rating dan jumlah ulasan</span></div>
      <p className="auth-help">Hasil berupa warung. Harga adalah rentang harga warung, bukan jaminan harga setiap menu.</p>
      {loading && <p role="status">Sedang mengambil informasi dari server…</p>}
      {!loading && error && <div className="explore-empty" role="alert"><h2>Warung belum dapat dimuat.</h2><p>{error}</p><button onClick={() => { setMetadataError(''); setRetry((n) => n + 1) }}>Coba lagi</button></div>}
      {!loading && !error && result.items.length > 0 && <div className="restaurant-grid">{result.items.map((item) => <RestaurantCard key={item.id} restaurant={item} />)}</div>}
      {!loading && !error && result.items.length === 0 && <div className="explore-empty"><h2>Warung belum ditemukan.</h2><p>Coba kata kunci atau budget lain.</p><button onClick={() => { setQuery(''); setParams({}) }}>Reset pencarian</button></div>}
      {!loading && !error && pagination?.totalPages > 1 && <nav className="pagination" aria-label="Halaman hasil pencarian"><button disabled={pagination.page <= 1} onClick={() => updateFilter('page', String(pagination.page - 1))}>Sebelumnya</button><span>Halaman {pagination.page} dari {pagination.totalPages}</span><button disabled={pagination.page >= pagination.totalPages} onClick={() => updateFilter('page', String(pagination.page + 1))}>Berikutnya</button></nav>}
      {!user && <p className="guest-hint">Sedang menjelajah sebagai Guest. <Link to="/login?next=/explore">Masuk</Link> untuk menyimpan favorit.</p>}
    </main>
  </div>
}
