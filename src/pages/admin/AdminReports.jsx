import { privateApi, saveData } from '../../services/managementService'
import { useRemote } from '../../services/useRemote'
import RemoteStatus from '../../components/common/RemoteStatus'
const loadReports = signal => privateApi('/admin/reports', { signal })
export default function AdminReports() {
  const remote = useRemote(loadReports, [])
  return <section id="admin-reports" className="admin-dashboard__card"><h2>Laporan pengguna</h2><RemoteStatus remote={remote} />
    {!remote.loading && !remote.error && !remote.data.length && <p>Belum ada laporan.</p>}
    {remote.data.map(report => <article className="api-report" key={report.id}><h3>{report.reason}</h3><p>{report.detail}</p><p>{report.reporterName} · {report.targetType} · {report.status}</p>
      {report.targetType === 'REVIEW' && <button disabled={remote.busy} onClick={() => remote.run(() => saveData(`/admin/reviews/${report.targetId}/status`, 'PATCH', { status: 'HIDDEN' }))}>Sembunyikan ulasan yang dilaporkan</button>}
      {report.status === 'OPEN' && <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); remote.run(() => saveData(`/admin/reports/${report.id}`, 'PATCH', Object.fromEntries(form))) }}>
        <label>Hasil pemeriksaan<select aria-label="Hasil pemeriksaan" name="status"><option value="RESOLVED">Selesai ditangani</option><option value="DISMISSED">Tidak ditindaklanjuti</option></select></label>
        <label>Catatan Admin<textarea name="adminNote" maxLength={1000} /></label><button disabled={remote.busy}>Simpan hasil pemeriksaan</button>
      </form>}
    </article>)}
  </section>
}
