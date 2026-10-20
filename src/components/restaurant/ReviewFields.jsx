const ratings = { tasteRating: 'Rasa', priceRating: 'Harga', portionRating: 'Porsi', cleanlinessRating: 'Kebersihan', comfortRating: 'Kenyamanan', speedRating: 'Kecepatan' }
export default function ReviewFields({ review = {} }) {
  return <><div className="rating-fields">{Object.entries(ratings).map(([key, label]) => <label key={key}>{label}<select aria-label={label} name={key} defaultValue={review[key] || ''} required><option value="" disabled>Pilih nilai</option>{[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>)}</div><label>Komentar<textarea aria-label="Komentar" name="comment" maxLength={1500} defaultValue={review.comment || ''} /></label></>
}
