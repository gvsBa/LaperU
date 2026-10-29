import { describe, expect, it } from 'vitest'
import { applicationView, menuView, publicReviewView, csvCell, userView } from '../src/services/viewModels'
import { safeNextPath } from '../src/services/authService'

describe('latest frontend API adapters', () => {
  it('keeps application raw status and maps revision reason without mock documents', () => {
    expect(applicationView({ status: 'REVISION', adminNote: 'Perbaiki alamat', businessName: 'Warung QA' })).toMatchObject({ rawStatus: 'REVISION', status: 'Perlu Diperbaiki', description: 'Perbaiki alamat', documents: [] })
  })
  it.each([[0, 1, 'nonaktif'], [1, 0, 'habis'], ['1', '1', 'tersedia']])('normalizes SQL menu flags %s %s', (isActive, isAvailable, status) => {
    expect(menuView({ isActive, isAvailable, price: '15000' })).toMatchObject({ status, price: 15000 })
  })
  it('does not present a pending user as active', () => {
    expect(userView({ role: 'UMKM', status: 'PENDING' })).toMatchObject({ role: 'UMKM', status: 'Menunggu' })
  })
  it('maps all six review dimensions to the correct UI inputs', () => {
    expect(publicReviewView({ averageRating: '3.5', tasteRating: 1, priceRating: 2, portionRating: 3, cleanlinessRating: 4, comfortRating: 5, speedRating: 6 }, true)).toMatchObject({ isMine: true, rating: 3.5, scores: { taste: 1, price: 2, portion: 3, place: 4, comfort: 5, service: 6 } })
  })
  it.each(['=1+1', ' +cmd', '@SUM(A1)', '-1+2', '\t=1'])('neutralizes CSV formula %s', value => {
    expect(csvCell(value)).toBe('"\'' + value + '"')
  })
  it('quotes CSV text without corrupting ordinary values', () => {
    expect(csvCell('Warung "A", Bandung')).toBe('"Warung ""A"", Bandung"')
  })
  it.each(['/umkm/menu', '/admin/pengajuan', '/account?tab=activity'])('allows actual protected deep links %s', path => {
    expect(safeNextPath(path)).toBe(path)
  })
  it.each(['//evil.test', '/admin/../evil', '/umkm/%2f%2fevil.test', '/admin/unknown'])('rejects unsafe or unknown deep links %s', path => {
    expect(safeNextPath(path)).toBe('/explore')
  })
})
