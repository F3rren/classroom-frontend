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
      const userResult = await getCurrentUser();
      if (userResult && userResult.success) {
        setUser(userResult.data);
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
  console.log("Is authenticated:", isAuthenticated);
  
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
        
        {/* Home page - Redirect appropriato */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <ProtectedRoute>
                <>
                  <Navbar />
                  <MainLayout>
                    <div className="p-6">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Sistema di Gestione</h1>
                        <p className="text-xl text-gray-600 mb-8">Benvenuto nel sistema</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                          <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Area Utente</h3>
                            <p className="text-gray-600 mb-4">Accedi alla tua dashboard personale</p>
                            <button 
                              onClick={() => window.location.href = '/dashboard/user'}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                              Vai alla Dashboard
                            </button>
                          </div>
                          
                          <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Amministrazione</h3>
                            <p className="text-gray-600 mb-4">Gestisci utenti e configurazioni</p>
                            <button 
                              onClick={() => window.location.href = '/dashboard/adminpanel'}
                              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                            >
                              Pannello Admin
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </MainLayout>
                </>
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
