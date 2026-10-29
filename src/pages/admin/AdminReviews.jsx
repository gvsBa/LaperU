import { useMemo, useState } from 'react'

import { usePagedApi } from '../../services/useRemote'
import { saveData } from '../../services/managementService'
import { reviewView } from '../../services/viewModels'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
import AdminReports from './AdminReports'

const filters = ['Semua', 'Ditampilkan', 'Disembunyikan']

function AdminReviews() {
  const remote = usePagedApi('/admin/reviews', reviewView)
  const reviews = remote.items
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredReviews = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return reviews.filter((review) => {
      const filterMatches =
        activeFilter === 'Semua' || review.status === activeFilter

      const searchMatches =
        !search ||
        `${review.name} ${review.warung} ${review.comment}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [reviews, keyword, activeFilter])

  const stats = {
    total: reviews.length,
    visible: reviews.filter((review) => review.status === 'Ditampilkan').length,
    pending: reviews.filter((review) => review.status === 'Menunggu').length,
    hidden: reviews.filter((review) => review.status === 'Disembunyikan').length,
  }

  async function updateStatus(id, status) {
    if (await remote.run(() => saveData(`/admin/reviews/${id}/status`, 'PATCH', { status: status === 'Ditampilkan' ? 'VISIBLE' : 'HIDDEN' }))) setOpenMenuId(null)
  }

  return (
    <section className="admin-reviews">
      <div className="admin-page-heading">
        <div>
          <h1>Ulasan & Laporan</h1><RemoteStatus remote={remote} /><Pagination remote={remote} /><p>Statistik dan filter ulasan berlaku pada halaman ini.</p>
          <p>Ulasan baru langsung terlihat; Admin dapat menyembunyikan ulasan yang melanggar.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-red">★</span>
          <div>
            <span>Total Ulasan</span>
            <strong>{stats.total}</strong>
            <small>Seluruh ulasan masuk</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-green">✓</span>
          <div>
            <span>Ditampilkan</span>
            <strong>{stats.visible}</strong>
            <small>Sudah tampil untuk publik</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-yellow">!</span>
          <div>
            <span>Menunggu Moderasi</span>
            <strong>{stats.pending}</strong>
            <small>Butuh keputusan Admin</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-blue">◉</span>
          <div>
            <span>Disembunyikan</span>
            <strong>{stats.hidden}</strong>
            <small>Tidak tampil ke publik</small>
          </div>
        </article>
      </div>

      <div className="admin-reviews__toolbar">
        <div className="admin-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari ulasan, pengguna, atau warung..."
            aria-label="Cari ulasan"
          />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </div>

        <div className="admin-warungs__filters">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeFilter === filter ? 'is-active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-dashboard__card">
        <div className="admin-dashboard__table-wrap">
          <table className="admin-reviews__table">
            <thead>
              <tr>
                <th>Ulasan</th>
                <th>Warung</th>
                <th>Rating</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="admin-review-user">
                      <span>{review.initials}</span>
                      <div>
                        <strong>{review.name}</strong>
                        <p>{review.comment}</p>
                      </div>
                    </div>
                  </td>
                  <td>{review.warung}</td>
                  <td>
                    <span className="admin-review-rating">
                      ★ {review.rating}
                    </span>
                  </td>
                  <td>{review.date}</td>
                  <td>
                    <span
                      className={`admin-status is-${review.status
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="admin-warung-actions">
                    <button
                      type="button"
                      className="admin-dots-button"
                      aria-label={`Aksi ulasan ${review.name}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === review.id ? null : review.id,
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === review.id && (
                      <div className="admin-action-menu">
                        <button
                          type="button"
                          onClick={() => updateStatus(review.id, 'Ditampilkan')}
                        >
                          Tampilkan ulasan
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(review.id, 'Disembunyikan')}
                        >
                          Sembunyikan ulasan
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('admin-reports')?.scrollIntoView({ behavior: 'smooth' })
                            setOpenMenuId(null)
                          }}
                        >
                          Lihat laporan
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-dashboard__empty">
                    Ulasan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AdminReports />
    </section>
  )
}

export default AdminReviews
