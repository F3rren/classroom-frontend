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
  const [statusFilter, setStatusFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
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

  // Funzione helper per determinare lo stato della stanza
  const getRoomStatus = (room) => {
    if (room.isBlocked || room.blocked) return 'BLOCCATA';
    
    const bookings = room.bookings || [];
    if (bookings.length === 0) return 'LIBERA';
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(booking => 
      (booking.date || booking.data) === today
    );
    
    if (todayBookings.length === 0) return 'LIBERA';
    
    const isCurrentlyOccupied = todayBookings.some(booking => {
      const startTime = booking.startTime || booking.oraInizio;
      const endTime = booking.endTime || booking.oraFine;
      return startTime && endTime && currentTime >= startTime && currentTime <= endTime;
    });
    
    return isCurrentlyOccupied ? 'OCCUPATA' : 'PRENOTATA';
  };

  // Funzione helper per categorizzare la capacità
  const getCapacityCategory = (capacity) => {
    if (!capacity) return 'unknown';
    if (capacity <= 15) return 'small';
    if (capacity <= 30) return 'medium';
    return 'large';
  };

  // Filtra le stanze
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFloor = floorFilter === 'all' || room.floor?.toString() === floorFilter;
    
    // Filtro stato
    const roomStatus = getRoomStatus(room);
    const matchesStatus = statusFilter === 'all' || roomStatus === statusFilter;
    
    // Filtro capacità
    const capacityCategory = getCapacityCategory(room.capacity);
    const matchesCapacity = capacityFilter === 'all' || capacityCategory === capacityFilter;
    
    // Filtro attrezzature
    let matchesFeature = true;
    if (featureFilter !== 'all') {
      const roomFeatures = room.features || [];
      matchesFeature = roomFeatures.some(feature => 
        feature.toLowerCase().includes(featureFilter.toLowerCase())
      );
    }
    
    return matchesSearch && matchesFloor && matchesStatus && matchesCapacity && matchesFeature;
  });

  // Ottieni i piani disponibili
  const availableFloors = [...new Set(rooms.map(room => room.floor?.toString()).filter(Boolean))].sort();

  // Ottieni le attrezzature disponibili
  const availableFeatures = [...new Set(
    rooms.flatMap(room => room.features || [])
      .filter(Boolean)
  )].sort();

  // Opzioni stati
  const statusOptions = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'LIBERA', label: 'Libere' },
    { value: 'PRENOTATA', label: 'Prenotate' },
    { value: 'OCCUPATA', label: 'Occupate' },
    { value: 'BLOCCATA', label: 'Bloccate' }
  ];

  // Opzioni capacità
  const capacityOptions = [
    { value: 'all', label: 'Tutte le capienze' },
    { value: 'small', label: 'Piccole (fino a 15 posti)' },
    { value: 'medium', label: 'Medie (16-30 posti)' },
    { value: 'large', label: 'Grandi (oltre 30 posti)' }
  ];

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ricerca testuale */}
              <div className="lg:col-span-3">
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
              
              {/* Filtro Piano */}
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

              {/* Filtro Stato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Capacità */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacità
                </label>
                <select
                  value={capacityFilter}
                  onChange={(e) => setCapacityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {capacityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Attrezzature */}
              {availableFeatures.length > 0 && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attrezzature
                  </label>
                  <select
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tutte le attrezzature</option>
                    {availableFeatures.map(feature => (
                      <option key={feature} value={feature}>
                        {feature}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pulsante Reset filtri */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFloorFilter('all');
                    setStatusFilter('all');
                    setCapacityFilter('all');
                    setFeatureFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancella filtri
                </button>
              </div>
            </div>

            {/* Riepilogo filtri attivi */}
            <div className="mt-3 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Ricerca: "{searchTerm}"
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {floorFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Piano {floorFilter}
                  <button 
                    onClick={() => setFloorFilter('all')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {statusOptions.find(opt => opt.value === statusFilter)?.label}
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {capacityFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {capacityOptions.find(opt => opt.value === capacityFilter)?.label}
                  <button 
                    onClick={() => setCapacityFilter('all')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {featureFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {featureFilter}
                  <button 
                    onClick={() => setFeatureFilter('all')}
                    className="ml-1 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Header con contatore */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Stanze disponibili
              </h2>
              <p className="text-sm text-gray-500">
                {filteredRooms.length} di {rooms.length} stanze
                {(searchTerm || floorFilter !== 'all' || statusFilter !== 'all' || 
                  capacityFilter !== 'all' || featureFilter !== 'all') && ' (filtrate)'}
              </p>
            </div>
          </div>

          {/* Lista stanze */}
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 mx-auto rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m0 0h4M9 7h6m-6 4h6m-5 4h5"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {rooms.length === 0 ? 'Nessuna stanza disponibile' : 'Nessun risultato trovato'}
              </h3>
              <p className="text-gray-500 mb-4">
                {rooms.length === 0 
                  ? 'Non ci sono stanze registrate nel sistema'
                  : 'Nessuna stanza corrisponde ai filtri selezionati'
                }
              </p>
              {(searchTerm || floorFilter !== 'all' || statusFilter !== 'all' || 
                capacityFilter !== 'all' || featureFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFloorFilter('all');
                    setStatusFilter('all');
                    setCapacityFilter('all');
                    setFeatureFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Cancella tutti i filtri
                </button>
              )}
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
