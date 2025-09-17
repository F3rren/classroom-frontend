import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../services/authService";

export default function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage?.includes('token') || errorMessage?.includes('autorizzazione')) {
      return 'AUTH';
    }
    if (errorMessage?.includes('connessione') || errorMessage?.includes('rete') || errorMessage?.includes('fetch')) {
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
        return "Sessione scaduta. Verrai reindirizzato al login.";
      case 'NETWORK':
        return "Problema di connessione. Controlla la tua connessione internet.";
      case 'SERVER':
        return "Errore del server. Riprova tra qualche momento.";
      default:
        return originalError || "Si è verificato un errore nella validazione dell'accesso.";
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  useEffect(() => {
    const validateToken = async () => {
      const maxRetries = 3;
      let currentRetry = 0;
      
      setIsValidating(true);
      setError(null);

      // Prima verifica rapida del token locale
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Verifica del token lato client (parsing JWT)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          // Token scaduto localmente
          localStorage.removeItem("token");
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }
      } catch {
        // Token malformato localmente
        localStorage.removeItem("token");
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      // Validazione con il server (più sicura)
      while (currentRetry <= maxRetries) {
        try {
          setError(null);
          
          const userResult = await getCurrentUser();
          
          if (userResult === null) {
            // Nessun token o token non valido
            setIsAuthenticated(false);
            break;
          } else if (userResult.success) {
            // Token valido e utente autenticato
            setIsAuthenticated(true);
            break;
          } else {
            // Errore nella validazione
            const errorType = categorizeError(userResult.error);
            
            if (isRetryableError(errorType) && currentRetry < maxRetries) {
              currentRetry++;
              setRetryAttempts(currentRetry);
              const delay = 1000 * currentRetry; // Backoff lineare
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              // Errore non recuperabile o troppi tentativi
              setError(getEnhancedErrorMessage(userResult.error, errorType));
              
              if (errorType === 'AUTH') {
                // Per errori di autenticazione, considera non autenticato
                setIsAuthenticated(false);
              } else {
                // Per altri errori, assumi autenticato se il token locale sembra valido
                setIsAuthenticated(true);
              }
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
            setError(getEnhancedErrorMessage(err.message, errorType));
            
            // In caso di errore di rete, assumi autenticato se token locale sembra valido
            setIsAuthenticated(true);
            break;
          }
        }
      }
      
      setIsValidating(false);
      setRetryAttempts(0);
    };

    validateToken();
  }, []);

  const retryValidation = () => {
    setIsValidating(true);
    setError(null);
    setRetryAttempts(0);
    
    // Re-run validation
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        const userResult = await getCurrentUser();
        
        if (userResult === null) {
          setIsAuthenticated(false);
        } else if (userResult.success) {
          setIsAuthenticated(true);
          setError(null);
        } else {
          const errorType = categorizeError(userResult.error);
          setError(getEnhancedErrorMessage(userResult.error, errorType));
          setIsAuthenticated(errorType !== 'AUTH');
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        setError(getEnhancedErrorMessage(err.message, errorType));
        setIsAuthenticated(true); // Fallback per errori di rete
      } finally {
        setIsValidating(false);
      }
    };
    
    validateToken();
  };

  if (isValidating) {
    // Mostra loading durante la validazione
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-gray-600">
                <p className="text-lg font-medium">Validazione accesso...</p>
                {retryAttempts > 0 && (
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

  // Mostra errore se c'è un problema ma l'utente potrebbe essere ancora autenticato
  if (error && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
            <div className="flex items-start">
              <div className="text-yellow-600 text-xl mr-3">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 mb-2">Avviso</h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                <button
                  onClick={retryValidation}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors mr-2"
                >
                  Riprova validazione
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-yellow-600 px-4 py-2 rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors"
                >
                  Continua comunque
                </button>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
    );
  }

  // Mostra errore critico se l'utente non è autenticato
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesso Negato</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={retryValidation}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Riprova
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full text-blue-600 px-4 py-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
              >
                Vai al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
