import { useState, useEffect } from "react";
import UserManagement from "./UserManagement";
import RoomManagement from "./RoomManagement";
import BookingManagement from "./BookingManagement";
import { getCurrentUser } from "../../services/authService";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage?.includes('token') || errorMessage?.includes('autorizzazione')) {
      return 'AUTH';
    }
    if (errorMessage?.includes('connessione') || errorMessage?.includes('rete')) {
      return 'NETWORK';
    }
    if (errorMessage?.includes('server') || errorMessage?.includes('500')) {
      return 'SERVER';
    }
    return 'GENERIC';
  };

  const getEnhancedErrorMessage = (originalError, errorType) => {
    switch (errorType) {
      case 'AUTH':
        return "Sessione scaduta. Effettua nuovamente il login.";
      case 'NETWORK':
        return "Problema di connessione. Controlla la tua connessione internet.";
      case 'SERVER':
        return "Errore del server. Riprova tra qualche momento.";
      default:
        return "Si è verificato un errore imprevisto. Riprova più tardi.";
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  // Carica i dati dell'utente corrente con retry automatico
  useEffect(() => {
    const loadCurrentUser = async () => {
      const maxRetries = 3;
      let currentRetry = 0;
      
      while (currentRetry <= maxRetries) {
        try {
          setError(null);
          const result = await getCurrentUser();
          
          if (result === null) {
            // Nessun token, utente non loggato - questo non è un errore da ritentare
            setCurrentUser(null);
            setError("Accesso richiesto. Effettua il login per continuare.");
            break;
          } else if (result.success) {
            // Login valido
            setCurrentUser(result.data);
            setError(null);
            break;
          } else {
            // Errore nel caricamento - determina se ritentare
            const errorType = categorizeError(result.error);
            
            if (isRetryableError(errorType) && currentRetry < maxRetries) {
              currentRetry++;
              setRetryAttempts(currentRetry);
              const delay = 1000 * currentRetry; // Backoff lineare
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              // Errore definitivo o troppi tentativi
              setCurrentUser(null);
              setError(getEnhancedErrorMessage(result.error, errorType));
              break;
            }
          }
        } catch (err) {
          const errorType = categorizeError(err.message);
          
          if (isRetryableError(errorType) && currentRetry < maxRetries) {
            currentRetry++;
            setRetryAttempts(currentRetry);
            const delay = 1000 * currentRetry;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            setCurrentUser(null);
            setError(getEnhancedErrorMessage(err.message, errorType));
            break;
          }
        }
      }
      
      setLoading(false);
      setRetryAttempts(0);
    };

    loadCurrentUser();
  }, []);

  // Mostra loading durante il caricamento
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-500">
            Caricamento dati utente...
            {retryAttempts > 0 && (
              <span className="block text-sm text-gray-400">
                Tentativo {retryAttempts}/3
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Mostra errore se presente
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Errore di Caricamento</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ricarica Pagina
          </button>
        </div>
      </div>
    );
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
    { id: "users", label: "Gestione Utenti" },
    { id: "rooms", label: "Gestione Stanze" },
    { id: "bookings", label: "Gestione Prenotazioni" },
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
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "users" && <UserManagement currentUser={currentUser} />}
        {activeTab === "rooms" && <RoomManagement />}
        {activeTab === "bookings" && <BookingManagement />}
      </div>
    </div>
  );
}
