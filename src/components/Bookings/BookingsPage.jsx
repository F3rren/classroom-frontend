import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import RoomsList from './RoomsList';
import MyBookings from './MyBookings';
import WeeklyCalendar from './WeeklyCalendar';

// Funzioni per la gestione intelligente degli errori
const categorizeError = (error) => {
  const errorMessage = error?.message || error || '';
  
  if (errorMessage.includes('token') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return 'AUTH';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return 'NETWORK';
  }
  if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('503')) {
    return 'SERVER';
  }
  return 'GENERIC';
};

const getEnhancedErrorMessage = (error, category) => {
  const baseMessage = error?.message || error || 'Errore sconosciuto';
  
  switch (category) {
    case 'AUTH':
      return 'Sessione scaduta. Effettua nuovamente il login per accedere alle prenotazioni.';
    case 'NETWORK':
      return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    case 'SERVER':
      return 'Il server è temporaneamente non disponibile. Riprova tra qualche momento.';
    default:
      return `Errore nel caricamento dell'applicazione: ${baseMessage}`;
  }
};

const isRetryableError = (category) => {
  return ['NETWORK', 'SERVER'].includes(category);
};

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError(null);
      setRetryAttempts(0);
      setIsRetrying(false);

      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          if (attempts > 0) {
            setIsRetrying(true);
            setRetryAttempts(attempts);
          }

          const userResult = await getCurrentUser();
          
          if (userResult === null) {
            // Utente non autenticato - non è un errore, redirect sarà gestito da ProtectedRoute
            setLoading(false);
            setIsRetrying(false);
            return;
          }
          
          if (userResult && userResult.success) {
            // Utente caricato con successo
            setError(null);
            setLoading(false);
            setIsRetrying(false);
            setRetryAttempts(0);
            return;
          } else {
            const errorType = categorizeError(userResult?.error);
            const enhancedMessage = getEnhancedErrorMessage(userResult?.error, errorType);
            
            if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
              continue;
            } else {
              setError(enhancedMessage);
              break;
            }
          }
        } catch (err) {
          const errorType = categorizeError(err.message);
          const enhancedMessage = getEnhancedErrorMessage(err.message, errorType);
          
          if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            setError(enhancedMessage);
            break;
          }
        }
      }
      
      setLoading(false);
      setIsRetrying(false);
      setRetryAttempts(0);
    };

    loadUser();
  }, []);

  const retryLoadUser = () => {
    setError(null);
    const loadUser = async () => {
      // Il codice sarà gestito dal useEffect
      setLoading(true);
      setError(null);
      setRetryAttempts(0);
      setIsRetrying(false);
      
      // Trigger re-run useEffect
      try {
        const userResult = await getCurrentUser();
        if (userResult === null) {
          setLoading(false);
          return;
        }
        if (userResult && userResult.success) {
          setError(null);
        } else {
          const errorType = categorizeError(userResult?.error);
          const enhancedMessage = getEnhancedErrorMessage(userResult?.error, errorType);
          setError(enhancedMessage);
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        const enhancedMessage = getEnhancedErrorMessage(err.message, errorType);
        setError(enhancedMessage);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-gray-600">
                <p className="text-lg font-medium">Caricamento applicazione...</p>
                {isRetrying && retryAttempts > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Tentativo {retryAttempts}/3
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostra errore se c'è un problema nel caricamento
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Errore di Caricamento</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={retryLoadUser}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={() => setError(null)}
                className="w-full text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
              >
                Continua comunque
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'calendar', 
      label: 'Calendario Virtuale', 
      description: 'Vista calendario per prenotazioni rapide'
    },
    { 
      id: 'rooms', 
      label: 'Calendario Aule fisiche', 
      description: 'Visualizza e prenota le stanze disponibili'
    },
    { 
      id: 'mybookings', 
      label: 'Le mie prenotazioni', 
      description: 'Gestisci le tue prenotazioni'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'calendar' && <WeeklyCalendar />}
        {activeTab === 'rooms' && <RoomsList />}
        {activeTab === 'mybookings' && <MyBookings />}
      </div>
    </div>
  );
};

export default BookingsPage;
