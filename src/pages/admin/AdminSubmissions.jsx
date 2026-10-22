import { useMemo, useState } from 'react'

const initialSubmissions = [
  {
    id: 1,
    businessName: 'Sambal Mangga',
    owner: 'Muhayat',
    submittedAt: '21 Oktober 2026',
    status: 'Menunggu',
    email: 'muhayat@gmail.com',
    phone: '0812-3456-7890',
    address: 'Jl. Telekomunikasi No. 1, Bandung',
    type: 'Makanan & Minuman',
    description:
      'Usaha makanan rumahan yang menyediakan sambal mangga, nasi, dan menu pendamping lainnya.',
    documents: ['KTP Pemilik.jpg', 'Sertifikat Halal.jpg', 'Foto Warung.jpg'],
  },
  {
    id: 2,
    businessName: 'Soto Pak Odang',
    owner: 'Odang',
    submittedAt: '20 Agustus 2026',
    status: 'Ditolak',
    email: 'odang@gmail.com',
    phone: '0812-9988-2211',
    address: 'Jl. Sukabirus, Bandung',
    type: 'Makanan',
    description: 'Warung soto rumahan untuk mahasiswa.',
    documents: ['KTP Pemilik.jpg', 'Foto Warung.jpg'],
  },
  {
    id: 3,
    businessName: 'Warteg Podom',
    owner: 'Podom',
    submittedAt: '19 April 2026',
    status: 'Disetujui',
    email: 'podom@gmail.com',
    phone: '0812-7788-4455',
    address: 'Jl. Bojongsoang, Bandung',
    type: 'Makanan',
    description: 'Warung makan dengan menu harian.',
    documents: ['KTP Pemilik.jpg', 'Foto Warung.jpg'],
  },
]

const filters = ['Semua', 'Menunggu', 'Perlu Diperbaiki', 'Disetujui', 'Ditolak']

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [actionMode, setActionMode] = useState('')
  const [note, setNote] = useState('')

  const selectedSubmission = submissions.find((submission) => submission.id === selectedId)

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

  function updateSubmission(action) {
    if ((action === 'revision' || action === 'reject') && !note.trim()) {
      alert('Alasan atau catatan wajib diisi dulu.')
      return
    }

    const statusMap = {
      approve: 'Disetujui',
      revision: 'Perlu Diperbaiki',
      reject: 'Ditolak',
    }

    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === selectedId
          ? { ...submission, status: statusMap[action] }
          : submission,
      ),
    )

    closeDrawer()
  }

  return (
    <section className="admin-submissions">
      <h1>Pengajuan UMKM</h1>

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
                      onClick={() => setSelectedId(submission.id)}
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
                <h3>Dokumen Pendukung</h3>

                <div className="admin-document-list">
                  {selectedSubmission.documents.map((document) => (
                    <button type="button" key={document} className="admin-document">
                      <span>▣</span>
                      {document}
                      <b>↗</b>
                    </button>
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
                      <strong>Menunggu verifikasi Admin</strong>
                      <span>Dalam proses</span>
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