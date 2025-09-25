import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './components/Auth/Login.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import MainLayout from './components/Layout/MainLayout.jsx';
import UserDashboard from './components/Layout/UserDashboard.jsx';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import BookingsPage from './components/Bookings/BookingsPage.jsx';
import Navbar from './components/Layout/Navbar.jsx';
import { getCurrentUser } from './services/authService.js';

// Componente per redirect intelligente
function DashboardRedirect() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userResult = await getCurrentUser();
        if (userResult && userResult.success) {
          setUser(userResult.data);
        } else {
          // Se fallisce il caricamento dell'utente, redirect al login
          localStorage.removeItem("token");
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        // Errore nel caricamento, redirect al login
        localStorage.removeItem("token");
        window.location.href = '/login';
        return;
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user?.ruolo === 'admin') {
    window.location.href = '/dashboard/adminpanel';
    return null;
  } else {
    window.location.href = '/dashboard/user';
    return null;
  }
}

function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  
  
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Redirect intelligente per /dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard utente normale */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MainLayout>
                  <UserDashboard />
                </MainLayout>
              </>
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard admin */}
        <Route
          path="/dashboard/adminpanel"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MainLayout>
                  <AdminPanel />
                </MainLayout>
              </>
            </ProtectedRoute>
          }
        />
        
        {/* Sezione Prenotazioni */}
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <BookingsPage />
              </>
            </ProtectedRoute>
          }
        />
        
        {/* Home page - Redirect sempre alla dashboard o login */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            ) : (
              <Login />
            )
          } 
        />
        
        {/* Catch-all route - redirect a login se non autenticato, altrimenti alla dashboard */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            ) : (
              <Login />
            )
          } 
        />
      </Routes>
    </>
  );
}

export default App;
