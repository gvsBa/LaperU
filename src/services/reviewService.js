import { saveData } from './managementService'
export function reviewPayload(form) {
  const values = Object.fromEntries(form)
  for (const key of ['tasteRating', 'priceRating', 'portionRating', 'cleanlinessRating', 'comfortRating', 'speedRating']) values[key] = Number(values[key])
  return values
}
export const createReview = (warungId, form) => saveData('/customer/reviews', 'POST', { ...reviewPayload(form), warungId })
