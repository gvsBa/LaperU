import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import RoleGate from '../../components/management/RoleGate'
import ActionForm from '../../components/management/ActionForm'
import { privateApi, saveData } from '../../services/managementService'
import { getFilterOptions } from '../../services/restaurantService'
import { useResource } from '../../services/useResource'

const tabs = { applications: 'Pengajuan', users: 'Pengguna', warungs: 'Warung', reports: 'Laporan', reference: 'Data master', 'audit-logs': 'Audit log' }
function Application({ id, onSaved }) {
  const loader = useCallback((signal) => privateApi(`/admin/applications/${id}`, { signal }), [id])
  const { data, error, loading, reload } = useResource(loader)
  if (loading) return <p role="status">Memuat pengajuan…</p>
  if (error) return <p role="alert">{error} <button onClick={reload}>Coba lagi</button></p>
  return <section className="management-card"><h2>Detail pengajuan: {data.businessName}</h2>
    <p>{data.ownerName} · {data.email} · {data.phone}</p><p>{data.address}</p><p>{data.businessType || 'Jenis usaha belum diisi'}</p>
    <p>Status: {data.status}</p>{data.adminNote && <p>Catatan: {data.adminNote}</p>}
    {data.storefrontPhotoUrl && <img className="management-photo" src={data.storefrontPhotoUrl} alt="Foto pengajuan" />}
    {data.status === 'PENDING' && <ActionForm submitLabel="Simpan keputusan" confirmMessage="Simpan keputusan untuk pengajuan ini?" onSaved={() => { reload(); onSaved() }} onSubmit={(form) => {
      const decision = form.get('decision')
      const note = form.get('note').trim()
      if (decision !== 'APPROVED' && note.length < 5) throw new Error('Alasan revisi atau penolakan minimal 5 karakter.')
      return saveData(`/admin/applications/${id}/decision`, 'POST', { decision, ...(note ? { note } : {}) })
    }}>
      <label>Keputusan<select aria-label="Keputusan" name="decision" required defaultValue=""><option value="" disabled>Pilih keputusan</option><option value="APPROVED">Setujui</option><option value="REVISION">Minta revisi</option><option value="REJECTED">Tolak</option></select></label>
      <label>Catatan keputusan<textarea name="note" maxLength={1000} /></label>
    </ActionForm>}
  </section>
}
function AdminContent() {
  const [tab, setTab] = useState('applications')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const loader = useCallback(async (signal) => {
    const paginated = ['applications', 'users', 'warungs'].includes(tab)
    const [summary, result] = await Promise.all([
      privateApi('/admin/dashboard', { signal }),
      tab === 'reference' ? getFilterOptions({ signal }) : privateApi(`/admin/${tab}${paginated ? `?page=${page}&limit=20` : ''}`, { signal }),
    ])
    return { tab, page, summary, result }
  }, [tab, page])
  const { data, error, loading, reload } = useResource(loader)
  const current = data?.tab === tab && data?.page === page ? data : null
  const items = current?.result.items || (Array.isArray(current?.result) ? current.result : [])
  return <main className="management-page"><nav><Link to="/account">← Akun saya</Link> · <Link to="/explore">Jelajahi</Link></nav><h1>Dashboard Admin</h1>
    {data && <p>{data.summary.activeWarungs} warung aktif · {data.summary.customers} Customer · {data.summary.umkmAccounts} UMKM · {data.summary.openReports} laporan terbuka</p>}
    <nav className="management-tabs" aria-label="Bagian Admin">{Object.entries(tabs).map(([key, title]) => <button key={key} aria-pressed={tab === key} onClick={() => { setTab(key); setPage(1); setSelected(null) }}>{title}</button>)}</nav>
    {error && <p role="alert">{error} <button onClick={reload}>Coba lagi</button></p>}
    {(loading || !current) && !error && <p role="status">Memuat data…</p>}
    {current && <>
      <h2>{tabs[tab]}</h2>
      {tab !== 'reference' && items.length === 0 && <p>Belum ada data.</p>}
      {tab === 'applications' && items.map((item) => <article className="management-card" key={item.id}><h3>{item.businessName}</h3><p>{item.ownerName} · {item.status}</p><button className="button button--outline" onClick={() => setSelected(item.id)}>Periksa {item.businessName}</button></article>)}
      {tab === 'applications' && selected && <Application key={selected} id={selected} onSaved={reload} />}
      {tab === 'users' && items.map((item) => <article className="management-card" key={item.id}><h3>{item.fullName}</h3><p>{item.email} · {item.role} · {item.status}</p><ActionForm onSaved={reload} submitLabel="Ubah status akun" confirmMessage="Ubah akses akun ini?" onSubmit={(form) => saveData(`/admin/users/${item.id}/status`, 'PATCH', { status: form.get('status') })}><label>Status akun<select aria-label="Status akun" name="status" required defaultValue=""><option value="" disabled>Pilih status</option><option value="ACTIVE">Aktifkan</option><option value="SUSPENDED">Tangguhkan</option></select></label></ActionForm></article>)}
      {tab === 'warungs' && items.map((item) => <article className="management-card" key={item.id}><h3>{item.name}</h3><p>{item.ownerEmail} · {Number(item.isActive) ? 'Aktif' : 'Nonaktif'}</p><ActionForm onSaved={reload} submitLabel="Simpan data warung" onSubmit={(form) => saveData(`/admin/warungs/${item.id}`, 'PATCH', { name: form.get('name'), address: form.get('address'), isActive: form.has('isActive') })}><label>Nama warung<input name="name" required minLength={2} maxLength={160} defaultValue={item.name} /></label><label>Alamat warung<textarea name="address" required minLength={8} maxLength={500} defaultValue={item.address} /></label><label><input name="isActive" type="checkbox" defaultChecked={Boolean(Number(item.isActive))} />Publikasikan warung</label></ActionForm></article>)}
      {tab === 'reports' && items.map((item) => <article className="management-card" key={item.id}><h3>{item.reason}</h3><p>{item.detail}</p><p>{item.reporterName} · {item.status} · {item.targetType}</p>
        {item.status === 'OPEN' && <ActionForm onSaved={reload} submitLabel="Simpan hasil pemeriksaan" onSubmit={(form) => saveData(`/admin/reports/${item.id}`, 'PATCH', Object.fromEntries(form))}><label>Hasil<select aria-label="Hasil" name="status"><option value="RESOLVED">Selesai ditangani</option><option value="DISMISSED">Tidak ditindaklanjuti</option></select></label><label>Catatan<textarea name="adminNote" maxLength={1000} /></label></ActionForm>}
        {item.targetType === 'REVIEW' && <ActionForm submitLabel="Moderasi ulasan" confirmMessage="Ubah visibilitas ulasan yang dilaporkan?" onSaved={reload} onSubmit={(form) => saveData(`/admin/reviews/${item.targetId}/status`, 'PATCH', { status: form.get('status') })}><label>Visibilitas<select aria-label="Visibilitas" name="status"><option value="HIDDEN">Sembunyikan</option><option value="VISIBLE">Tampilkan</option></select></label></ActionForm>}
      </article>)}
      {tab === 'reference' && ['categories', 'facilities'].map((type) => <section className="management-card" key={type}><h3>{type === 'categories' ? 'Kategori' : 'Fasilitas'}</h3><ActionForm reset onSaved={reload} submitLabel="Tambah data" onSubmit={(form) => saveData(`/admin/${type}`, 'POST', { name: form.get('name') })}><label>Nama baru<input name="name" required minLength={2} maxLength={100} /></label></ActionForm>{current.result[type].map((item) => <details key={item.id}><summary>{item.name}</summary><ActionForm onSaved={reload} onSubmit={(form) => saveData(`/admin/${type}/${item.id}`, 'PATCH', { name: form.get('name') })}><label>Nama<input name="name" required minLength={2} maxLength={100} defaultValue={item.name} /></label></ActionForm></details>)}</section>)}
      {tab === 'audit-logs' && <><p>Menampilkan maksimal 200 aktivitas terbaru.</p>{items.map((item) => <article className="management-card" key={item.id}><strong>{item.action}</strong><p>{item.adminName} · {new Date(item.createdAt).toLocaleString('id-ID')} · {item.entityType}</p></article>)}</>}
      {current.result.pagination && <nav className="pagination" aria-label="Halaman data Admin"><button disabled={page <= 1} onClick={() => { setPage(page - 1); setSelected(null) }}>Sebelumnya</button><span>Halaman {page} · Total {current.result.pagination.total}</span><button disabled={page >= current.result.pagination.totalPages} onClick={() => { setPage(page + 1); setSelected(null) }}>Berikutnya</button></nav>}
    </>}
  </main>
}
export default function AdminDashboard() { return <RoleGate role="ADMIN"><AdminContent /></RoleGate> }
