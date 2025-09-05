

import { Routes, Route, useParams } from 'react-router-dom';
import Login from './components/Auth/Login.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx';
import MainLayout from './components/Layout/MainLayout.jsx';
import RoomGrid from './components/Room/RoomGrid.jsx';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import Navbar from './components/Layout/Navbar.jsx';
import SearchAndFilters from './components/Room/SearchAndFilters.jsx';
import RoomDetail from './components/Room/RoomDetail.jsx';
import { initialRoomsData } from './data/roomsData';

function App() {
  const isAuthenticated = !!localStorage.getItem("token");
  console.log("Is authenticated:", isAuthenticated);
  // user non più necessario come prop, i componenti fanno fetch interna
  return (
    <>
      {isAuthenticated}
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Dashboard utente normale */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MainLayout>
                  <RoomGrid />
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
        {/* Compatibilità: /dashboard e /dashboard/:roomId */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Navbar />
                <MainLayout>
                  <RoomGrid />
                </MainLayout>
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/:roomId"
          element={
            <ProtectedRoute>
              <RoomDetailWrapper />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={
          <ProtectedRoute>
            <>  
                <SearchAndFilters />
                <RoomGrid />
            </>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

// Wrapper per estrarre roomId dal router e passare la stanza a RoomDetail
function RoomDetailWrapper() {
  const { roomId } = useParams();
  const room = initialRoomsData.find(r => String(r.id) === String(roomId));
  return <RoomDetail room={room} />;
}

export default App;