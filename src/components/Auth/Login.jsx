import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogin as authLogin, getCurrentUser } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage.includes('troppi tentativi') || errorMessage.includes('rate limit')) {
      return 'RATE_LIMIT';
    }
    if (errorMessage.includes('connessione') || errorMessage.includes('rete')) {
      return 'NETWORK';
    }
    if (errorMessage.includes('password') || errorMessage.includes('email')) {
      return 'CREDENTIALS';
    }
    if (errorMessage.includes('server') || errorMessage.includes('500')) {
      return 'SERVER';
    }
    return 'GENERIC';
  };

  const getEnhancedErrorMessage = (originalError, errorType) => {
    switch (errorType) {
      case 'CREDENTIALS':
        return `${originalError} Assicurati che i dati siano corretti.`;
      case 'RATE_LIMIT':
        return `${originalError} Per la tua sicurezza, attendi prima di riprovare.`;
      case 'NETWORK':
        return `${originalError} Controlla la tua connessione internet.`;
      case 'SERVER':
        return `${originalError} Il problema è temporaneo, riprova tra qualche minuto.`;
      default:
        return originalError;
    }
  };

  const isRetryableError = (error) => {
    return error.name === 'TypeError' || 
           error.message.includes('fetch') ||
           error.message.includes('network');
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // 1. Validazione client-side migliorata
    if (!email.trim()) {
      setError("L'email è obbligatoria");
      setLoading(false);
      return;
    }
    
    if (!password.trim()) {
      setError("La password è obbligatoria");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri");
      setLoading(false);
      return;
    }

    // 2. Retry automatico con backoff esponenziale
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        const loginResult = await authLogin(email.trim(), password);
        
        if (loginResult.success) {
          // 3. Gestione migliorata del getCurrentUser con fallback
          try {
            const userResult = await getCurrentUser();
            
            if (userResult?.success && userResult?.data) {
              const user = userResult.data;
              
              // Redirect intelligente basato sul ruolo
              const redirectPath = user.ruolo === 'admin' 
                ? '/dashboard/adminpanel' 
                : '/dashboard/user';
              
              navigate(redirectPath, { replace: true });
              return;
            } else {
              // Fallback: vai alla home ma avvisa l'utente
              navigate('/', { 
                replace: true,
                state: { 
                  message: "Login effettuato, ma alcuni dati potrebbero non essere disponibili" 
                }
              });
              return;
            }
          } catch {
            // Se getCurrentUser fallisce, vai comunque alla home
            navigate('/', { 
              replace: true,
              state: { 
                message: "Login effettuato con successo" 
              }
            });
            return;
          }
        } else {
          // 4. Categorizzazione degli errori
          const errorType = categorizeError(loginResult.error);
          
          if (errorType === 'RATE_LIMIT' && retryCount < maxRetries) {
            // Per rate limiting, riprova dopo un delay
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Backoff esponenziale
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else if (errorType === 'NETWORK' && retryCount < maxRetries) {
            // Per errori di rete, riprova
            retryCount++;
            const delay = 1000 * retryCount;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            // Errore definitivo o troppi tentativi
            setError(getEnhancedErrorMessage(loginResult.error, errorType));
            break;
          }
        }
      } catch (error) {
        if (retryCount < maxRetries && isRetryableError(error)) {
          retryCount++;
          const delay = 1000 * retryCount;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          setError("Si è verificato un errore imprevisto. Riprova più tardi.");
          break;
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Messaggio di errore a livello di pagina */}
  
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">SP</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Benvenuto
          </h2>
          <p className="text-gray-600">Sistema di Gestione</p>
        </div>
        
        {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg w-full max-w-md text-center">
          <span className="text-red-700 font-semibold">{error}</span>
        </div>
      )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Inserisci il tuo username"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 bg-gray-50 hover:bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci la tua password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transform transition duration-200 shadow-lg ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Accesso in corso...
              </div>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
