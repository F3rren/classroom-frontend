import { useState, useEffect } from "react";
import UserCard from "./UserCard";
import UserModal from "./UserModal";
import { getUsersList, createUser, updateUser, deleteUser } from "../../services/adminService";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage?.includes('autorizzazione') || errorMessage?.includes('token') || errorMessage?.includes('permessi')) {
      return 'AUTH';
    }
    if (errorMessage?.includes('connessione') || errorMessage?.includes('rete') || errorMessage?.includes('fetch')) {
      return 'NETWORK';
    }
    if (errorMessage?.includes('server') || errorMessage?.includes('500')) {
      return 'SERVER';
    }
    if (errorMessage?.includes('duplicato') || errorMessage?.includes('esiste già') || errorMessage?.includes('email')) {
      return 'DUPLICATE';
    }
    if (errorMessage?.includes('validazione') || errorMessage?.includes('campo')) {
      return 'VALIDATION';
    }
    return 'GENERIC';
  };

  const getEnhancedErrorMessage = (originalError, errorType, operation = '') => {
    switch (errorType) {
      case 'AUTH':
        return "Sessione scaduta o permessi insufficienti. Effettua nuovamente il login.";
      case 'NETWORK':
        return "Problema di connessione. Controlla la tua connessione internet e riprova.";
      case 'SERVER':
        return "Errore del server. Il problema è temporaneo, riprova tra qualche momento.";
      case 'DUPLICATE':
        return "Esiste già un utente con questa email. Usa un'email diversa.";
      case 'VALIDATION':
        return originalError || "I dati inseriti non sono validi. Controlla i campi e riprova.";
      default:
        return originalError || `Si è verificato un errore ${operation}. Riprova più tardi.`;
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  // Carica gli utenti al mount del componente
  useEffect(() => {
    const loadUsers = async () => {
      const maxRetries = 3;
      let currentRetry = 0;
      
      setLoading(true);
      
      while (currentRetry <= maxRetries) {
        try {
          setError(null);
          
          const result = await getUsersList();
          
          if (result.success) {
            // Assicuriamoci che result.data sia un array
            const usersData = Array.isArray(result.data) ? result.data : [];
            
            setUsers(usersData);
            setError(null);
            break;
          } else {
            const errorType = categorizeError(result.error);
            
            if (isRetryableError(errorType) && currentRetry < maxRetries) {
              currentRetry++;
              setRetryAttempts(currentRetry);
              const delay = 1000 * currentRetry; // Backoff lineare
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              setError(getEnhancedErrorMessage(result.error, errorType, 'nel caricamento degli utenti'));
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
            setError(getEnhancedErrorMessage(err.message, errorType, 'nel caricamento degli utenti'));
            break;
          }
        }
      }
      
      setLoading(false);
      setRetryAttempts(0);
    };

    loadUsers();
  }, []);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setShowModal(true);
    setError(null); // Reset dell'errore
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setShowModal(true);
    setError(null); // Reset dell'errore
  };

  const handleDeleteUser = (user) => {
    setShowDeleteConfirm(user);
  };

  const confirmDeleteUser = async () => {
    if (showDeleteConfirm) {
      try {
        const result = await deleteUser(showDeleteConfirm.id);
        if (result.success) {
          // Filtra solo se users è un array
          if (Array.isArray(users)) {
            setUsers(users.filter(u => u.id !== showDeleteConfirm.id));
          } else {
            // Se users non è un array, ricarica la lista
            const reloadResult = await getUsersList();
            if (reloadResult.success) {
              setUsers(Array.isArray(reloadResult.data) ? reloadResult.data : []);
            }
          }
          setError(null);
        } else {
          const errorType = categorizeError(result.error);
          setError(getEnhancedErrorMessage(result.error, errorType, "durante l'eliminazione"));
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        setError(getEnhancedErrorMessage(err.message, errorType, "durante l'eliminazione"));
      }
      
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveUser = async (userData, editing) => {
    try {
      let result;
      if (editing) {
        // Aggiorna utente esistente
        result = await updateUser(userData.id, userData);
      } else {
        // Crea nuovo utente
        result = await createUser(userData);
      }

      if (result.success) {
        // Ricarica la lista utenti per avere i dati aggiornati
        const usersList = await getUsersList();
        if (usersList.success) {
          setUsers(usersList.data);
        }
        setError(null);
        setShowModal(false);
        setSelectedUser(null);
        setIsEditing(false);
      } else {
        const errorType = categorizeError(result.error);
        setError(getEnhancedErrorMessage(result.error, errorType, editing ? "nell'aggiornamento" : "nella creazione"));
        // Non chiudere il modal se c'è errore
      }
    } catch (err) {
      const errorType = categorizeError(err.message);
      setError(getEnhancedErrorMessage(err.message, errorType, editing ? "nell'aggiornamento" : "nella creazione"));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null); // Reset dell'errore
  };

  const userStats = {
    total: Array.isArray(users) ? users.length : 0,
    admins: Array.isArray(users) ? users.filter(u => u.ruolo === 'admin').length : 0,
    users: Array.isArray(users) ? users.filter(u => u.ruolo === 'user').length : 0
  };

  // Mostra loading durante il caricamento
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-gray-600">
              <p>Caricamento utenti...</p>
              {retryAttempts > 0 && (
                <p className="text-sm text-gray-400">
                  Tentativo {retryAttempts}/3
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Funzione per ricaricare gli utenti (per il pulsante Riprova)
  const reloadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUsersList();
      if (result.success) {
        setUsers(result.data);
        setError(null);
      } else {
        const errorType = categorizeError(result.error);
        setError(getEnhancedErrorMessage(result.error, errorType, 'nel caricamento degli utenti'));
      }
    } catch (err) {
      const errorType = categorizeError(err.message);
      setError(getEnhancedErrorMessage(err.message, errorType, 'nel caricamento degli utenti'));
    } finally {
      setLoading(false);
    }
  };

  // Mostra errore se c'è un problema
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="text-red-600 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Errore nel caricamento degli utenti</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={reloadUsers}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Riprova
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Messaggi di errore per operazioni */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="text-red-600 text-lg mr-3">⚠️</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Errore</h4>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Chiudi messaggio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header con statistiche */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Gestione Utenti</h3>
          <button
            onClick={handleAddUser}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Nuovo Utente
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-600 mb-1">Totale Utenti</h4>
            <p className="text-2xl font-bold text-blue-800">{userStats.total}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-600 mb-1">Amministratori</h4>
            <p className="text-2xl font-bold text-purple-800">{userStats.admins}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-600 mb-1">Utenti Standard</h4>
            <p className="text-2xl font-bold text-green-800">{userStats.users}</p>
          </div>
        </div>
      </div>

      {/* Lista utenti */}
      <div className="grid gap-4">
        {!Array.isArray(users) || users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">
              {!Array.isArray(users) ? "Errore nel caricamento utenti" : "Nessun utente trovato"}
            </h3>
            <p>
              {!Array.isArray(users) 
                ? "Si è verificato un problema nel caricamento degli utenti." 
                : "Non ci sono utenti registrati nel sistema."
              }
            </p>
            <button
              onClick={handleAddUser}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Aggiungi il primo utente
            </button>
          </div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          ))
        )}
      </div>

      {/* Modal per creazione/modifica utente */}
      {showModal && (
        <UserModal
          user={selectedUser}
          isEditing={isEditing}
          onClose={closeModal}
          onSave={handleSaveUser}
        />
      )}

      {/* Conferma eliminazione */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Conferma Eliminazione</h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare l'utente <strong>{showDeleteConfirm.nome}</strong>?
              Questa azione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
