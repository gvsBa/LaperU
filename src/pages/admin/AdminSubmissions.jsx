import { useMemo, useState } from 'react'


import { usePagedApi } from '../../services/useRemote'
import { privateApi, saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import Pagination from '../../components/common/Pagination'
import { applicationView } from '../../services/viewModels'

const filters = ['Semua', 'Menunggu', 'Perlu Diperbaiki', 'Disetujui', 'Ditolak']

function AdminSubmissions() {
  const remote = usePagedApi('/admin/applications', applicationView)
  const submissions = remote.items
  const [detail, setDetail] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [actionMode, setActionMode] = useState('')
  const [note, setNote] = useState('')

  const selectedSubmission = detail?.id === selectedId ? detail : null
  async function inspect(id) { setSelectedId(id); setDetail(null); await remote.run(async () => { setDetail(applicationView(await privateApi(`/admin/applications/${id}`))) }, '') }

  const filteredSubmissions = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return submissions.filter((submission) => {
      const filterMatches = activeFilter === 'Semua' || submission.status === activeFilter
      const searchMatches =
        !search ||
        `${submission.businessName} ${submission.owner}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [activeFilter, keyword, submissions])

  function closeDrawer() {
    setSelectedId(null)
    setActionMode('')
    setNote('')
  }

  async function updateSubmission(action) {
    if ((action === 'revision' || action === 'reject') && note.trim().length < 5) { alert('Alasan minimal 5 karakter.'); return }
    if (await remote.run(() => saveData(`/admin/applications/${selectedId}/decision`, 'POST', { decision: { approve: 'APPROVED', revision: 'REVISION', reject: 'REJECTED' }[action], ...(note.trim() ? { note: note.trim() } : {}) }))) closeDrawer()
  }

  return (
    <section className="admin-submissions">
      <h1>Pengajuan UMKM</h1>
      <RemoteStatus remote={remote} /><Pagination remote={remote} /><p>Pencarian dan filter berlaku pada halaman ini.</p>

      <div className="admin-search">
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari nama usaha atau pemilik..."
          aria-label="Cari pengajuan UMKM"
        />
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </div>

      <div className="admin-filter-tabs" aria-label="Filter status pengajuan">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`${activeFilter === filter ? 'is-active' : ''} ${
              filter !== 'Semua' ? `is-${filter.toLowerCase().replaceAll(' ', '-')}` : ''
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
                  <td>{submission.businessName}</td>
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
                    <button
                      type="button"
                      className="admin-button"
                      onClick={() => inspect(submission.id)}
                    >
                      Periksa
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-dashboard__empty">
                    Pengajuan UMKM tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="admin-submission-drawer-wrap">
          <button
            type="button"
            className="admin-submission-drawer__overlay"
            onClick={closeDrawer}
            aria-label="Tutup detail pengajuan"
          />

          <aside className="admin-submission-drawer">
            <div className="admin-submission-drawer__header">
              <div>
                <span>Pengajuan UMKM</span>
                <h2>Detail Pengajuan</h2>
              </div>
              <button type="button" onClick={closeDrawer} aria-label="Tutup">
                ×
              </button>
            </div>

            <div className="admin-submission-drawer__content">
              <section className="admin-detail-section">
                <h3>Informasi Usaha</h3>

                <div className="admin-detail-grid">
                  <div>
                    <span>Nama usaha</span>
                    <strong>{selectedSubmission.businessName}</strong>
                  </div>
                  <div>
                    <span>Nama pemilik</span>
                    <strong>{selectedSubmission.owner}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{selectedSubmission.email}</strong>
                  </div>
                  <div>
                    <span>Nomor telepon</span>
                    <strong>{selectedSubmission.phone}</strong>
                  </div>
                  <div>
                    <span>Jenis usaha</span>
                    <strong>{selectedSubmission.type}</strong>
                  </div>
                  <div>
                    <span>Alamat</span>
                    <strong>{selectedSubmission.address}</strong>
                  </div>
                </div>

                <p className="admin-detail-description">
                  {selectedSubmission.description}
                </p>
              </section>

              <section className="admin-detail-section">
                <h3>Foto tampak depan</h3>

                <div className="admin-document-list">
                  {selectedSubmission.documents.map((document) => (
                    <a key={document} className="admin-document" href={document} target="_blank" rel="noreferrer"><img src={document} alt="Foto pengajuan warung" style={{ maxWidth: '100%', maxHeight: 220 }} /></a>
                  ))}
                </div>
              </section>

              <section className="admin-detail-section">
                <h3>Lokasi Usaha</h3>
                <div className="admin-location-placeholder">
                  <span>●</span>
                  <p>{selectedSubmission.address}</p>
                </div>
              </section>

              <section className="admin-detail-section">
                <h3>Riwayat Pengajuan</h3>

                <div className="admin-timeline">
                  <div className="is-current">
                    <i />
                    <div>
                      <strong>Pengajuan dikirim</strong>
                      <span>{selectedSubmission.submittedAt}</span>
                    </div>
                  </div>
                  <div>
                    <i />
                    <div>
                      <strong>{selectedSubmission.status}</strong>
                      <span>{selectedSubmission.description || "Belum ada catatan Admin"}</span>
                    </div>
                  </div>
                </div>
              </section>

              {actionMode && (
                <section className="admin-detail-section admin-action-note">
                  <h3>
                    {actionMode === 'revision'
                      ? 'Catatan perbaikan'
                      : 'Alasan penolakan'}
                  </h3>

                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Tulis catatan untuk pemilik usaha..."
                  />
                </section>
              )}
            </div>

            {selectedSubmission.status === 'Menunggu' && (
              <div className="admin-submission-drawer__actions">
                {!actionMode ? (
                  <>
                    <button
                      type="button"
                      className="admin-drawer-button admin-drawer-button--outline"
                      onClick={() => setActionMode('revision')}
                    >
                      Minta Perbaikan
                    </button>
                    <button
                      type="button"
                      className="admin-drawer-button admin-drawer-button--danger"
                      onClick={() => setActionMode('reject')}
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      className="admin-drawer-button"
                      onClick={() => updateSubmission('approve')}
                    >
                      Setujui
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-drawer-button admin-drawer-button--outline"
                      onClick={() => {
                        setActionMode('')
                        setNote('')
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className="admin-drawer-button"
                      onClick={() => updateSubmission(actionMode)}
                    >
                      Simpan Keputusan
                    </button>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}

export default AdminSubmissions
