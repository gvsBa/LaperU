const reviews = [
  {
    id: 1,
    user: 'Iyse',
    rating: 5,
    text: 'Tempatnya nyaman dan bersih',
  },
  {
    id: 2,
    user: 'Manoj',
    rating: 5,
    text: 'Menu nya banyak',
  },
  {
    id: 3,
    user: 'Kakut',
    rating: 4,
    text: 'Tempatnya bisa di perluas',
  },
]

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
  return (
    <section className="umkm-reviews">
      <h1>Kelola Ulasan</h1>

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
                  <td>{review.text}</td>
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