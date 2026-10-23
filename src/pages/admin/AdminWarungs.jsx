import { useMemo, useState } from 'react'


import { usePagedApi } from '../../services/useRemote'
import { saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
import { warungView } from '../../services/viewModels'
import { useNavigate } from 'react-router-dom'
const filters = ['Semua', 'Aktif', 'Nonaktif']

function AdminWarungs() {
  const remote = usePagedApi('/admin/warungs', warungView)
  const warungs = remote.items
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredWarungs = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return warungs.filter((warung) => {
      const filterMatches = activeFilter === 'Semua' || warung.status === activeFilter
      const searchMatches =
        !search ||
        `${warung.name} ${warung.owner} ${warung.category} ${warung.location}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [activeFilter, keyword, warungs])

  const stats = {
    total: warungs.length,
    active: warungs.filter((warung) => warung.status === 'Aktif').length,
    inactive: warungs.filter((warung) => warung.status === 'Nonaktif').length,
    pending: warungs.filter((warung) => warung.status === 'Menunggu Verifikasi').length,
  }

  async function updateStatus(id, status) {
    if (await remote.run(() => saveData(`/admin/warungs/${id}`, 'PATCH', { isActive: status === 'Aktif' }))) setOpenMenuId(null)
  }

  return (
    <section className="admin-warungs">
      <div className="admin-page-heading">
        <div>
          <h1>Data Warung</h1><RemoteStatus remote={remote} /><Pagination remote={remote} /><p>Statistik, pencarian dan filter di bawah berlaku pada halaman ini. Pengajuan baru ada di menu Pengajuan UMKM.</p>
          <p>Kelola seluruh data warung yang terdaftar di LaperU.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-red">⌂</span>
          <div>
            <span>Total Warung</span>
            <strong>{stats.total}</strong>
            <small>Warung terdaftar</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-green">✓</span>
          <div>
            <span>Warung Aktif</span>
            <strong>{stats.active}</strong>
            <small>Siap ditemukan pengguna</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-yellow">!</span>
          <div>
            <span>Warung Nonaktif</span>
            <strong>{stats.inactive}</strong>
            <small>Sedang tidak ditampilkan</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-blue">◷</span>
          <div>
            <span>Menunggu Verifikasi</span>
            <strong>{stats.pending}</strong>
            <small>Perlu diperiksa Admin</small>
          </div>
        </article>
      </div>

      <div className="admin-warungs__toolbar">
        <div className="admin-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari nama warung atau pemilik..."
            aria-label="Cari warung"
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
          <table className="admin-warungs__table">
            <thead>
              <tr>
                <th>Warung</th>
                <th>Pemilik</th>
                <th>Kategori</th>
                <th>Lokasi</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredWarungs.map((warung) => (
                <tr key={warung.id}>
                  <td>
                    <div className="admin-warung-name">
                      <span className="admin-warung-avatar">{warung.initials}</span>
                      <strong>{warung.name}</strong>
                    </div>
                  </td>
                  <td>{warung.owner}</td>
                  <td>{warung.category}</td>
                  <td>{warung.location}</td>
                  <td>
                    <span className="admin-warung-rating">★ {warung.rating}</span>
                    <small className="admin-warung-review-count">
                      ({warung.reviews})
                    </small>
                  </td>
                  <td>
                    <span
                      className={`admin-status is-${warung.status
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                    >
                      {warung.status}
                    </span>
                  </td>
                  <td className="admin-warung-actions">
                    <button
                      type="button"
                      className="admin-dots-button"
                      aria-label={`Aksi ${warung.name}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === warung.id ? null : warung.id,
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === warung.id && (
                      <div className="admin-action-menu">
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/restaurants/${warung.slug}`)
                            setOpenMenuId(null)
                          }}
                        >
                          Lihat detail
                        </button>

                        {warung.status !== 'Aktif' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(warung.id, 'Aktif')}
                          >
                            Aktifkan warung
                          </button>
                        )}

                        {warung.status === 'Aktif' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(warung.id, 'Nonaktif')}
                          >
                            Nonaktifkan warung
                          </button>
                        )}

                        {warung.status === 'Menunggu Verifikasi' && (
                          <button
                            type="button"
                            onClick={() => updateStatus(warung.id, 'Aktif')}
                          >
                            Setujui warung
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredWarungs.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-dashboard__empty">
                    Data warung tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminWarungs
