import { useState, useEffect } from "react";
import UserCard from "./UserCard";
import UserModal from "./UserModal";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carica gli utenti al mount del componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funzione per recuperare tutti gli utenti
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Token mancante. Effettua il login.");
        return;
      }

      const response = await fetch("http://localhost:8080/api/admin/users", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Il backend potrebbe restituire data.users oppure direttamente data
        setUsers(data.users || data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Errore nel caricamento degli utenti");
      }
      
    } catch (err) {
      console.error("Errore di rete:", err);
      setError("Errore di connessione al server");
    } finally {
      setLoading(false);
    }
  };

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
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8080/api/admin/delete/${showDeleteConfirm.id}`, {
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });

        if (response.ok) {
          // Rimuovi l'utente dalla lista locale
          //setUsers(users.filter(u => u.id !== showDeleteConfirm.id));
          console.log(`Utente ${showDeleteConfirm.username} eliminato con successo`);
          await fetchUsers();
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Errore nell'eliminazione dell'utente");
        }
      } catch (err) {
        console.error("Errore nell'eliminazione:", err);
        setError("Errore di connessione durante l'eliminazione");
      }
      
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveUser = async (userData, editing) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Tentativo di salvataggio utente:", { userData, editing });
      
      if (editing) {
        // Aggiorna utente esistente
        console.log("Aggiornamento utente con ID:", userData.id);
        const response = await fetch(`http://localhost:8080/api/admin/users/${userData.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });

        console.log("Risposta PUT:", response.status);
        
        if (response.ok) {
          const updatedUser = await response.json();
          console.log("Utente aggiornato:", updatedUser);
          setUsers(users.map(u => u.id === userData.id ? (updatedUser.user || updatedUser) : u));
          console.log("Utente aggiornato con successo");
          // Ricarica la lista utenti per essere sicuri dei dati aggiornati
          await fetchUsers();
        } else {
          const errorData = await response.json();
          console.error("Errore aggiornamento:", errorData);
          setError(errorData.message || "Errore nell'aggiornamento dell'utente");
          return; // Non chiudere il modal se c'è errore
        }
      } else {
        // Crea nuovo utente
        console.log("Creazione nuovo utente:", userData);
        const response = await fetch("http://localhost:8080/api/admin/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(userData),
        });

        console.log("Risposta POST:", response.status);
        
        if (response.ok) {
          const newUser = await response.json();
          console.log("Nuovo utente creato:", newUser);
          setUsers([...users, newUser.user || newUser]);
          console.log("Utente creato con successo");
          // Ricarica la lista utenti per essere sicuri dei dati aggiornati
          await fetchUsers();
        } else {
          const errorData = await response.json();
          console.error("Errore creazione:", errorData);
          setError(errorData.message || "Errore nella creazione dell'utente");
          return; // Non chiudere il modal se c'è errore
        }
      }
      
      setShowModal(false);
      setSelectedUser(null);
      setIsEditing(false);
    } catch (err) {
      console.error("Errore nell'operazione:", err);
      setError("Errore di connessione durante l'operazione");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setError(null); // Reset dell'errore
  };

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.ruolo === 'admin').length,
    users: users.filter(u => u.ruolo === 'user').length
  };

  // Mostra loading durante il caricamento
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  // Mostra errore se c'è un problema
  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Errore di Caricamento</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Nessun utente trovato</h3>
            <p>Non ci sono utenti registrati nel sistema.</p>
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
