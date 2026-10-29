import { Link, useSearchParams } from 'react-router-dom'
import ExploreHeader from '../../components/explore/ExploreHeader'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import { useAuth } from '../../auth/useAuth'
import { getFilterOptions, listWarungs } from '../../services/restaurantService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
const loadMeta = signal => getFilterOptions({ signal })
import EmptySearchIllustration from '../../components/explore/EmptySearchIllustration'
import { useEffect, useCallback, useRef, useState } from 'react'
import QuickSidebar from '../../components/layout/QuickSidebar'
import SiteFooter from '../../components/layout/SiteFooter'

const sortOptions = [
  { value: 'recommended', label: 'Rekomendasi' },
  { value: 'nearest', label: 'Terdekat' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'cheapest', label: 'Harga termurah' },
]

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'Semua')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [priceBand, setPriceBand] = useState('all')
  const [minRating, setMinRating] = useState('all')
  const [openNow, setOpenNow] = useState(false)
  const [facility, setFacility] = useState('all')
  const [payment, setPayment] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const sortMenuRef = useRef(null)

  const selectedSort =
    sortOptions.find((option) => option.value === sortBy) || sortOptions[0]
  const { user } = useAuth()
  const isAuthenticated = !!user
  const meta = useRemote(loadMeta)
  const categories = ['Semua', ...(meta.data?.categories || []).map(item => item.name)]
  const [page, setPage] = useState(1)
  const [dataset, setDataset] = useState('')
  const [coordinates, setCoordinates] = useState(null)
  const [locationError, setLocationError] = useState('')
  function chooseSort(value) {
    if (value === 'nearest' && !coordinates) {
      if (!navigator.geolocation) { setLocationError('Browser tidak mendukung lokasi.'); return }
      navigator.geolocation.getCurrentPosition(({ coords }) => { setCoordinates({ latitude: coords.latitude, longitude: coords.longitude }); setSortBy(value); setPage(1); setLocationError('') }, () => setLocationError('Izin lokasi ditolak atau lokasi belum tersedia. Urutan sebelumnya tetap dipakai.'), { timeout: 10000 })
    } else { setSortBy(value); setPage(1) }
  }

  const categorySlug = meta.data?.categories.find(item => item.name === activeCategory)?.slug
  const queryText = searchParams.get('q') || ''
  const loader = useCallback(signal => listWarungs({ dataset: dataset || undefined, q: queryText || undefined, category: categorySlug,
    minPrice: priceBand === '20to30' ? 20000 : priceBand === 'above30' ? 30001 : undefined,
    maxPrice: priceBand === 'under20' ? 19999 : priceBand === '20to30' ? 30000 : undefined,
    minRating: minRating === 'all' ? undefined : minRating, openNow: openNow || undefined,
    facility: facility === 'all' ? undefined : facility, payment: payment === 'all' ? undefined : payment,
    sort: sortBy, ...(sortBy === 'nearest' ? coordinates : {}), page, limit: 12,
  }, { signal }), [dataset, queryText, categorySlug, priceBand, minRating, openNow, facility, payment, sortBy, coordinates, page])
  const remote = useRemote(loader)
  const filteredRestaurants = remote.data?.items || []

  const activeFilterCount = [
    priceBand !== 'all',
    minRating !== 'all',
    openNow,
    facility !== 'all',
    payment !== 'all',
  ].filter(Boolean).length
  const hasResults = filteredRestaurants.length > 0
  function handleSearch(event) {
    event.preventDefault()

    const nextParams = new URLSearchParams(searchParams)

    if (query.trim()) nextParams.set('q', query.trim())
    else nextParams.delete('q')

    setPage(1)
    setSearchParams(nextParams)
  }

  function resetExplore() {
    setDataset('')
    setPage(1)
    setQuery('')
    setActiveCategory('Semua')
    setPriceBand('all')
    setMinRating('all')
    setOpenNow(false)
    setFacility('all')
    setPayment('all')
    setSortBy('recommended')
    setSearchParams(isAuthenticated ? { mode: 'account' } : {})
    setFilterOpen(false)
  }

  useEffect(() => {
  function handleEscape(event) {
    if (event.key === 'Escape') {
      setSidebarOpen(false)
      setSortOpen(false)
    }
  }

  function handleOutsideClick(event) {
    if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
      setSortOpen(false)
    }
  }

  window.addEventListener('keydown', handleEscape)
  document.addEventListener('mousedown', handleOutsideClick)

  return () => {
    window.removeEventListener('keydown', handleEscape)
    document.removeEventListener('mousedown', handleOutsideClick)
  }
}, [])

  return (
    <div className="explore-page">
      <ExploreHeader
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
        isSidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen((current) => !current)}
      />

      {sidebarOpen && (
        <>
          <button
            type="button"
            className="quick-nav__backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup navigasi"
          />

          <QuickSidebar
            variant="drawer"
            onNavigate={() => setSidebarOpen(false)}
          />
        </>
      )}

      <main className="explore-main">
        <section className="catalog-intro"><span className="section-eyebrow">JELAJAHI SEKITAR KAMPUS</span><p>Referensi usaha nyata bersumber dari direktori publik. Menu, rating dan aktivitas pada usaha <strong>Simulasi</strong> adalah data fiktif untuk demo.</p>
          <div className="catalog-tabs" role="group" aria-label="Jenis katalog">{[['', 'Semua katalog'], ['reference', 'Referensi usaha nyata'], ['simulation', 'Simulasi demo']].map(([value, label]) => <button key={value} type="button" aria-pressed={dataset === value} onClick={() => { setDataset(value); setPage(1) }}>{label}</button>)}</div>
        </section>
        <RemoteStatus remote={remote} /><RemoteStatus remote={meta} />{locationError && <p role="alert">{locationError}</p>}
        <div className="category-tabs" aria-label="Kategori warung">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'active' : ''}
              onClick={() => { setPage(1); setActiveCategory(category) }}
            >
              {category}
            </button>
          ))}
        </div>

        {(
  <div className="explore-result-heading">
    <div>
      <span>{remote.data?.pagination.total ?? 0} warung ditemukan</span>
      <h1>
        {searchParams.get('q')
          ? `Hasil untuk “${searchParams.get('q')}”`
          : 'Warung di sekitarmu'}
      </h1>
    </div>

    <div className="explore-toolbar">
      <button
        type="button"
        className={filterOpen ? 'filter-trigger active' : 'filter-trigger'}
        onClick={() => setFilterOpen((current) => !current)}
      >
        Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>

      <div className="sort-menu" ref={sortMenuRef}>
  <button
    type="button"
    className={sortOpen ? 'sort-menu__trigger is-open' : 'sort-menu__trigger'}
    onClick={() => setSortOpen((current) => !current)}
    aria-haspopup="listbox"
    aria-expanded={sortOpen}
  >
    <span>{selectedSort.label}</span>
    <span className="sort-menu__chevron">⌄</span>
  </button>

  {sortOpen && (
    <div className="sort-menu__list" role="listbox" aria-label="Urutkan warung">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={sortBy === option.value ? 'sort-menu__option active' : 'sort-menu__option'}
          onClick={() => {
            chooseSort(option.value)
            setSortOpen(false)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )}
</div>
    </div>
  </div>
)}

{filterOpen && (
  <section className="explore-filter-panel" aria-label="Filter warung">
    <label>
      Harga
      <select value={priceBand} onChange={(event) => { setPage(1); setPriceBand(event.target.value) }}>
        <option value="all">Semua harga</option>
        <option value="under20">Di bawah Rp20.000</option>
        <option value="20to30">Rp20.000 - Rp30.000</option>
        <option value="above30">Di atas Rp30.000</option>
      </select>
    </label>

    <label>
      Rating
      <select value={minRating} onChange={(event) => { setPage(1); setMinRating(event.target.value) }}>
        <option value="all">Semua rating</option>
        <option value="4">Rating 4.0+</option>
        <option value="4.5">Rating 4.5+</option>
      </select>
    </label>

    <label>
      Fasilitas
      <select value={facility} onChange={(event) => { setPage(1); setFacility(event.target.value) }}>
        <option value="all">Semua fasilitas</option>
        {meta.data?.facilities.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}
      </select>
    </label>

    <label>
      Pembayaran
      <select value={payment} onChange={(event) => { setPage(1); setPayment(event.target.value) }}>
        <option value="all">Semua pembayaran</option>
        {meta.data?.paymentMethods.map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}
      </select>
    </label>

    <label className="open-now-toggle">
      <input
        type="checkbox"
        checked={openNow}
        onChange={(event) => { setPage(1); setOpenNow(event.target.checked) }}
      />
      Buka sekarang
    </label>

    <button type="button" className="filter-reset" onClick={resetExplore}>
      Reset filter
    </button>
  </section>
)}

{hasResults ? (
  <div className="explore-restaurant-grid">
    {filteredRestaurants.map((restaurant) => (
      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
    ))}
  </div>
) : !remote.loading && !remote.error && (
  <section className="explore-empty" role="status">
    <EmptySearchIllustration />

    <div className="explore-empty__content">
      <span className="explore-empty__eyebrow">Pencarian tidak ditemukan</span>
      <h2>Warung yang kamu cari belum ketemu</h2>
      <p>
        Coba pakai kata kunci lain, ganti kategori, atau hapus filter yang
        sedang aktif.
      </p>
      <button type="button" onClick={resetExplore}>
        Atur ulang pencarian
      </button>
    </div>
  </section>
)}

{hasResults && !isAuthenticated && (
  <p className="guest-hint">
    Sedang menjelajah sebagai Guest.{' '}
    <Link to="/login?next=/explore">Masuk</Link> untuk menyimpan favorit dan
    memberi ulasan.
  </p>
)}
        <Pagination remote={{ ...remote, page, setPage, pagination: remote.data?.pagination }} />
      </main>
      <SiteFooter />
    </div>
  )
}
export default Explore
