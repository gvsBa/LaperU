import { useMemo, useState } from 'react'

import { useRemote } from '../../services/useRemote'
import { privateApi } from '../../services/managementService'
import { dateLabel, csvCell } from '../../services/viewModels'
import RemoteStatus from '../../components/common/RemoteStatus'
const loadLogs = async signal => (await privateApi('/admin/audit-logs', { signal })).map(item => ({ ...item, time: dateLabel(item.createdAt), admin: item.adminName, category: { UMKM_SUBMISSION: 'Pengajuan', WARUNG: 'Warung', USER: 'Pengguna', REVIEW: 'Ulasan' }[item.entityType] || item.entityType, detail: item.entityId }))

const filters = ['Semua', 'Pengajuan', 'Warung', 'Pengguna', 'Ulasan']

function AdminAuditLog() {
  const remote = useRemote(loadLogs, [])
  const auditLogs = remote.data
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [keyword, setKeyword] = useState('')

  const filteredLogs = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return auditLogs.filter((log) => {
      const filterMatches =
        activeFilter === 'Semua' || log.category === activeFilter

      const searchMatches =
        !search ||
        `${log.admin} ${log.category} ${log.action} ${log.detail}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [activeFilter, keyword, auditLogs])

  function exportCsv() {
    const header = ['Waktu', 'Admin', 'Kategori', 'Aksi', 'Detail']

    const rows = filteredLogs.map((log) => [
      log.time,
      log.admin,
      log.category,
      log.action,
      log.detail,
    ])

    const csv = [header, ...rows]
      .map((row) =>
        row.map(csvCell).join(','),
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'audit-log-laperu.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <section className="admin-audit-log">
      <div className="admin-page-heading admin-audit-log__heading">
        <div>
          <h1>Audit Log</h1><RemoteStatus remote={remote} /><p>Maksimal 200 aktivitas terbaru. Export mengikuti filter yang terlihat.</p>
          <p>Riwayat aktivitas penting yang dilakukan oleh Admin.</p>
        </div>

        <button type="button" className="admin-audit-log__export" onClick={exportCsv}>
          ↓ Export CSV
        </button>
      </div>

      <div className="admin-audit-log__summary">
        <article>
          <span>Total Aktivitas</span>
          <strong>{auditLogs.length}</strong>
          <small>Aktivitas tercatat</small>
        </article>

        <article>
          <span>Hari Ini</span>
          <strong>{auditLogs.filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString()).length}</strong>
          <small>Aksi Admin hari ini</small>
        </article>

        <article>
          <span>Pengajuan UMKM</span>
          <strong>
            {auditLogs.filter((log) => log.category === 'Pengajuan').length}
          </strong>
          <small>Aktivitas pengajuan</small>
        </article>
      </div>

      <div className="admin-audit-log__toolbar">
        <div className="admin-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari aktivitas atau data terkait..."
            aria-label="Cari audit log"
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
          <table className="admin-audit-log__table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Admin</th>
                <th>Kategori</th>
                <th>Aktivitas</th>
                <th>Detail</th>
              </tr>
            </thead>

            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.time}</td>
                  <td>
                    <span className="admin-audit-log__admin">
                      {log.admin.slice(0, 1)}
                    </span>
                    {log.admin}
                  </td>
                  <td>
                    <span
                      className={`admin-audit-log__category is-${log.category
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                    >
                      {log.category}
                    </span>
                  </td>
                  <td>{log.action}</td>
                  <td>{log.detail}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-dashboard__empty">
                    Aktivitas tidak ditemukan.
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

export default AdminAuditLog
