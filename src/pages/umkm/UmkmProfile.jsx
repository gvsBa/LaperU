import { useState } from 'react'

const facilities = ['Wi-Fi', 'Parkir', 'Mushola', 'AC']
const paymentMethods = ['QRIS', 'Cash']

function UmkmProfile() {
  const [form, setForm] = useState({
    description: '',
    contact: '',
    address: '',
    facilities: [],
    payments: [],
  })
  const [showNotice, setShowNotice] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setShowNotice(false)
  }

  function toggleOption(field, value) {
    setForm((current) => {
      const exists = current[field].includes(value)

      return {
        ...current,
        [field]: exists
          ? current[field].filter((item) => item !== value)
          : [...current[field], value],
      }
    })
    setShowNotice(false)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setShowNotice(true)
  }

  return (
    <section className="umkm-profile">
      <h1>Profil Warung</h1>

      <form className="umkm-profile__card" onSubmit={handleSubmit}>
        <label className="umkm-profile__field umkm-profile__field--description">
          <span>Deskripsi</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Ceritakan singkat tentang warung kamu"
          />
        </label>

        <div className="umkm-profile__two-column">
          <label className="umkm-profile__field">
            <span>Kontak</span>
            <input
              type="tel"
              value={form.contact}
              onChange={(event) => updateField('contact', event.target.value)}
              placeholder="Contoh: 0812xxxx"
            />
          </label>

          <label className="umkm-profile__field">
            <span>Alamat</span>
            <input
              type="text"
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              placeholder="Masukkan alamat warung"
            />
          </label>
        </div>

        <fieldset className="umkm-profile__options">
          <legend>Fasilitas</legend>

          <div className="umkm-profile__option-list">
            {facilities.map((facility) => (
              <label key={facility} className="umkm-profile__check">
                <input
                  type="checkbox"
                  checked={form.facilities.includes(facility)}
                  onChange={() => toggleOption('facilities', facility)}
                />
                <span>{facility}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="umkm-profile__options">
          <legend>Metode Pembayaran</legend>

          <div className="umkm-profile__option-list">
            {paymentMethods.map((method) => (
              <label key={method} className="umkm-profile__check">
                <input
                  type="checkbox"
                  checked={form.payments.includes(method)}
                  onChange={() => toggleOption('payments', method)}
                />
                <span>{method}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {showNotice && (
          <p className="umkm-profile__notice">
            Tampilan perubahan sudah jalan. Penyimpanan ke database nanti bagian backend.
          </p>
        )}

        <div className="umkm-profile__actions">
          <button type="submit">Simpan Perubahan</button>
        </div>
      </form>
    </section>
  )
}

export default UmkmProfile