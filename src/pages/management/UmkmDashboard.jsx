import { Link } from 'react-router-dom'
import RoleGate from '../../components/management/RoleGate'
import ActionForm from '../../components/management/ActionForm'
import { privateApi, saveData, uploadImage } from '../../services/managementService'
import { getFilterOptions, rupiah } from '../../services/restaurantService'
import { useResource } from '../../services/useResource'

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
async function loadDashboard(signal) {
  const application = await privateApi('/umkm/application', { signal })
  if (application.status !== 'APPROVED') return { application }
  const [warung, menus, reviews, statistics, meta] = await Promise.all([
    privateApi('/umkm/warung', { signal }), privateApi('/umkm/menus', { signal }),
    privateApi('/umkm/reviews', { signal }), privateApi('/umkm/statistics', { signal }), getFilterOptions({ signal }),
  ])
  return { application, warung, menus, reviews, statistics, meta }
}
function OwnerContent() {
  const { data, error, loading, reload, version } = useResource(loadDashboard)
  return <main className="management-page">
    <nav><Link to="/account">← Akun saya</Link> · <Link to="/explore">Jelajahi</Link></nav>
    <h1>Dashboard UMKM</h1>
    {error && <p role="alert">{error} <button onClick={reload}>Coba lagi</button></p>}
    {loading && <p role="status">Memuat dashboard…</p>}
    {data && <>
      <section className="management-card"><h2>Pengajuan warung</h2><p>Status pengajuan: <strong>{data.application.status}</strong></p>
        {data.application.adminNote && <p>Catatan Admin: {data.application.adminNote}</p>}
        {data.application.status === 'PENDING' && <p>Pengajuan telah dikirim. Tunggu pemeriksaan Admin.</p>}
        {data.application.status === 'REJECTED' && <p>Pengajuan ditolak. Hubungi Admin untuk tindak lanjut; pengajuan ini tidak dapat dikirim ulang.</p>}
        {['DRAFT', 'REVISION'].includes(data.application.status) && <>
          <ActionForm key={version} onSaved={reload} submitLabel="Simpan identitas usaha" onSubmit={(form) => saveData('/umkm/application', 'PATCH', Object.fromEntries(form))}>
            <label>Nama warung<input name="businessName" required minLength={2} maxLength={160} defaultValue={data.application.businessName} /></label>
            <label>Nama pemilik<input name="ownerName" required minLength={2} maxLength={120} defaultValue={data.application.ownerName} /></label>
            <label>Nomor telepon<input name="phone" required minLength={8} maxLength={30} defaultValue={data.application.phone} /></label>
            <label>Alamat usaha<textarea name="address" required minLength={8} maxLength={500} defaultValue={data.application.address} /></label>
            <label>Jenis usaha<input name="businessType" maxLength={100} defaultValue={data.application.businessType || ''} /></label>
          </ActionForm>
          <ActionForm onSaved={reload} submitLabel="Unggah foto tampak depan" onSubmit={async (form) => {
            const image = await uploadImage(form.get('image'))
            await saveData('/umkm/application', 'PATCH', { storefrontPhotoUrl: image.url })
          }}><label>Foto tampak depan (JPG/PNG, maksimal 2 MB)<input type="file" name="image" accept="image/jpeg,image/png" required /></label></ActionForm>
          {data.application.storefrontPhotoUrl && <img className="management-photo" src={data.application.storefrontPhotoUrl} alt="Foto tampak depan pengajuan" />}
          <ActionForm onSaved={reload} submitLabel="Kirim pengajuan" confirmMessage="Kirim data tersimpan untuk diperiksa Admin? Data dikunci selama pemeriksaan." onSubmit={() => saveData('/umkm/application/submit', 'POST')} />
        </>}
      </section>
      {data.warung && <OwnerManagement key={data.warung.id} data={data} reload={reload} />}
    </>}
  </main>
}
function OwnerManagement({ data, reload }) {
  const { warung, meta, menus, reviews, statistics } = data
  return <>
    <section className="management-card"><h2>Profil warung</h2><Link to={`/restaurants/${warung.slug}`}>Lihat halaman publik</Link>
      <p>{Number(warung.isActive) ? 'Warung aktif' : 'Warung dinonaktifkan Admin'}</p>
      <ActionForm onSaved={reload} submitLabel="Simpan profil warung" onSubmit={(form) => {
        const body = Object.fromEntries(form)
        for (const key of ['priceMin', 'priceMax', 'latitude', 'longitude']) body[key] = body[key] === '' ? null : Number(body[key])
        body.categoryId ||= null
        if (body.priceMin !== null && body.priceMax !== null && body.priceMax < body.priceMin) throw new Error('Harga maksimum tidak boleh di bawah harga minimum.')
        return saveData('/umkm/warung', 'PUT', body)
      }}>
        <label>Nama warung<input name="name" required minLength={2} maxLength={160} defaultValue={warung.name} /></label>
        <label>Deskripsi<textarea name="description" maxLength={2000} defaultValue={warung.description || ''} /></label>
        <label>Alamat warung<textarea name="address" required minLength={8} maxLength={500} defaultValue={warung.address} /></label>
        <label>Kontak<input name="phone" maxLength={30} defaultValue={warung.phone || ''} /></label>
        <label>Kategori<select aria-label="Kategori" name="categoryId" defaultValue={warung.categoryId || ''}><option value="">Belum dipilih</option>{meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Harga minimum<input name="priceMin" type="number" min="0" step="1" defaultValue={warung.priceMin ?? ''} /></label>
        <label>Harga maksimum<input name="priceMax" type="number" min="0" step="1" defaultValue={warung.priceMax ?? ''} /></label>
        <label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" defaultValue={warung.latitude ?? ''} /></label>
        <label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" defaultValue={warung.longitude ?? ''} /></label>
        <label>Status buka<select aria-label="Status buka" name="statusOverride" defaultValue={warung.statusOverride}><option value="AUTO">Ikuti jadwal</option><option value="OPEN">Buka sementara</option><option value="CLOSED">Tutup sementara</option></select></label>
      </ActionForm>
    </section>
    <section className="management-card"><h2>Menu warung</h2>
      <ActionForm submitLabel="Tambah menu" reset onSaved={reload} onSubmit={(form) => saveData('/umkm/menus', 'POST', { name: form.get('name'), description: form.get('description'), price: Number(form.get('price')) })}>
        <label>Nama menu<input name="name" required minLength={2} maxLength={160} /></label><label>Deskripsi menu<input name="description" maxLength={1000} /></label><label>Harga menu<input name="price" required type="number" min="0" step="1" /></label>
      </ActionForm>
      {menus.length === 0 && <p>Belum ada menu.</p>}
      {menus.map((menu) => <details key={menu.id}><summary>{menu.name} — {rupiah(menu.price)} · {Number(menu.isActive) ? 'Aktif' : 'Nonaktif'}</summary>
        <ActionForm submitLabel="Simpan menu" onSaved={reload} onSubmit={(form) => saveData(`/umkm/menus/${menu.id}`, 'PATCH', { name: form.get('name'), description: form.get('description'), price: Number(form.get('price')), isAvailable: form.has('isAvailable'), isActive: form.has('isActive') })}>
          <label>Nama menu<input name="name" required minLength={2} maxLength={160} defaultValue={menu.name} /></label>
          <label>Deskripsi menu<input name="description" maxLength={1000} defaultValue={menu.description || ''} /></label>
          <label>Harga menu<input type="number" min="0" step="1" name="price" required defaultValue={menu.price} /></label>
          <label><input type="checkbox" name="isAvailable" defaultChecked={Boolean(Number(menu.isAvailable))} />Tersedia</label>
          <label><input type="checkbox" name="isActive" defaultChecked={Boolean(Number(menu.isActive))} />Aktif ditampilkan</label>
        </ActionForm>
        <ActionForm submitLabel="Unggah foto menu" onSaved={reload} onSubmit={async (form) => {
          const image = await uploadImage(form.get('image'))
          await saveData(`/umkm/menus/${menu.id}`, 'PATCH', { photoUrl: image.url })
        }}><label>Foto menu<input type="file" name="image" accept="image/jpeg,image/png" required /></label></ActionForm>
      </details>)}
    </section>
    <section className="management-card"><h2>Jam operasional</h2><p>Gunakan format 24 jam. Jadwal mengikuti waktu server lokal.</p>
      <ActionForm submitLabel="Simpan jadwal" onSaved={reload} onSubmit={(form) => saveData('/umkm/operating-hours', 'PUT', { hours: days.map((_, dayOfWeek) => ({ dayOfWeek, isClosed: form.has(`closed-${dayOfWeek}`), openTime: form.get(`open-${dayOfWeek}`) || null, closeTime: form.get(`close-${dayOfWeek}`) || null })) })}>
        {days.map((day, index) => { const hour = warung.hours.find((item) => item.dayOfWeek === index); return <div className="hours-row" key={day}><strong>{day}</strong><label><input type="checkbox" name={`closed-${index}`} defaultChecked={!hour || Boolean(Number(hour.isClosed))} />Tutup</label><label>Buka {day}<input type="time" name={`open-${index}`} defaultValue={hour?.openTime?.slice(0, 5) || ''} /></label><label>Tutup {day}<input type="time" name={`close-${index}`} defaultValue={hour?.closeTime?.slice(0, 5) || ''} /></label></div> })}
      </ActionForm>
    </section>
    {[['Fasilitas', 'facilities', meta.facilities, warung.facilities], ['Metode pembayaran', 'payment-methods', meta.paymentMethods, warung.paymentMethods]].map(([title, endpoint, options, selected]) => <section className="management-card" key={endpoint}><h2>{title}</h2><ActionForm onSaved={reload} onSubmit={(form) => saveData(`/umkm/${endpoint}`, 'PUT', { ids: form.getAll('ids') })}>{options.map((item) => <label key={item.id}><input name="ids" type="checkbox" value={item.id} defaultChecked={selected.some((value) => value.id === item.id)} />{item.name}</label>)}</ActionForm></section>)}
    <section className="management-card"><h2>Galeri warung</h2><ActionForm submitLabel="Tambah foto galeri" reset onSaved={reload} onSubmit={async (form) => {
      const image = await uploadImage(form.get('image'))
      await saveData('/umkm/photos', 'POST', { url: image.url, type: form.get('type'), altText: form.get('altText') })
    }}><label>Gambar<input type="file" name="image" accept="image/jpeg,image/png" required /></label><label>Jenis foto<select aria-label="Jenis foto" name="type"><option value="VENUE">Tempat</option><option value="STOREFRONT">Tampak depan</option><option value="MENU">Menu</option></select></label><label>Deskripsi gambar<input name="altText" maxLength={255} /></label></ActionForm>
      <div className="management-gallery">{warung.photos.map((photo) => <img key={photo.id} className="management-photo" src={photo.url} alt={photo.altText || 'Foto warung'} />)}</div>
    </section>
    <section className="management-card"><h2>Ulasan pengunjung</h2>{reviews.length === 0 && <p>Belum ada ulasan.</p>}{reviews.map((review) => <article key={review.id}><h3>{review.customerName}</h3><p>{review.comment || 'Tanpa komentar'} · {review.status}</p><ActionForm onSaved={reload} submitLabel="Simpan balasan" onSubmit={(form) => saveData(`/umkm/reviews/${review.id}/reply`, 'PUT', { reply: form.get('reply') })}><label>Balasan untuk {review.customerName}<textarea name="reply" required maxLength={1500} defaultValue={review.reply || ''} /></label></ActionForm></article>)}</section>
    <section className="management-card"><h2>Statistik</h2><p>{statistics.profileViews} kunjungan profil · {statistics.favoriteCount} favorit · {statistics.reviewCount} ulasan</p><p>Kunjungan 30 hari: {statistics.profileViewsLast30Days}. Kunjungan menghitung permintaan detail, bukan pengunjung unik.</p></section>
  </>
}
export default function UmkmDashboard() { return <RoleGate role="UMKM"><OwnerContent /></RoleGate> }
