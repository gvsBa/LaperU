import { Outlet } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import Navbar from '../components/layout/Navbar'
import QuickSidebar from '../components/layout/QuickSidebar'

function PublicLayout() {
  return (
    <div className="public-layout">
      <TopBar />
      <Navbar />
      <QuickSidebar />
      <main className="public-content"><Outlet /></main>
    </div>
  )
}

export default PublicLayout
