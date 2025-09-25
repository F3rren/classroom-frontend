import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, handleLogout } from "../../services/authService";

export default function Navbar({ currentPage }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getCurrentUser();
      
      if (result === null) {
        // Nessun token, utente non loggato
        
        setUser(null);
      } else if (result.success) {
        // Login valido, estrai i dati utente
        setUser(result.data);
      } else {
        // Errore nel caricamento
        
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <div className="text-2xl font-bold tracking-wide">Sistema di Gestione</div>
        {/* Menu di navigazione */}
        <div className="hidden md:flex space-x-4">
          <button
            onClick={() => navigate('/dashboard/user')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              currentPage === 'user' 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
          >
            <span className="font-semibold">
              Dashboard
            </span>
          </button>
          
          <button
            onClick={() => navigate('/bookings')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              currentPage === 'bookings' 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
          >
            <span className="font-semibold">
              Prenotazioni
            </span>
          </button>
          
          {user && user.ruolo === 'admin' && (
            <button
              onClick={() => navigate('/dashboard/adminpanel')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                currentPage === 'admin' 
                  ? 'bg-blue-800 text-white' 
                  : 'text-blue-100 hover:bg-blue-600 hover:text-white'
              }`}
            >
            <span className="font-semibold">
              Pannello Admin
            </span>
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-semibold">
          {user ? `${user.nome || user.name || user.username || 'Utente'} (${user.ruolo === "admin" ? "Admin" : "Utente"})` : ""}
        </span>
        <button
          className="bg-white text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition font-semibold"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}