const symbols = { Ayam: '🍗', Nasi: '🍚', Mie: '🍜', Bakso: '🥣', Kopi: '☕', Minuman: '🥤', Camilan: '🥟' }
export default function FoodArtwork({ category }) {
  return <div className="food-artwork" aria-label="Ilustrasi kategori, bukan foto usaha"><span aria-hidden="true">{symbols[category] || '🍽️'}</span><small>ILUSTRASI KATEGORI</small></div>
}
