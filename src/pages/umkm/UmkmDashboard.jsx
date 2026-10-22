const metrics = [
  {
    label: 'Tayangan Profile',
    value: '1.020',
    change: '+4 dari minggu lalu',
    tone: 'green',
  },
  {
    label: 'Difavoritkan',
    value: '24',
    change: '-7 dari minggu lalu',
    tone: 'yellow',
  },
  {
    label: 'Rata-Rata Rating',
    value: '7',
    change: '-2 dari minggu lalu',
    tone: 'blue',
  },
]

const menus = [
  { id: 1, name: 'Ayam Kremes', price: '18.000', status: 'Tersedia' },
  { id: 2, name: 'Ayam Kremes', price: '18.000', status: 'Tersedia' },
  { id: 3, name: 'Ayam Kremes', price: '18.000', status: 'Tersedia' },
]

const reviews = [
  {
    name: 'Ayyam Goreng',
    rating: '★★★★★',
    text: 'Tempatnya nyaman dan bagus, makanannya enak-enak',
  },
  {
    name: 'Lele',
    rating: '★★★★★',
    text: 'Tempatnya nyaman dan bagus, makanannya enak-enak',
  },
]

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10.5V20h16v-9.5" />
      <path d="M3 10.5 5 4h14l2 6.5" />
      <path d="M3 10.5c.7 1.3 2 2 3.5 2s2.8-.7 3.5-2c.7 1.3 2 2 3.5 2s2.8-.7 3.5-2c.7 1.3 2 2 3.5 2s2.8-.7 3.5-2" />
      <path d="M9 20v-5h6v5" />
    </svg>
  )
}

function UmkmDashboard() {
  return (
    <section className="umkm-dashboard">
      <h1>Dashboard UMKM</h1>

      <div className="umkm-metric-grid">
        {metrics.map((metric) => (
          <article className="umkm-metric" key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small className={`is-${metric.tone}`}>{metric.change}</small>
            </div>

            <span className={`umkm-metric__icon is-${metric.tone}`}>
              <StoreIcon />
            </span>
          </article>
        ))}
      </div>

      <div className="umkm-dashboard__top-grid">
        <section className="umkm-panel umkm-chart-panel" aria-label="Grafik performa warung">
          <div className="umkm-bar-chart">
            {[44, 88, 132, 88, 44, 132].map((height, index) => (
              <span key={index} style={{ height: `${height}px` }} />
            ))}
          </div>
        </section>

        <section className="umkm-panel umkm-menu-overview">
          <div className="umkm-panel__heading">
            <h2>Menu</h2>
            <button type="button">Tambah Menu</button>
          </div>

          <div className="umkm-table-wrap">
            <table className="umkm-table">
              <thead>
                <tr>
                  <th>Menu</th>
                  <th>Harga</th>
                  <th>Status</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id}>
                    <td>{menu.name}</td>
                    <td>{menu.price}</td>
                    <td><span className="umkm-status">Tersedia</span></td>
                    <td>
                      <button type="button" className="umkm-table__action">
                        Batal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="umkm-panel umkm-reviews-overview">
        <h2>Ulasan Terbaru</h2>

        {reviews.map((review) => (
          <article className="umkm-review-preview" key={review.name}>
            <p>
              <strong>{review.name}</strong>
              <span>{review.rating}</span>
            </p>
            <small>{review.text}</small>
          </article>
        ))}
      </section>
    </section>
  )
}

export default UmkmDashboard