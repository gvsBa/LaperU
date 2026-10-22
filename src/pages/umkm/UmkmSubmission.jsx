import { useRef, useState } from 'react'

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
  const [submitted, setSubmitted] = useState(false)

  function handlePhotoChange(event) {
    const [file] = event.target.files
    setPhotoName(file?.name || '')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="umkm-submission">
      <h1>pengajuan</h1>

      <div className="umkm-submission__revision">
        <strong>Revisi:</strong>
        <span>Tolong perbarui menu baru</span>
      </div>

      <form className="umkm-submission__card" onSubmit={handleSubmit}>
        <div className="umkm-submission__two-column">
          <label className="umkm-field">
            <span>Nama Usaha</span>
            <input type="text" placeholder="Masukkan nama usaha" />
          </label>

          <label className="umkm-field">
            <span>No. Telpon</span>
            <input type="tel" placeholder="Masukkan nomor telepon" />
          </label>
        </div>

        <label className="umkm-field">
          <span>Alamat</span>
          <input type="text" placeholder="Masukkan alamat usaha" />
        </label>

        <div className="umkm-field">
          <span>Unggah ulang foto</span>

          <input
            ref={fileInputRef}
            className="umkm-upload__input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
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

        {submitted && (
          <p className="umkm-submission__notice">
            Tampilan pengajuan sudah siap. Nanti aksi kirimnya disambungkan ke backend.
          </p>
        )}

        <div className="umkm-submission__actions">
          <button type="submit">Kirim Pengajuan</button>
        </div>
      </form>
    </section>
  )
}

export default UmkmSubmission