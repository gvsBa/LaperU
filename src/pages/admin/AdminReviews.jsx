import { useMemo, useState } from 'react'

const initialReviews = [
  {
    id: 1,
    name: 'Aldi Pratama',
    initials: 'AP',
    warung: 'Warung Nasi Bu Euis',
    rating: 5,
    comment: 'Makanannya enak, porsinya banyak, dan harganya cocok buat mahasiswa.',
    date: '21 Oktober 2026',
    status: 'Ditampilkan',
  },
  {
    id: 2,
    name: 'Rani Aulia',
    initials: 'RA',
    warung: 'Mie Pedas Teh Rani',
    rating: 4,
    comment: 'Rasanya enak, tapi waktu tunggunya cukup lama saat jam makan siang.',
    date: '20 Oktober 2026',
    status: 'Menunggu',
  },
  {
    id: 3,
    name: 'Bima Saputra',
    initials: 'BS',
    warung: 'Ayam Bakar 99',
    rating: 5,
    comment: 'Sambalnya mantap dan ayamnya masih hangat waktu datang.',
    date: '19 Oktober 2026',
    status: 'Ditampilkan',
  },
  {
    id: 4,
    name: 'Nadia Putri',
    initials: 'NP',
    warung: 'Bakso Mas Joko',
    rating: 2,
    comment: 'Pesanan saya kurang sesuai dan tempatnya cukup ramai.',
    date: '18 Oktober 2026',
    status: 'Menunggu',
  },
]

const filters = ['Semua', 'Ditampilkan', 'Menunggu', 'Disembunyikan']

function AdminReviews() {
  const [reviews, setReviews] = useState(initialReviews)
  const [keyword, setKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [openMenuId, setOpenMenuId] = useState(null)

  const filteredReviews = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return reviews.filter((review) => {
      const filterMatches =
        activeFilter === 'Semua' || review.status === activeFilter

      const searchMatches =
        !search ||
        `${review.name} ${review.warung} ${review.comment}`
          .toLowerCase()
          .includes(search)

      return filterMatches && searchMatches
    })
  }, [reviews, keyword, activeFilter])

  const stats = {
    total: reviews.length,
    visible: reviews.filter((review) => review.status === 'Ditampilkan').length,
    pending: reviews.filter((review) => review.status === 'Menunggu').length,
    hidden: reviews.filter((review) => review.status === 'Disembunyikan').length,
  }

  function updateStatus(id, status) {
    setReviews((current) =>
      current.map((review) =>
        review.id === id ? { ...review, status } : review,
      ),
    )
    setOpenMenuId(null)
  }

  return (
    <section className="admin-reviews">
      <div className="admin-page-heading">
        <div>
          <h1>Ulasan & Laporan</h1>
          <p>Moderasi ulasan pengguna sebelum ditampilkan di halaman warung.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-red">★</span>
          <div>
            <span>Total Ulasan</span>
            <strong>{stats.total}</strong>
            <small>Seluruh ulasan masuk</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-green">✓</span>
          <div>
            <span>Ditampilkan</span>
            <strong>{stats.visible}</strong>
            <small>Sudah tampil untuk publik</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-yellow">!</span>
          <div>
            <span>Menunggu Moderasi</span>
            <strong>{stats.pending}</strong>
            <small>Butuh keputusan Admin</small>
          </div>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__icon is-blue">◉</span>
          <div>
            <span>Disembunyikan</span>
            <strong>{stats.hidden}</strong>
            <small>Tidak tampil ke publik</small>
          </div>
        </article>
      </div>

      <div className="admin-reviews__toolbar">
        <div className="admin-search">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari ulasan, pengguna, atau warung..."
            aria-label="Cari ulasan"
          />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        </div>

        <div className="admin-warungs__filters">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeFilter === filter ? 'is-active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-dashboard__card">
        <div className="admin-dashboard__table-wrap">
          <table className="admin-reviews__table">
            <thead>
              <tr>
                <th>Ulasan</th>
                <th>Warung</th>
                <th>Rating</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="admin-review-user">
                      <span>{review.initials}</span>
                      <div>
                        <strong>{review.name}</strong>
                        <p>{review.comment}</p>
                      </div>
                    </div>
                  </td>
                  <td>{review.warung}</td>
                  <td>
                    <span className="admin-review-rating">
                      ★ {review.rating}.0
                    </span>
                  </td>
                  <td>{review.date}</td>
                  <td>
                    <span
                      className={`admin-status is-${review.status
                        .toLowerCase()
                        .replaceAll(' ', '-')}`}
                    >
                      {review.status}
                    </span>
                  </td>
                  <td className="admin-warung-actions">
                    <button
                      type="button"
                      className="admin-dots-button"
                      aria-label={`Aksi ulasan ${review.name}`}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === review.id ? null : review.id,
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === review.id && (
                      <div className="admin-action-menu">
                        <button
                          type="button"
                          onClick={() => updateStatus(review.id, 'Ditampilkan')}
                        >
                          Tampilkan ulasan
                        </button>

                        <button
                          type="button"
                          onClick={() => updateStatus(review.id, 'Disembunyikan')}
                        >
                          Sembunyikan ulasan
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            alert('Fitur laporan akan dihubungkan ke backend nanti.')
                            setOpenMenuId(null)
                          }}
                        >
                          Lihat laporan
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-dashboard__empty">
                    Ulasan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default AdminReviews