import { useState } from 'react'

const initialHours = [
  { day: 'Senin', open: '08:00', close: '21:00' },
  { day: 'Selasa', open: '08:00', close: '21:00' },
  { day: 'Rabu', open: '08:00', close: '21:00' },
  { day: 'Kamis', open: '08:00', close: '21:00' },
  { day: 'Jumat', open: '08:00', close: '21:00' },
  { day: 'Sabtu', open: '08:00', close: '21:00' },
  { day: 'Minggu', open: '08:00', close: '21:00' },
]

function UmkmHours() {
  const [hours, setHours] = useState(initialHours)

  function updateHour(index, field, value) {
    setHours((currentHours) =>
      currentHours.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  return (
    <section className="umkm-hours">
      <h1>jam Operasional</h1>

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
                const isInvalid = item.close <= item.open

                return (
                  <tr key={item.day}>
                    <td>{item.day}</td>

                    <td>
                      <input
                        type="time"
                        value={item.open}
                        onChange={(event) =>
                          updateHour(index, 'open', event.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="time"
                        value={item.close}
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
    </section>
  )
}

export default UmkmHours