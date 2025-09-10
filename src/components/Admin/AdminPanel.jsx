import { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import RoomManagement from "./RoomManagement";
import { getCurrentUser } from "../../services/authService";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carica i dati dell'utente corrente
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const result = await getCurrentUser();
        
        if (result === null) {
          // Nessun token, utente non loggato
          setCurrentUser(null);
        } else if (result.success) {
          // Login valido
          setCurrentUser(result.data);
        } else {
          // Errore nel caricamento
          console.error("Errore caricamento utente:", result.error);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Errore imprevisto caricamento utente:", err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Mostra loading durante il caricamento
  if (loading) {
    return <div className="text-center py-8 text-gray-500">Caricamento dati utente...</div>;
  }

  // Controlla se l'utente è admin (solo se è stato caricato)
  if (currentUser && currentUser.ruolo !== "admin") {
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
    { id: "rooms", label: "Gestione Stanze", icon: "🏠" },
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
        {activeTab === "rooms" && <RoomManagement />}
      </div>
    </div>
  );
}
