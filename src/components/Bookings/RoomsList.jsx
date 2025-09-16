import { useState, useEffect } from 'react';
import { getRoomsDetailed } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';
import RoomCard from './RoomCard';
import BookingModal from './BookingModal';
import RoomEditModal from './RoomEditModal';
import BookingsCalendarWidget from './BookingsCalendarWidget';

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
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);

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

  const handleDateSelect = (date, bookings) => {
    setSelectedCalendarDate(date);
    setSelectedDateBookings(bookings);
    console.log(`Selected date: ${date.toDateString()}, bookings:`, bookings);
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
              <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
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

      {/* Layout principale con calendario e filtri */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Colonna sinistra - Calendario */}
        <div className="lg:col-span-1">
          <BookingsCalendarWidget onDateSelect={handleDateSelect} />
          
          {/* Informazioni data selezionata */}
          {selectedCalendarDate && (
            <div className="mt-4 bg-white rounded-lg shadow-md p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {selectedCalendarDate.toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {selectedDateBookings.length} prenotazioni:
                  </p>
                  {selectedDateBookings.slice(0, 3).map((booking, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <div className="font-medium">
                        Stanza {booking.roomName || booking.roomId}
                      </div>
                      <div className="text-gray-600">
                        {booking.startTime}-{booking.endTime}
                      </div>
                      {booking.purpose && (
                        <div className="text-gray-500">{booking.purpose}</div>
                      )}
                    </div>
                  ))}
                  {selectedDateBookings.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{selectedDateBookings.length - 3} altre
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nessuna prenotazione</p>
              )}
            </div>
          )}
        </div>

        {/* Colonna destra - Lista stanze */}
        <div className="lg:col-span-3">
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
              <div className="bg-gray-100 w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-gray-400">---</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna stanza trovata</h3>
              <p className="text-gray-500">
                {searchTerm || floorFilter !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca' 
                  : 'Non ci sono stanze disponibili al momento'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>

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
