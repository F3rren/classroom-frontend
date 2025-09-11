import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userResult = await getCurrentUser();
      if (userResult && userResult.success) {
        setUser(userResult.data);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Benvenuto{user?.nome ? `, ${user.nome}` : ''}!
        </h1>
        <p className="text-gray-600">Dashboard Utente - Sistema di Gestione</p>
      </div>

      {/* Card informazioni utente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Le tue informazioni
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Nome:</span>
              <span className="text-gray-900">{user?.nome || 'Non disponibile'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Email:</span>
              <span className="text-gray-900">{user?.email || 'Non disponibile'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium text-gray-700">Ruolo:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                user?.ruolo === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.ruolo === 'admin' ? 'Amministratore' : 'Utente'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Attività recenti
          </h3>
          
          <div className="text-center py-8">
            <div className="bg-gray-100 w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2">
              <span className="text-lg font-bold text-gray-400">---</span>
            </div>
            <p className="text-gray-500">Nessuna attività recente</p>
            <p className="text-sm text-gray-400 mt-1">Le tue attività appariranno qui</p>
          </div>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Azioni rapide
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/bookings'}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="font-medium text-gray-900 mb-1">🏢 Prenota Stanze</div>
            <div className="text-sm text-gray-500">Cerca e prenota le stanze disponibili</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="font-medium text-gray-900 mb-1">👤 Profilo</div>
            <div className="text-sm text-gray-500">Modifica le tue informazioni</div>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="font-medium text-gray-900 mb-1">❓ Aiuto</div>
            <div className="text-sm text-gray-500">Guida e supporto</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
