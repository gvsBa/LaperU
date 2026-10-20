import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import RoleGate from '../../components/management/RoleGate'
import ActionForm from '../../components/management/ActionForm'
import ReviewFields from '../../components/restaurant/ReviewFields'
import { reviewPayload } from '../../services/reviewService'
import { privateApi, saveData } from '../../services/managementService'
import { useResource } from '../../services/useResource'

function Reviews() {
  const [page, setPage] = useState(1)
  const loader = useCallback((signal) => privateApi(`/customer/reviews?page=${page}&limit=20`, { signal }), [page])
  const { data, error, loading, reload } = useResource(loader)
  return <main className="management-page"><Link to="/account">← Akun saya</Link><h1>Ulasan saya</h1>
    {loading && <p role="status">Memuat ulasan…</p>}{error && <p role="alert">{error} <button onClick={reload}>Coba lagi</button></p>}
    {data && <>{data.items.length === 0 && <p>Belum ada ulasan.</p>}{data.items.map((review) => <article className="management-card" key={review.id}><h2><Link to={`/restaurants/${review.warungSlug}`}>{review.warungName}</Link></h2><p>Status: {review.status}</p>
      {review.umkmReply && <blockquote>Balasan pemilik: {review.umkmReply}</blockquote>}
      <ActionForm submitLabel="Perbarui ulasan" onSaved={reload} onSubmit={(form) => saveData(`/customer/reviews/${review.id}`, 'PATCH', reviewPayload(form))}><ReviewFields review={review} /></ActionForm>
      <ActionForm submitLabel="Hapus ulasan" onSaved={reload} confirmMessage="Hapus ulasan ini beserta balasan pemilik? Tindakan ini tidak dapat dibatalkan." onSubmit={() => saveData(`/customer/reviews/${review.id}`, 'DELETE')} />
    </article>)}<nav className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>Halaman {page}</span><button disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>Berikutnya</button></nav></>}
  </main>
}
export default function CustomerReviews() { return <RoleGate role="CUSTOMER"><Reviews /></RoleGate> }
