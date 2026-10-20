import { Routes, Route, Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import Home from '../pages/public/Home'
import Explore from '../pages/public/Explore'
import RestaurantDetail from '../pages/public/RestaurantDetail'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Account from '../pages/auth/Account'
import Favorites from '../pages/public/Favorites'
import UmkmDashboard from '../pages/management/UmkmDashboard'
import AdminDashboard from '../pages/management/AdminDashboard'
import CustomerReviews from '../pages/management/CustomerReviews'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="*" element={<section className="empty-state"><h1>Halaman tidak ditemukan</h1><p>Alamat yang kamu buka tidak tersedia.</p><Link className="button button--dark" to="/explore">Jelajahi warung</Link></section>} />
      </Route>
      <Route path="/explore" element={<Explore />} />
      <Route path="/restaurants/:slug" element={<RestaurantDetail />} />
      <Route path="/umkm" element={<UmkmDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/reviews" element={<CustomerReviews />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
    </Routes>
  )
}

export default AppRoutes
