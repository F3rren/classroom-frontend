import { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import RoomManagement from "./RoomManagement";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log("Active Tab:", activeTab);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token mancante. Effettua il login.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user || data);
        } else {
          setError("Accesso negato o token scaduto.");
        }
      } catch {
        setError("Errore di rete. Riprova.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
export const initialUsersData = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log(data)
      if (!response.ok) {
        setError(data.error || "Errore generico");
      } else {
        setError(null);
        // Salva il token e le info utente se presenti
        if (data.token) {
          localStorage.setItem("token", data.token);
          document.cookie = `token=${data.token}; path=/;`;
          navigate('/dashboard/')
        }
      }
    } catch (err) {
      setError("Errore di rete");
      setResult(null);
    }
  };

  // Mostra loading durante il caricamento
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Caricamento dati utente...</div>;
  }

  // Mostra errore se c'è un problema
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Errore</h3>
          <p className="text-yellow-600">{error}</p>
        </div>
      </div>
    );
  }

  // Controlla se l'utente è admin
  if (!currentUser || currentUser.ruolo !== "admin") {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Accesso Negato</h3>
          <p className="text-red-600">Solo gli amministratori possono accedere a questa sezione.</p>
        </div>
      </div>
    );
  }


  const tabs = [
    { id: "users", label: "Gestione Utenti", icon: "👥" },
    { id: "rooms", label: "Gestione Stanze", icon: "🏢" },
    { id: "bookings", label: "Tutte le Prenotazioni", icon: "📅" }
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "users" && <UserManagement currentUser={currentUser} />}
        {activeTab === "rooms" && <RoomManagement currentUser={currentUser} />}
        {activeTab === "bookings" && (
          <div className="text-center py-8 text-gray-500">
            <h3 className="text-lg font-semibold mb-2">Tutte le Prenotazioni</h3>
            <p>Funzionalità in sviluppo...</p>
          </div>
        )}
      </div>
    </div>
  );
}
