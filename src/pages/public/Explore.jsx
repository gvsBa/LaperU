import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ExploreHeader from '../../components/explore/ExploreHeader'
import RestaurantCard from '../../components/restaurant/RestaurantCard'
import restaurants from '../../mocks/restaurants'

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

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [filterOpen, setFilterOpen] = useState(false)
  const [priceBand, setPriceBand] = useState('all')
  const [minRating, setMinRating] = useState('all')
  const [openNow, setOpenNow] = useState(false)
  const [facility, setFacility] = useState('all')
  const [payment, setPayment] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')

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
  }

  return (
    <div className="explore-page">
      <ExploreHeader
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
      />

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

        <div className="explore-result-heading">
          <div>
            <span>{filteredRestaurants.length} warung ditemukan</span>
            <h1>
              {searchParams.get('q')
                ? `Hasil untuk “${searchParams.get('q')}”`
                : 'Warung di sekitar Telkom University'}
            </h1>
          </div>

          <div className="explore-toolbar">
            <button
              type="button"
              className="filter-trigger"
              onClick={() => setFilterOpen((current) => !current)}
              aria-expanded={filterOpen}
            >
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Urutkan hasil"
            >
              <option value="recommended">Rekomendasi</option>
              <option value="nearest">Terdekat</option>
              <option value="rating">Rating tertinggi</option>
              <option value="cheapest">Harga termurah</option>
            </select>
          </div>
        </div>

        {filterOpen && (
          <section className="explore-filter-panel" aria-label="Filter warung">
            <label>
              Rentang harga
              <select value={priceBand} onChange={(event) => setPriceBand(event.target.value)}>
                <option value="all">Semua harga</option>
                <option value="under20">Di bawah Rp20.000</option>
                <option value="20to30">Rp20.000 - Rp30.000</option>
                <option value="above30">Di atas Rp30.000</option>
              </select>
            </label>

            <label>
              Rating minimum
              <select value={minRating} onChange={(event) => setMinRating(event.target.value)}>
                <option value="all">Semua rating</option>
                <option value="4.5">4,5 ke atas</option>
                <option value="4.7">4,7 ke atas</option>
              </select>
            </label>

            <label>
              Fasilitas
              <select value={facility} onChange={(event) => setFacility(event.target.value)}>
                <option value="all">Semua fasilitas</option>
                <option value="Parkir">Parkir</option>
                <option value="Makan di tempat">Makan di tempat</option>
                <option value="WiFi">WiFi</option>
                <option value="QRIS">QRIS</option>
              </select>
            </label>

            <label>
              Pembayaran
              <select value={payment} onChange={(event) => setPayment(event.target.value)}>
                <option value="all">Semua pembayaran</option>
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
              </select>
            </label>

            <label className="open-now-toggle">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(event) => setOpenNow(event.target.checked)}
              />
              Hanya tampilkan yang buka sekarang
            </label>

            <button type="button" className="filter-reset" onClick={resetExplore}>
              Reset filter
            </button>
          </section>
        )}

        {filteredRestaurants.length > 0 ? (
          <div className="explore-restaurant-grid">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="explore-empty">
            <h2>Warung yang kamu cari belum ketemu.</h2>
            <p>Coba kata kunci atau filter lain.</p>
            <button type="button" onClick={resetExplore}>
              Reset pencarian
            </button>
          </div>
        )}

        {!isAuthenticated && (
          <p className="guest-hint">
            Sedang menjelajah sebagai Guest.{' '}
            <Link to="/login?next=/explore">
              Masuk
            </Link>{' '}
            untuk menyimpan favorit dan memberi ulasan.
          </p>
        )}
      </main>
    </div>
  )
}

export default Explore