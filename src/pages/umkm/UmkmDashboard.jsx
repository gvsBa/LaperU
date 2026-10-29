import { useRemote } from '../../services/useRemote'
import { privateApi } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import { Link } from 'react-router-dom'
import { rupiah } from '../../services/restaurantService'
const loadDashboard = async signal => {
  const [statistics, menus, reviews] = await Promise.all(['/statistics','/menus','/reviews'].map(path => privateApi('/umkm' + path, { signal })))
  return { statistics, menus, reviews }
}

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
  const remote = useRemote(loadDashboard)
  const stats = remote.data?.statistics
  const metrics = [
    { label: 'Tayangan profil', value: stats?.profileViews ?? '—', change: 'Permintaan detail, bukan pengunjung unik', tone: 'green' },
    { label: 'Difavoritkan', value: stats?.favoriteCount ?? '—', change: 'Total favorit', tone: 'yellow' },
    { label: 'Rata-rata rating', value: stats ? Number(stats.averageRating).toFixed(1) : '—', change: 'Skala 1–5', tone: 'blue' },
  ]
  const menus = (remote.data?.menus || []).slice(0, 5)
  const reviews = (remote.data?.reviews || []).slice(0, 5).map(item => ({ ...item, name: item.customerName, text: item.comment, rating: Number(item.averageRating).toFixed(1) + ' / 5' }))
  return (
    <section className="umkm-dashboard">
      <h1>Dashboard UMKM</h1><RemoteStatus remote={remote} />

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
          <p>Tayangan 30 hari: {stats?.profileViewsLast30Days ?? "—"}. Grafik per hari belum tersedia.</p>
        </section>

        <section className="umkm-panel umkm-menu-overview">
          <div className="umkm-panel__heading">
            <h2>Menu</h2>
            <Link to="/umkm/menu">Tambah Menu</Link>
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
                    <td>{rupiah(menu.price)}</td>
                    <td><span className="umkm-status">{!Number(menu.isActive) ? "Nonaktif" : Number(menu.isAvailable) ? "Tersedia" : "Habis"}</span></td>
                    <td>
                      <Link to="/umkm/menu" className="umkm-table__action">Kelola</Link>
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
          <article className="umkm-review-preview" key={review.id}>
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
