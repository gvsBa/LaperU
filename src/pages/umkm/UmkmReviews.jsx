import { useRemote } from '../../services/useRemote'
import { privateApi, saveData } from '../../services/managementService'
import RemoteStatus from '../../components/common/RemoteStatus'
const loadReviews = async signal => (await privateApi('/umkm/reviews', { signal })).map(item => ({ ...item, user: item.customerName, rating: Number(item.averageRating), text: item.comment || '' }))

function StarRating({ rating }) {
  return (
    <span className="umkm-reviews__stars" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'is-filled' : ''}>
          ★
        </span>
      ))}
    </span>
  )
}

function UmkmReviews() {
  const remote = useRemote(loadReviews, [])
  const reviews = remote.data
  return (
    <section className="umkm-reviews">
      <h1>Kelola Ulasan</h1><RemoteStatus remote={remote} />

      <div className="umkm-reviews__card">
        <div className="umkm-reviews__table-wrap">
          <table className="umkm-reviews__table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Rating</th>
                <th>Ulasan</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.user}</td>
                  <td>
                    <StarRating rating={review.rating} />
                  </td>
                  <td>{review.text}<form onSubmit={event => { event.preventDefault(); const reply = new FormData(event.currentTarget).get('reply'); remote.run(() => saveData(`/umkm/reviews/${review.id}/reply`, 'PUT', { reply })) }}><label>Balasan untuk {review.user}<textarea name="reply" required maxLength={1500} defaultValue={review.reply || ''} /></label><button disabled={remote.busy}>Simpan balasan</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default UmkmReviews
