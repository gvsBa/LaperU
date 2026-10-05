import { Link, useSearchParams } from 'react-router-dom'
import ExploreHeader from '../../components/explore/ExploreHeader'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import restaurants from '../../mocks/restaurants'
import EmptySearchIllustration from '../../components/explore/EmptySearchIllustration'
import { useEffect, useMemo, useRef, useState } from 'react'
import QuickSidebar from '../../components/layout/QuickSidebar'
const categories = [
  'Semua',
  'Masakan Sunda',
  'Mie & Bakmi',
  'Bakso & Soto',
  'Ayam & Bebek',
  'Kopi & Minuman',
  'Dessert',
  'Fast Food',
]

const sortOptions = [
  { value: 'recommended', label: 'Rekomendasi' },
  { value: 'nearest', label: 'Terdekat' },
  { value: 'rating', label: 'Rating tertinggi' },
  { value: 'cheapest', label: 'Harga termurah' },
]

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('Semua')
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
  const isAuthenticated = searchParams.get('mode') === 'account'

  const filteredRestaurants = useMemo(() => {
    const keyword = (searchParams.get('q') || '').trim().toLowerCase()

    const results = restaurants.filter((restaurant) => {
      const searchableText = [
        restaurant.name,
        restaurant.category,
        ...restaurant.searchTerms,
      ].join(' ').toLowerCase()

      const categoryMatches =
        activeCategory === 'Semua' || restaurant.category === activeCategory

      const queryMatches = !keyword || searchableText.includes(keyword)

      const priceMatches =
        priceBand === 'all' ||
        (priceBand === 'under20' && restaurant.minPrice < 20000) ||
        (priceBand === '20to30' &&
          restaurant.minPrice >= 20000 &&
          restaurant.minPrice <= 30000) ||
        (priceBand === 'above30' && restaurant.minPrice > 30000)

      const ratingMatches =
        minRating === 'all' || restaurant.rating >= Number(minRating)

      const openMatches = !openNow || restaurant.isOpen

      const facilityMatches =
        facility === 'all' || restaurant.facilities.includes(facility)

      const paymentMatches =
        payment === 'all' || restaurant.paymentMethods.includes(payment)

      return (
        categoryMatches &&
        queryMatches &&
        priceMatches &&
        ratingMatches &&
        openMatches &&
        facilityMatches &&
        paymentMatches
      )
    })

    return [...results].sort((first, second) => {
      if (sortBy === 'nearest') return first.distanceKm - second.distanceKm
      if (sortBy === 'cheapest') return first.minPrice - second.minPrice
      if (sortBy === 'rating') return second.rating - first.rating

      return second.rating - first.rating || first.distanceKm - second.distanceKm
    })
  }, [
    activeCategory,
    facility,
    minRating,
    openNow,
    payment,
    priceBand,
    searchParams,
    sortBy,
  ])

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

    setSearchParams(nextParams)
  }

  function resetExplore() {
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
        <div className="category-tabs" aria-label="Kategori warung">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {hasResults && (
  <div className="explore-result-heading">
    <div>
      <span>{filteredRestaurants.length} warung ditemukan</span>
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
            setSortBy(option.value)
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

{hasResults && filterOpen && (
  <section className="explore-filter-panel" aria-label="Filter warung">
    <label>
      Harga
      <select value={priceBand} onChange={(event) => setPriceBand(event.target.value)}>
        <option value="all">Semua harga</option>
        <option value="under20">Di bawah Rp20.000</option>
        <option value="20to30">Rp20.000 - Rp30.000</option>
        <option value="above30">Di atas Rp30.000</option>
      </select>
    </label>

    <label>
      Rating
      <select value={minRating} onChange={(event) => setMinRating(event.target.value)}>
        <option value="all">Semua rating</option>
        <option value="4">Rating 4.0+</option>
        <option value="4.5">Rating 4.5+</option>
      </select>
    </label>

    <label>
      Fasilitas
      <select value={facility} onChange={(event) => setFacility(event.target.value)}>
        <option value="all">Semua fasilitas</option>
        <option value="wifi">WiFi</option>
        <option value="parking">Parkir</option>
        <option value="dine-in">Makan di tempat</option>
      </select>
    </label>

    <label>
      Pembayaran
      <select value={payment} onChange={(event) => setPayment(event.target.value)}>
        <option value="all">Semua pembayaran</option>
        <option value="cash">Tunai</option>
        <option value="qris">QRIS</option>
        <option value="transfer">Transfer</option>
      </select>
    </label>

    <label className="open-now-toggle">
      <input
        type="checkbox"
        checked={openNow}
        onChange={(event) => setOpenNow(event.target.checked)}
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
) : (
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
      </main>
    </div>
  )
}

export default Explore