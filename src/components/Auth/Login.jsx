import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogin as authLogin, getCurrentUser } from "../../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const loginResult = await authLogin(email, password);
      
      if (loginResult.success) {
        // Dopo il login, ottieni i dati dell'utente per il redirect appropriato
        const userResult = await getCurrentUser();
        
        if (userResult && userResult.success) {
          const user = userResult.data;
          
          // Redirect basato sul ruolo
          if (user.ruolo === 'admin') {
            navigate('/dashboard/adminpanel');
          } else {
            navigate('/dashboard/user');
          }
        } else {
          // Se non riesco a ottenere i dati utente, vai alla home
          navigate('/');
        }
      } else {
        setError(loginResult.error);
      }
    } catch (err) {
      console.error('Errore durante il login:', err);
      setError('Errore durante il login. Riprova.');
    } finally {
      setLoading(false);
    }
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
