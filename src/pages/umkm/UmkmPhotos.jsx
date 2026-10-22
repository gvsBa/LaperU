import { useState } from 'react'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const emptyPhotos = [null, null, null, null]

function UmkmPhotos() {
  const [photos, setPhotos] = useState(emptyPhotos)
  const [notice, setNotice] = useState('')

  function handlePhotoChange(index, event) {
    const [file] = event.target.files

    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setNotice('Ukuran foto maksimal 2 MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setPhotos((currentPhotos) =>
        currentPhotos.map((photo, photoIndex) =>
          photoIndex === index ? reader.result : photo
        )
      )
      setNotice('')
    }

    reader.readAsDataURL(file)
  }

  function handleSave() {
    setNotice('Foto sudah tersimpan di tampilan lokal. Upload server nanti dihubungkan backend.')
  }

  return (
    <section className="umkm-photos">
      <h1>Foto Warung &amp; Menu</h1>

      <div className="umkm-photos__card">
        <div className="umkm-photos__grid">
          {photos.map((photo, index) => (
            <label
              key={index}
              className={`umkm-photos__tile${photo ? ' has-photo' : ''}`}
              title={`Unggah foto ${index + 1}`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) => handlePhotoChange(index, event)}
              />

              {photo && <img src={photo} alt={`Foto warung atau menu ${index + 1}`} />}
            </label>
          ))}
        </div>

        <p className="umkm-photos__help">Format JPG/JPEG/PNG, maks 2 MB</p>

        {notice && <p className="umkm-photos__notice">{notice}</p>}

        <div className="umkm-photos__actions">
          <button type="button" onClick={handleSave}>
            Simpan Foto
          </button>
        </div>
      </div>
    </section>
  )
}

export default UmkmPhotos