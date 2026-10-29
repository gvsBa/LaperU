import { useMemo, useState } from 'react'


import { usePagedApi } from '../../services/useRemote'
import { saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
import { userView } from '../../services/viewModels'
const filters = ['Semua', 'Customer', 'UMKM', 'Nonaktif']

function AdminUsers() {
  const remote = usePagedApi('/admin/users', userView)
  const users = remote.items
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return users.filter((user) => {
      const filterMatches =
        activeFilter === 'Semua' ||
        user.role === activeFilter ||
        (activeFilter === 'Nonaktif' && user.status === 'Nonaktif')

      const searchMatches =
        !search ||
        `${user.name} ${user.email} ${user.role}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [users, keyword, activeFilter])

  const stats = {
    total: users.length,
    customer: users.filter((user) => user.role === 'Customer').length,
    umkm: users.filter((user) => user.role === 'UMKM').length,
    inactive: users.filter((user) => user.status === 'Nonaktif').length,
  }

  async function updateStatus(id, status) {
    if (await remote.run(() => saveData(`/admin/users/${id}/status`, 'PATCH', { status: status === 'Aktif' ? 'ACTIVE' : 'SUSPENDED' }))) setOpenMenuId(null)
  }

  return (
    <section className="admin-users">
      <div className="admin-page-heading">
        <div>
          <h1>Pengguna</h1><RemoteStatus remote={remote} /><Pagination remote={remote} /><p>Statistik dan filter berlaku pada halaman ini. Akun Admin tidak dikelola melalui menu ini.</p>
          <p>Kelola akun Customer dan UMKM LaperU.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-red">♟</span>
          <div>
            <span>Total Pengguna</span>
            <strong>{stats.total}</strong>
            <small>Seluruh akun terdaftar</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-green">☺</span>
          <div>
            <span>Customer</span>
            <strong>{stats.customer}</strong>
            <small>Pencari informasi kuliner</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-blue">⌂</span>
          <div>
            <span>UMKM</span>
            <strong>{stats.umkm}</strong>
            <small>Pemilik warung terdaftar</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-yellow">!</span>
          <div>
            <span>Akun Nonaktif</span>
            <strong>{stats.inactive}</strong>
            <small>Tidak dapat mengakses akun</small>
          </div>
        </article>
      </div>

      <div className="admin-users__toolbar">
        <div className="admin-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari nama atau email pengguna..."
            aria-label="Cari pengguna"
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
          <table className="admin-users__table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Tanggal Bergabung</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="admin-user-profile">
                      <span>{user.initials}</span>
                      <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-role-badge is-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.joinedAt}</td>
                  <td>
                    <span className={`admin-status is-${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="admin-warung-actions">
                    <button
                      type="button"
                      className="admin-dots-button"
                      aria-label={`Aksi ${user.name}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === user.id ? null : user.id,
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === user.id && (
                      <div className="admin-action-menu">
                        <button
                          type="button"
                          onClick={() => {
                            alert(`${user.name}\n${user.email}\n${user.role} · ${user.status}`)
                            setOpenMenuId(null)
                          }}
                        >
                          Lihat detail
                        </button>

                        <button type="button" disabled title="Belum tersedia: layanan pemulihan password belum diimplementasikan.">Reset password (belum tersedia)</button>

                        {user.status === 'Aktif' ? (
                          <button
                            type="button"
                            onClick={() => updateStatus(user.id, 'Nonaktif')}
                          >
                            Nonaktifkan akun
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateStatus(user.id, 'Aktif')}
                          >
                            Aktifkan akun
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-dashboard__empty">
                    Pengguna tidak ditemukan.
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

export default AdminUsers
