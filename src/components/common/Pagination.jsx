export default function Pagination({ remote }) {
  return <nav className="api-pagination" aria-label="Halaman data">
    <button type="button" disabled={remote.page <= 1 || remote.busy} onClick={() => remote.setPage(remote.page - 1)}>Sebelumnya</button>
    <span>Halaman {remote.page}{remote.pagination ? ` · Total ${remote.pagination.total}` : ''}</span>
    <button type="button" disabled={!remote.pagination || remote.page >= remote.pagination.totalPages || remote.busy} onClick={() => remote.setPage(remote.page + 1)}>Berikutnya</button>
  </nav>
}
