import { useRemote } from '../../services/useRemote'
import { privateApi, saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
import { getFilterOptions } from '../../services/restaurantService'
const loadProfile = async signal => {
  const [warung, meta] = await Promise.all([privateApi('/umkm/warung', { signal }), getFilterOptions({ signal })])
  return { ...warung, contact: warung.phone || '', description: warung.description || '', facilities: warung.facilities.map(x => x.id), payments: warung.paymentMethods.map(x => x.id), meta }
}


function UmkmProfile() {
  const remote = useRemote(loadProfile)
  const form = remote.data
  const setForm = remote.setData
  const facilities = form?.meta.facilities || []
  const paymentMethods = form?.meta.paymentMethods || []

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
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
  }

  async function handleSubmit(event) {
    event.preventDefault()
    await remote.run(async () => {
      await saveData('/umkm/warung', 'PUT', { name: form.name, description: form.description, phone: form.contact, address: form.address, categoryId: form.categoryId || null, priceMin: (form.priceMin == null || form.priceMin === '') ? null : Number(form.priceMin), priceMax: (form.priceMax == null || form.priceMax === '') ? null : Number(form.priceMax), statusOverride: form.statusOverride })
      await saveData('/umkm/facilities', 'PUT', { ids: form.facilities })
      await saveData('/umkm/payment-methods', 'PUT', { ids: form.payments })
    })
  }
  if (!form) return <RemoteStatus remote={remote} />

  return (
    <section className="umkm-profile">
      <h1>Profil Warung</h1><RemoteStatus remote={remote} />

      <form className="umkm-profile__card" onSubmit={handleSubmit}>
        <label className="umkm-profile__field"><span>Nama warung</span><input value={form.name} required minLength={2} maxLength={160} onChange={event => updateField('name', event.target.value)} /></label>
        <label className="umkm-profile__field"><span>Kategori</span><select aria-label="Kategori" value={form.categoryId || ''} onChange={event => updateField('categoryId', event.target.value)}><option value="">Belum dipilih</option>{form.meta.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="umkm-profile__two-column">{[['priceMin','Harga minimum'],['priceMax','Harga maksimum']].map(([key,label]) => <label className="umkm-profile__field" key={key}><span>{label}</span><input type="number" min="0" value={form[key] ?? ''} onChange={event => updateField(key, event.target.value)} /></label>)}</div>
        <label className="umkm-profile__field"><span>Status buka</span><select aria-label="Status buka" value={form.statusOverride} onChange={event => updateField('statusOverride', event.target.value)}><option value="AUTO">Ikuti jadwal</option><option value="OPEN">Buka sementara</option><option value="CLOSED">Tutup sementara</option></select></label>
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
              <label key={facility.id} className="umkm-profile__check">
                <input
                  type="checkbox"
                  checked={form.facilities.includes(facility.id)}
                  onChange={() => toggleOption('facilities', facility.id)}
                />
                <span>{facility.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="umkm-profile__options">
          <legend>Metode Pembayaran</legend>

          <div className="umkm-profile__option-list">
            {paymentMethods.map((method) => (
              <label key={method.id} className="umkm-profile__check">
                <input
                  type="checkbox"
                  checked={form.payments.includes(method.id)}
                  onChange={() => toggleOption('payments', method.id)}
                />
                <span>{method.name}</span>
              </label>
            ))}
          </div>
        </fieldset>



        <div className="umkm-profile__actions">
          <button type="submit" disabled={remote.busy}>Simpan Perubahan</button>
        </div>
      </form>
    </section>
  )
}

export default UmkmProfile
