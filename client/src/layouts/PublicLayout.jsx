import { Outlet } from 'react-router-dom';
import Footer from '../components/public/Footer.jsx';
import Navbar from '../components/public/Navbar.jsx';
import StickyBookingCTA from '../components/public/StickyBookingCTA.jsx';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <Navbar />
      <Outlet />
      <Footer />
      <StickyBookingCTA />
    </div>
  );
}

export default PublicLayout;
