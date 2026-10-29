import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage.jsx';
import AdminCustomersPage from './pages/AdminCustomersPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminGalleryPage from './pages/AdminGalleryPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminOffersPage from './pages/AdminOffersPage.jsx';
import AdminQueuePage from './pages/AdminQueuePage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import AdminServicesPage from './pages/AdminServicesPage.jsx';
import AdminStaffPage from './pages/AdminStaffPage.jsx';
import AdminWalkInsPage from './pages/AdminWalkInsPage.jsx';
import BookAppointmentPage from './pages/BookAppointmentPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import TrackBookingPage from './pages/TrackBookingPage.jsx';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="book" element={<BookAppointmentPage />} />
        <Route path="track-booking" element={<TrackBookingPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedAdminRoute />}>
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <AdminLayout>
              <AdminQueuePage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <AdminLayout>
              <AdminAppointmentsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/services"
          element={
            <AdminLayout>
              <AdminServicesPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <AdminLayout>
              <AdminStaffPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminLayout>
              <AdminCustomersPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/offers"
          element={
            <AdminLayout>
              <AdminOffersPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <AdminLayout>
              <AdminGalleryPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminLayout>
              <AdminSettingsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/walk-ins"
          element={
            <AdminLayout>
              <AdminWalkInsPage />
            </AdminLayout>
          }
        />
        <Route path="/admin/*" element={<Navigate replace to="/admin/dashboard" />} />
      </Route>
    </Routes>
  );
}

export default App;
