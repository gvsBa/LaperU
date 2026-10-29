export default function RemoteStatus({ remote }) {
  return <div className="api-status" aria-live="polite">
    {(remote.loading || remote.busy) && <p role="status">{remote.busy ? 'Menyimpan…' : 'Memuat data…'}</p>}
    {remote.error && <p role="alert">{remote.error} <button type="button" onClick={remote.reload}>Coba lagi</button></p>}
    {remote.message && <p role="status">{remote.message}</p>}
  </div>
}
