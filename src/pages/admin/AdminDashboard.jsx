import { useMemo, useState } from 'react'

const statusFilters = [
  'Semua',
  'Menunggu',
  'Perlu Diperbaiki',
  'Disetujui',
  'Ditolak',
]


import { usePagedApi } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
import { applicationView } from '../../services/viewModels'
import { useNavigate } from 'react-router-dom'
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

function AdminDashboard() {
  const remote = usePagedApi('/admin/applications', applicationView)
  const submissions = remote.items
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')

  const filteredSubmissions = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    return submissions.filter((submission) => {
      const matchesFilter =
        activeFilter === 'Semua' || submission.status === activeFilter

      const matchesQuery =
        !keyword ||
        `${submission.business} ${submission.owner}`
          .toLowerCase()
          .includes(keyword)

      return matchesFilter && matchesQuery
    })
  }, [activeFilter, query, submissions])

  return (
    <section className="admin-dashboard">
      <h1>Ringkasan</h1><RemoteStatus remote={remote} /><Pagination remote={remote} /><p>Ringkasan pengajuan pada halaman ini.</p>

      <label className="admin-search">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari nama usaha atau pemilik..."
        />
        <SearchIcon />
      </label>

      <div className="admin-filter-tabs">
        {statusFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`is-${filter.toLowerCase().replaceAll(' ', '-')}${
              activeFilter === filter ? ' is-active' : ''
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="admin-dashboard__card">
        <div className="admin-dashboard__table-wrap">
          <table className="admin-dashboard__table">
            <thead>
              <tr>
                <th>Nama Usaha</th>
                <th>Pemilik</th>
                <th>Tanggal Pengajuan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.business}</td>
                  <td>{submission.owner}</td>
                  <td>{submission.submittedAt}</td>
                  <td>
                    <span
                      className={`admin-status is-${submission.status
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="admin-button" onClick={() => navigate('/admin/pengajuan')}>
                      Periksa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSubmissions.length === 0 && (
            <p className="admin-dashboard__empty">
              Pengajuan yang dicari belum ada.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminDashboard
