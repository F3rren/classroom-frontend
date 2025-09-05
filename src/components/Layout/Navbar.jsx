import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentPage }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8080/api/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log("User data:", data);
          setUser(data.user || data); // adattare a seconda della risposta
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 shadow flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <div className="text-2xl font-bold tracking-wide">Prenotazione Aule</div>
        {/* Menu di navigazione */}
        <div className="hidden md:flex space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              currentPage === 'rooms' 
                ? 'bg-blue-800 text-white' 
                : 'text-blue-100 hover:bg-blue-600 hover:text-white'
            }`}
          >
            🏢 Stanze
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
              ⚙️ Admin
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-semibold">
          {user ? `${user.nome} (${user.ruolo === "admin" ? "Admin" : "Utente"})` : ""}
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