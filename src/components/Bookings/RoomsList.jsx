import { useState, useEffect } from 'react';
import { getRoomsDetailed } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';
import RoomCard from './RoomCard';
import BookingModal from './BookingModal';
import RoomEditModal from './RoomEditModal';

const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');

  useEffect(() => {
    loadRooms();
    loadUser();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const result = await getRoomsDetailed();
    if (result.success) {
      setRooms(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const loadUser = async () => {
    const userResult = await getCurrentUser();
    if (userResult && userResult.success) {
      setUser(userResult.data);
    }
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setShowEditModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    // Ricarica le stanze per aggiornare la disponibilità
    loadRooms();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedRoom(null);
    // Ricarica le stanze
    loadRooms();
  };

  // Filtra le stanze
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFloor = floorFilter === 'all' || room.floor?.toString() === floorFilter;
    return matchesSearch && matchesFloor;
  });

  // Ottieni i piani disponibili
  const availableFloors = [...new Set(rooms.map(room => room.floor?.toString()).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Caricamento stanze...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errore nel caricamento</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={loadRooms}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Riprova
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prenotazione Stanze</h1>
        <p className="text-gray-600">
          {user?.ruolo === 'admin' 
            ? 'Gestisci e prenota le stanze disponibili'
            : 'Cerca e prenota le stanze disponibili'
          }
        </p>
      </div>

      {/* Filtri */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cerca stanze
            </label>
            <input
              type="text"
              placeholder="Nome stanza o descrizione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Piano
            </label>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tutti i piani</option>
              {availableFloors.map(floor => (
                <option key={floor} value={floor}>
                  Piano {floor}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista stanze */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna stanza trovata</h3>
          <p className="text-gray-500">
            {searchTerm || floorFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono stanze disponibili al momento'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={handleBookRoom}
              onEdit={user?.ruolo === 'admin' ? handleEditRoom : null}
              isAdmin={user?.ruolo === 'admin'}
            />
          ))}
        </div>
      )}

      {/* Modal prenotazione */}
      {showBookingModal && selectedRoom && (
        <BookingModal
          room={selectedRoom}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Modal modifica stanza (solo admin) */}
      {showEditModal && selectedRoom && user?.ruolo === 'admin' && (
        <RoomEditModal
          room={selectedRoom}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default RoomsList;
