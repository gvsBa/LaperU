import { Routes, Route } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import Home from "../pages/public/Home";
import Explore from "../pages/public/Explore";
import RestaurantDetail from "../pages/public/RestaurantDetail";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Account from "../pages/auth/Account";
import UmkmLayout from "../components/umkm/UmkmLayout";
import UmkmDashboard from "../pages/umkm/UmkmDashboard";
import UmkmSubmission from "../pages/umkm/UmkmSubmission";
import UmkmProfile from "../pages/umkm/UmkmProfile";
import UmkmMenu from "../pages/umkm/UmkmMenu";
import UmkmHours from "../pages/umkm/UmkmHours";
import UmkmReviews from "../pages/umkm/UmkmReviews";
import UmkmPhotos from "../pages/umkm/UmkmPhotos";
import UmkmPending from "../pages/umkm/UmkmPending";
import UmkmAccount from "../pages/umkm/UmkmAccount";
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminSubmissions from "../pages/admin/AdminSubmissions";
import AdminWarungs from '../pages/admin/AdminWarungs'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminReviews from '../pages/admin/AdminReviews'
import AdminMasterData from '../pages/admin/AdminMasterData'
import AdminAuditLog from '../pages/admin/AdminAuditLog'

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
      <Route path="/account" element={<Account />} />
      <Route path="/umkm/menunggu-verifikasi" element={<UmkmPending />} />
      <Route path="/umkm" element={<UmkmLayout />}>
        <Route index element={<UmkmDashboard />} />
        <Route path="pengajuan" element={<UmkmSubmission />} />
        <Route path="profil-warung" element={<UmkmProfile />} />
        <Route path="menu" element={<UmkmMenu />} />
        <Route path="jam-operasional" element={<UmkmHours />} />
        <Route path="ulasan" element={<UmkmReviews />} />
        <Route path="foto" element={<UmkmPhotos />} />
        <Route path="akun" element={<UmkmAccount />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="pengajuan" element={<AdminSubmissions />} />
        <Route path="warung" element={<AdminWarungs />} />
        <Route path="pengguna" element={<AdminUsers />} />
        <Route path="ulasan-laporan" element={<AdminReviews />} />
        <Route path="master-data" element={<AdminMasterData />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
