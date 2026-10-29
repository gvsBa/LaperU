export default function ListingNotice({ restaurant, compact = false }) {
  if (!restaurant?.dataKind) return null
  const simulation = restaurant.dataKind === 'SIMULATION'
  return <aside className={`listing-notice ${simulation ? 'is-simulation' : ''} ${compact ? 'is-compact' : ''}`} aria-label="Asal data">
    <strong>{simulation ? 'Simulasi demo' : 'Referensi publik'}</strong>
    {!compact && <><p>{restaurant.sourceNote}</p>{restaurant.sourceUrl && <a href={restaurant.sourceUrl} target="_blank" rel="noopener noreferrer">Lihat sumber direktori Telkom University ↗</a>}<small>Penelusuran: {restaurant.sourceCheckedOn ? new Date(restaurant.sourceCheckedOn).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak tersedia'}. Bukan konfirmasi langsung pemilik.</small></>}
  </aside>
}
