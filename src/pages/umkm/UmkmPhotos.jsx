import { useRemote } from '../../services/useRemote'
import { privateApi, saveData, uploadImage } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'


const loadPhotos = async signal => (await privateApi('/umkm/warung', { signal })).photos

function UmkmPhotos() {
  const remote = useRemote(loadPhotos, [])
  const photos = [...remote.data, null]
  async function handlePhotoChange(_index, event) {
    const file = event.target.files[0]
    if (!file) return
    await remote.run(async () => {
      const image = await uploadImage(file)
      await saveData('/umkm/photos', 'POST', { url: image.url, type: 'VENUE', altText: 'Foto warung' })
    }, 'Foto berhasil diunggah dan disimpan.')
  }
  return (
    <section className="umkm-photos">
      <h1>Foto Warung &amp; Menu</h1><RemoteStatus remote={remote} />

      <div className="umkm-photos__card">
        <div className="umkm-photos__grid">
          {photos.map((photo, index) => (
            <label
              key={index}
              className={`umkm-photos__tile${photo ? ' has-photo' : ''}`}
              title={`Unggah foto ${index + 1}`}
            >
              <input
                type="file" disabled={!!photo || remote.busy}
                accept="image/jpeg,image/png"
                onChange={(event) => handlePhotoChange(index, event)}
              />

              {photo && <img src={photo.url} alt={`Foto warung atau menu ${index + 1}`} />}
            </label>
          ))}
        </div>

        <p className="umkm-photos__help">Format JPG/JPEG/PNG, maks 2 MB</p>



        <p>Foto disimpan setelah dipilih. Gunakan kotak kosong untuk menambah foto; penghapusan foto belum tersedia.</p>
      </div>
    </section>
  )
}

export default UmkmPhotos
