import { useState } from "react";
import { initialUsersData } from "../../data/usersData";
import UserCard from "./UserCard";
import UserModal from "./UserModal";

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState(initialUsersData);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteUser = (user) => {
    setShowDeleteConfirm(user);
  };

  const confirmDeleteUser = () => {
    if (showDeleteConfirm) {
      setUsers(users.filter(u => u.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveUser = (userData, editing) => {
    if (editing) {
      setUsers(users.map(u => u.id === userData.id ? userData : u));
    } else {
      setUsers([...users, userData]);
    }
    setShowModal(false);
    setSelectedUser(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    users: users.filter(u => u.role === 'user').length
  };

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
          <div className="text-center py-8 text-gray-500">
            <p>Nessun utente trovato</p>
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
              Sei sicuro di voler eliminare l'utente <strong>{showDeleteConfirm.username}</strong>?
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
