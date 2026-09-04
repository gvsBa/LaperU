import { useParams } from 'react-router-dom'

function RestaurantDetail() {
  const { id } = useParams()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Detail Warung
      </h1>

      <p>ID Warung: {id}</p>
    </div>
  )
}

export default RestaurantDetail