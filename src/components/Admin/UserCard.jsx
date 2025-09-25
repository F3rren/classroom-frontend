export default function UserCard({ user, onEdit, onDelete, currentUser }) {
  const isCurrentUser = currentUser.id === user.id;
  const canEdit = currentUser.ruolo === "admin" && !isCurrentUser;
  const canDelete = currentUser.ruolo === "admin" && !isCurrentUser;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{user.nome}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.ruolo === 'admin' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.ruolo === 'admin' ? 'Admin' : 'Utente'}
            </span>
            {isCurrentUser && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Tu
              </span>
            )}
          </div>
          
          <p className="text-gray-600 mb-1">{user.email}</p>
          <p className="text-sm text-gray-500">
            Creato: {user.dataRegistrazione ? 
              new Date(user.dataRegistrazione).toLocaleDateString('it-IT') : 
              'Data non disponibile'}
          </p>
          <p className="text-sm text-gray-500">
            Ultimo accesso: {user.ultimoAccesso ? 
              new Date(user.ultimoAccesso).toLocaleDateString('it-IT') : 
              'Mai effettuato'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => onEdit(user)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              Modifica
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(user)}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
            >
              Elimina
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
