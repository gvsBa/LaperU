import restaurants from '../mocks/restaurants'

const USE_MOCK_DATA = true

export async function getFeaturedRestaurants() {
  if (USE_MOCK_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    return restaurants
  }

  throw new Error('API restoran belum dikonfigurasi')
}
