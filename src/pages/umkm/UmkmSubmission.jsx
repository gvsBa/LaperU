import { useRef, useState } from 'react'

import { useRemote } from '../../services/useRemote'
import { privateApi, saveData, uploadImage } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import { statusLabels } from '../../services/viewModels'
const loadApplication = signal => privateApi('/umkm/application', { signal })
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V3m0 0-4 4m4-4 4 4M5 14v5.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V14" />
    </svg>
  )
}

function UmkmSubmission() {
  const fileInputRef = useRef(null)
  const [photoName, setPhotoName] = useState('')
  const remote = useRemote(loadApplication)
  const [photo, setPhoto] = useState(null)

  function handlePhotoChange(event) {
    const [file] = event.target.files
    setPhotoName(file?.name || '')
    setPhoto(file || null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const form = Object.fromEntries(new FormData(event.currentTarget))
    await remote.run(async () => {
      if (photo) form.storefrontPhotoUrl = (await uploadImage(photo)).url
      await saveData('/umkm/application', 'PATCH', form)
      await saveData('/umkm/application/submit', 'POST')
    }, 'Pengajuan terkirim. Tunggu pemeriksaan Admin.')
  }
  if (!remote.data) return <RemoteStatus remote={remote} />

  return (
    <section className="umkm-submission">
      <h1>Pengajuan</h1><RemoteStatus remote={remote} /><p>Status: {statusLabels[remote.data.status]}</p>

      <div className="umkm-submission__revision">
        <strong>Revisi:</strong>
        <span>{remote.data.adminNote || "Belum ada catatan Admin."}</span>
      </div>

      <form className="umkm-submission__card" onSubmit={handleSubmit}><fieldset disabled={remote.busy || !["DRAFT", "REVISION"].includes(remote.data.status)}>
        <div className="umkm-submission__two-column">
          <label className="umkm-field">
            <span>Nama Usaha</span>
            <input name="businessName" required minLength={2} maxLength={160} defaultValue={remote.data.businessName} type="text" placeholder="Masukkan nama usaha" />
          </label>

          <label className="umkm-field">
            <span>No. Telpon</span>
            <input name="phone" required minLength={8} maxLength={30} defaultValue={remote.data.phone} type="tel" placeholder="Masukkan nomor telepon" />
          </label>
        </div>

        <label className="umkm-field">
          <span>Alamat</span>
          <input name="address" required minLength={8} maxLength={500} defaultValue={remote.data.address} type="text" placeholder="Masukkan alamat usaha" />
        </label>

        <div className="umkm-field">
          <span>Unggah ulang foto</span>

          <input
            ref={fileInputRef}
            className="umkm-upload__input"
            type="file"
            aria-label="Foto tampak depan (JPG/PNG, maksimal 2 MB)"
            accept="image/png,image/jpeg"
            onChange={handlePhotoChange}
          />

          <button
            type="button"
            className={`umkm-upload${photoName ? ' has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon />
            <span>
              {photoName || 'Klik untuk unggah foto tampak depan warung'}
            </span>
          </button>
        </div>

        {remote.data.storefrontPhotoUrl && <img src={remote.data.storefrontPhotoUrl} alt="Foto pengajuan tersimpan" style={{ maxWidth: 240 }} />}

        <div className="umkm-submission__actions">
          <button type="submit">Kirim Pengajuan</button>
        </div>
      </fieldset></form>
    </section>
  )
}

export default UmkmSubmission
