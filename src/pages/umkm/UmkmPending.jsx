import { useState } from 'react'
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
  const [checked, setChecked] = useState(false)

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

          <h1>pengajuan sedang di verifikasi</h1>

          <p className="umkm-pending__description">
            Data warung dan foto sudah diterima. Admin akan meninjau pengajuanmu.
          </p>

          <p className="umkm-pending__status">
            Status:
            <span>Menunggu verifikasi</span>
          </p>

          <button
            type="button"
            className="umkm-pending__reload"
            onClick={() => setChecked(true)}
          >
            Memuat ulang status
          </button>

          {checked && (
            <p className="umkm-pending__notice">
              Belum ada perubahan status. Nanti backend yang cek status sebenarnya.
            </p>
          )}
        </div>
      </section>
    </main>
  )
}

export default UmkmPending