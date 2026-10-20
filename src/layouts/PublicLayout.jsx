import { Outlet } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Navbar from '../components/layout/Navbar'
import QuickSidebar from '../components/layout/QuickSidebar'
import SiteFooter from '../components/layout/SiteFooter'
function PublicLayout() {
  return (
    <div className="public-layout">
      <TopBar />
      <Navbar />
      <QuickSidebar />
      <main className="public-content"><Outlet /></main>
      <SiteFooter />
    </div>
  )
}

export default PublicLayout
