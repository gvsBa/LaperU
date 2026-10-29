import { useRemote } from '../../services/useRemote'
import { privateApi, saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'


const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const loadHours = async signal => {
  const warung = await privateApi('/umkm/warung', { signal })
  return days.map((day, index) => { const row = warung.hours.find(item => item.dayOfWeek === index); return { day, dayOfWeek: index, isClosed: !row || Boolean(Number(row.isClosed)), open: row?.openTime?.slice(0, 5) || '', close: row?.closeTime?.slice(0, 5) || '' } })
}

function UmkmHours() {
  const remote = useRemote(loadHours, [])
  const hours = remote.data
  const setHours = remote.setData

  function updateHour(index, field, value) {
    setHours((currentHours) =>
      currentHours.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  return (
    <section className="umkm-hours">
      <h1>Jam Operasional</h1><RemoteStatus remote={remote} /><p>Waktu lokal server. Jadwal lintas tengah malam belum didukung.</p>

      <div className="umkm-hours__card">
        <div className="umkm-hours__table-wrap">
          <table className="umkm-hours__table">
            <thead>
              <tr>
                <th>Hari</th>
                <th>Buka</th>
                <th>Tutup</th>
              </tr>
            </thead>

            <tbody>
              {hours.map((item, index) => {
                const isInvalid = !item.isClosed && (!item.open || !item.close || item.close <= item.open)

                return (
                  <tr key={item.day}>
                    <td>{item.day}<label><input type="checkbox" aria-label={`Tutup ${item.day}`} checked={item.isClosed} onChange={event => updateHour(index, 'isClosed', event.target.checked)} />Libur/tutup</label></td>

                    <td>
                      <input
                        type="time"
                        aria-label={`Jam buka ${item.day}`} disabled={item.isClosed} value={item.open}
                        onChange={(event) =>
                          updateHour(index, 'open', event.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="time"
                        aria-label={`Jam tutup ${item.day}`} disabled={item.isClosed} value={item.close}
                        aria-invalid={isInvalid}
                        onChange={(event) =>
                          updateHour(index, 'close', event.target.value)
                        }
                      />

                      {isInvalid && (
                        <small>Jam tutup harus setelah jam buka.</small>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <button className="admin-button" disabled={remote.busy || remote.loading} onClick={() => remote.run(() => {
        if (hours.some(item => !item.isClosed && (!item.open || !item.close || item.close <= item.open))) throw new Error('Periksa jam buka dan tutup setiap hari.')
        return saveData('/umkm/operating-hours', 'PUT', { hours: hours.map(item => ({ dayOfWeek: item.dayOfWeek, isClosed: item.isClosed, openTime: item.isClosed ? null : item.open, closeTime: item.isClosed ? null : item.close })) })
      })}>Simpan jadwal</button>
    </section>
  )
}

export default UmkmHours
