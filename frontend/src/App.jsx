import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/Chat';
import ChatRoomsPage from './pages/ChatRooms';
import LoginPage from './pages/Login';
import CustomRequestPage from './pages/CustomRequest';
import InvoicesPage from './pages/Invoices';
import AgencyDashboard from './pages/AgencyDashboard';
import HotelDashboard from './pages/HotelDashboard';
import AdminDashboardPage from './pages/AdminDashboard';
import PaymentSuccessPage from './pages/PaymentSuccess';
import PaymentFailedPage from './pages/PaymentFailed';
import HotelResultsPage from './pages/HotelResults';
import HotelDetailsPage from './pages/HotelDetails';
import { api } from './services/api';
import HotelProfile from './pages/HotelProfile';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const defaultPath = useMemo(() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'provider') {
      const pType = (user?.providerType || '').toUpperCase();
      if (pType === 'AGENCY') return '/provider/agency';
      if (pType === 'HOTEL') return '/provider/hotel';
      return '/traveler';
    }
    return '/traveler';
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.me();
        if (res?.success) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onLoginSuccess={(u) => {
          setUser(u);
          try {
            localStorage.setItem('user', JSON.stringify(u));
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return (
    <Router>
      <Layout
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      >
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Navigate to={defaultPath} replace />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminDashboardPage onLogout={handleLogout} />} />

          {/* Hotel profile */}
          <Route path="/provider/hotel/profile" element={<HotelProfile />} />

          {/* Traveler */}
          <Route path="/traveler" element={<Dashboard />} />
          <Route path="/hotels" element={<HotelResultsPage />} />
          <Route path="/hotels/:id" element={<HotelDetailsPage />} />
          <Route path="/custom-request" element={<CustomRequestPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/chat" element={<ChatRoomsPage />} />
          <Route path="/chat/:packageId" element={<ChatPage />} />

          {/* Provider */}
          <Route path="/provider/agency" element={<AgencyDashboard />} />
          <Route path="/provider/hotel" element={<HotelDashboard />} />

          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
