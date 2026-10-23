export const statusLabels = { DRAFT: 'Draft', PENDING: 'Menunggu', REVISION: 'Perlu Diperbaiki', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }
export const dateLabel = value => value ? new Date(value).toLocaleString('id-ID') : 'Belum dikirim'
export const initials = value => (value || '').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
export const applicationView = item => ({ ...item, business: item.businessName, owner: item.ownerName, submittedAt: dateLabel(item.submittedAt), status: statusLabels[item.status], rawStatus: item.status, type: item.businessType || 'Belum diisi', documents: item.storefrontPhotoUrl ? [item.storefrontPhotoUrl] : [], description: item.adminNote || '' })
export const userView = item => ({ ...item, name: item.fullName, initials: initials(item.fullName), role: { CUSTOMER: 'Customer', UMKM: 'UMKM', ADMIN: 'Admin' }[item.role], joinedAt: dateLabel(item.createdAt), status: item.status === 'SUSPENDED' ? 'Nonaktif' : item.status === 'PENDING' ? 'Menunggu' : 'Aktif' })
export const warungView = item => ({ ...item, initials: initials(item.name), owner: item.ownerEmail, location: item.address, category: item.category || 'Belum diisi', rating: item.rating == null ? '—' : Number(item.rating).toFixed(1), reviews: item.reviewCount ?? '—', status: Number(item.isActive) ? 'Aktif' : 'Nonaktif' })
export const reviewView = item => ({ ...item, name: item.customerName, initials: initials(item.customerName), warung: item.warungName, rating: Number(item.averageRating).toFixed(1), date: dateLabel(item.createdAt), status: item.status === 'VISIBLE' ? 'Ditampilkan' : 'Disembunyikan' })
export const menuView = item => ({ ...item, price: Number(item.price), status: !Number(item.isActive) ? 'nonaktif' : Number(item.isAvailable) ? 'tersedia' : 'habis' })
export const scoreKeys = { taste: 'tasteRating', price: 'priceRating', portion: 'portionRating', place: 'cleanlinessRating', comfort: 'comfortRating', service: 'speedRating' }
export const publicReviewView = (item, mine = false) => ({ ...item, name: item.customerName || 'Kamu', date: dateLabel(item.createdAt), text: item.comment || '', rating: Number(item.averageRating), isMine: mine, scores: Object.fromEntries(Object.entries(scoreKeys).map(([key, value]) => [key, Number(item[value])])) })
export const csvCell = value => {
  const text = String(value ?? '')
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}
