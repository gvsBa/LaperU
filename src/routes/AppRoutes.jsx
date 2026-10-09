import { Routes, Route } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Home from '../pages/public/Home'
import Explore from '../pages/public/Explore'
import RestaurantDetail from '../pages/public/RestaurantDetail'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      <Route path="/explore" element={<Explore />} />
      <Route path="/restaurants/:id" element={<RestaurantDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default AppRoutes