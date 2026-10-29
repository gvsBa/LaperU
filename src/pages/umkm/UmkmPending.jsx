import { useRemote } from '../../services/useRemote'
import { privateApi } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import { Link } from 'react-router-dom'
import { statusLabels } from '../../services/viewModels'
const loadApplication = signal => privateApi('/umkm/application', { signal })
import Logo from '../../components/common/Logo'

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v7" />
      <path d="M7.05 5.05a9 9 0 1 0 9.9 0" />
    </svg>
  )
}

function UmkmPending() {
  const remote = useRemote(loadApplication)

  return (
    <main className="umkm-pending">
      <section className="umkm-pending__card">
        <div className="umkm-pending__content">
          <div className="umkm-pending__logo">
            <Logo />
          </div>

          <div className="umkm-pending__icon">
            <PendingIcon />
          </div>

          <h1>Status pengajuan</h1><RemoteStatus remote={remote} />

          <p className="umkm-pending__description">
            {remote.data?.adminNote || 'Status ditampilkan sesuai hasil pemeriksaan server.'}
          </p>

          <p className="umkm-pending__status">
            Status:
            <span>{statusLabels[remote.data?.status] || "Memuat"}</span>
          </p>

          <button
            type="button"
            className="umkm-pending__reload"
            onClick={remote.reload}
          >
            Memuat ulang status
          </button>

          <Link to="/umkm/pengajuan">Lihat pengajuan</Link> · <Link to="/umkm">Dashboard UMKM</Link>
        </div>
      </section>
    </main>
  )
}

export default UmkmPending
