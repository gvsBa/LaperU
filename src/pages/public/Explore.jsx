import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ExploreHeader from '../../components/explore/ExploreHeader'
import MenuCard from '../../components/explore/MenuCard'
import menuItems from '../../mocks/menuItems'

const categories = ['Semua', 'Sarapan', 'Makanan Utama', 'Minuman', 'Dessert']

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const isAuthenticated = searchParams.get('mode') === 'account'

  const filteredItems = useMemo(() => {
    const keyword = (searchParams.get('q') || '').trim().toLowerCase()
    return menuItems.filter((item) => {
      const categoryMatches = activeCategory === 'Semua' || item.category === activeCategory
      const queryMatches = !keyword || `${item.name} ${item.restaurant}`.toLowerCase().includes(keyword)
      return categoryMatches && queryMatches
    })
  }, [activeCategory, searchParams])

  function handleSearch(event) {
    event.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    if (query.trim()) nextParams.set('q', query.trim())
    else nextParams.delete('q')
    setSearchParams(nextParams)
  }

  return (
    <div className="explore-page">
      <ExploreHeader query={query} onQueryChange={setQuery} onSearch={handleSearch} isAuthenticated={isAuthenticated} />

      <main className="explore-main">
        <div className="category-tabs" aria-label="Kategori menu">
          {categories.map((category) => (
            <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>

        <div className="explore-result-heading">
          <div>
            <span>{filteredItems.length} menu ditemukan</span>
            <h1>{searchParams.get('q') ? `Hasil untuk “${searchParams.get('q')}”` : 'Menu populer di sekitarmu'}</h1>
          </div>
          <button type="button">Terpopuler⌄</button>
        </div>

        {filteredItems.length > 0 ? (
          <div className="menu-grid">
            {filteredItems.map((item) => <MenuCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="explore-empty">
            <h2>Menu yang kamu cari belum ketemu.</h2>
            <p>Coba kata kunci lain atau tampilkan kembali semua kategori.</p>
            <button onClick={() => { setQuery(''); setSearchParams(isAuthenticated ? { mode: 'account' } : {}); setActiveCategory('Semua') }}>Reset pencarian</button>
          </div>
        )}

        {!isAuthenticated && (
          <p className="guest-hint">Sedang menjelajah sebagai Guest. <Link to="/login?next=/explore">Masuk</Link> untuk menyimpan favorit dan memberi ulasan.</p>
        )}
      </main>
    </div>
  )
}

export default Explore
