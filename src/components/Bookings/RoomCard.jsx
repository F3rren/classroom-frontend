import { useState, useEffect } from 'react';
import { toggleRoomBlock, getRoomBookingsByDate } from '../../services/bookingService';

// Funzione helper per convertire date senza problemi di fuso orario
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Finestre temporali
const TIME_SLOTS = [
  { id: 'morning', label: 'Mattina', startTime: '09:00', endTime: '13:00', hours: '9:00-13:00' },
  { id: 'afternoon', label: 'Pomeriggio', startTime: '14:00', endTime: '18:00', hours: '14:00-18:00' }
];

// Funzioni helper per dati di default
const getDefaultDescription = (room) => {
  const capacity = room.capacity || 20;
  const floor = room.floor || 1;
  
  if (capacity >= 50) {
    return `Aula magna al piano ${floor}, ideale per conferenze e grandi eventi.`;
  } else if (capacity >= 30) {
    return `Aula spaziosa al piano ${floor}, perfetta per lezioni e presentazioni.`;
  } else if (capacity >= 15) {
    return `Aula di dimensioni medie al piano ${floor}, adatta per corsi e riunioni.`;
  } else {
    return `Sala meeting al piano ${floor}, ideale per piccoli gruppi e colloqui.`;
  }
};

const getDefaultFeatures = (room) => {
  const capacity = room.capacity || 20;
  const floor = room.floor || 1;
  const features = [];
  
  // Features basate sulla capacità
  if (capacity >= 30) {
    features.push('Proiettore', 'Microfono', 'Aria condizionata');
  } else if (capacity >= 15) {
    features.push('Proiettore', 'WiFi', 'Lavagna');
  } else {
    features.push('WiFi', 'Televisore', 'Lavagna bianca');
  }
  
  // Features basate sul piano
  if (floor === 1) {
    features.push('Accessibile');
  } else if (floor >= 3) {
    features.push('Vista panoramica');
  }
  
  return features.slice(0, 3); // Massimo 3 features
};

// Funzione per controllare disponibilità delle finestre temporali
const checkTimeSlotAvailability = (bookings) => {
  const availability = {};
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  TIME_SLOTS.forEach(slot => {
    // Controlla se ci sono prenotazioni che si sovrappongono con la finestra
    const hasConflict = bookings.some(booking => {
      if (!booking.startTime || !booking.endTime) return false;
      
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      const slotStart = slot.startTime;
      const slotEnd = slot.endTime;
      
      // Verifica sovrapposizione
      return (bookingStart < slotEnd && bookingEnd > slotStart);
    });
    
    // Se la finestra temporale è in corso ora, verifica se c'è una prenotazione attiva
    let isCurrentlyOccupied = false;
    if (currentTime >= slot.startTime && currentTime <= slot.endTime) {
      isCurrentlyOccupied = bookings.some(booking => {
        if (!booking.startTime || !booking.endTime) return false;
        return (currentTime >= booking.startTime && currentTime <= booking.endTime);
      });
    }
    
    availability[slot.id] = !hasConflict && !isCurrentlyOccupied;
  });
  
  return availability;
};

const RoomCard = ({ room, onBook, onEdit, isAdmin }) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(room.isBlocked || room.blocked !== null);
  const [todayAvailability, setTodayAvailability] = useState(null);

  // Aggiorna lo stato quando il room prop cambia
  useEffect(() => {
    setIsBlocked(room.isBlocked || room.blocked !== null);
  }, [room.isBlocked, room.blocked]);

  // Carica la disponibilità per oggi
  useEffect(() => {
    const loadTodayAvailability = async () => {
      if (!room.id) return;
      
      const today = formatDateLocal(new Date());
      try {
        const result = await getRoomBookingsByDate(room.id, today);
        if (result.success) {
          const availability = checkTimeSlotAvailability(result.data);
          setTodayAvailability(availability);
        }
      } catch (error) {
        console.error('Errore nel caricamento disponibilità:', error);
      }
    };

    loadTodayAvailability();
  }, [room.id]);

  const handleToggleBlock = async (e) => {
    e.stopPropagation();
    setIsBlocking(true);
    
    try {
      const result = await toggleRoomBlock(room.id, !isBlocked);
      if (result.success) {
        setIsBlocked(!isBlocked);
      } else {
        console.error('Errore nel blocco/sblocco:', result.error);
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setIsBlocking(false);
    }
  };

  // Funzione per verificare lo stato della stanza basato sull'orario
  const getRoomStatus = () => {
    // Debug: log dei dati della stanza
    console.log('🔍 Debug getRoomStatus per stanza:', room.name, {
      bookings: room.bookings,
      allRoomData: room
    });
    
    const bookings = room.bookings || [];
    if (bookings.length === 0) {
      console.log('📝 Nessuna prenotazione -> LIBERA');
      return 'LIBERA';
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = formatDateLocal(now);
    
    console.log('⏰ Orario corrente:', currentTime, 'Data:', today);
    
    // Filtra solo le prenotazioni di oggi
    const todayBookings = bookings.filter(booking => {
      const bookingDate = booking.date || booking.data;
      return bookingDate === today;
    });
    
    if (todayBookings.length === 0) {
      console.log('📅 Nessuna prenotazione oggi -> LIBERA');
      return 'LIBERA';
    }
    
    // Controlla se è attualmente occupata
    const isCurrentlyOccupied = todayBookings.some(booking => {
      const startTime = booking.startTime || booking.oraInizio;
      const endTime = booking.endTime || booking.oraFine;
      
      if (!startTime || !endTime) {
        console.log('⚠️ Orari mancanti:', {startTime, endTime});
        return false;
      }
      
      const isActive = currentTime >= startTime && currentTime <= endTime;
      console.log('🕒 Controllo occupazione:', {currentTime, startTime, endTime, isActive});
      
      return isActive;
    });
    
    if (isCurrentlyOccupied) {
      console.log('🔴 Stanza OCCUPATA ora');
      return 'OCCUPATA';
    }
    
    // Se non è occupata ora ma ha prenotazioni oggi, è prenotata
    console.log('🟡 Stanza PRENOTATA (ha prenotazioni ma non ora)');
    return 'PRENOTATA';
  };

  const getStatusColor = () => {
    if (isBlocked || room.isBlocked || room.blocked !== null) {
      return 'bg-red-500 text-white border-red-500';
    }
    
    const status = getRoomStatus();
    switch (status) {
      case 'OCCUPATA':
        return 'bg-red-500 text-white border-red-500';
      case 'PRENOTATA':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'LIBERA':
      default:
        return 'bg-green-500 text-white border-green-500';
    }
  };

  const getStatusText = () => {
    if (isBlocked || room.isBlocked || room.blocked !== null) {
      return 'BLOCCATA';
    }
    
    return getRoomStatus();
  };

  return (
    <div className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden ${
      isBlocked || room.isBlocked ? 
        'ring-2 ring-red-200 bg-red-50' : 
        'hover:ring-2 hover:ring-blue-100'
    }`}>
      {/* Barra colorata in alto per stanze bloccate */}
      {(isBlocked || room.isBlocked) && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
      )}
      
      <div className="p-6">
        {/* Header con nome e stato */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {(() => {
                const roomName = room.name || room.nome || `Stanza ${room.id}`;
                console.log('🏠 RoomCard debug - Room object:', { 
                  id: room.id, 
                  name: room.name, 
                  nome: room.nome,
                  displayName: roomName,
                  fullRoom: room 
                });
                return roomName;
              })()}
            </h3>
            
            {/* Widget di stato migliorato */}
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${getStatusColor()} shadow-sm`}>
                
                {getStatusText()}
              </div>
              
              {/* Indicatore motivazione blocco */}
              {(isBlocked || room.isBlocked) && (room.blockReason || room.blocked) && (
                <div className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs border border-red-200">
                  {room.blockReason || room.blocked}
                </div>
              )}
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleToggleBlock}
                disabled={isBlocking}
                className={`p-1 rounded ${isBlocked ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-50'} transition-colors`}
                title={isBlocked ? 'Sblocca stanza' : 'Blocca stanza'}
              >
                {isBlocking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isBlocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Informazioni stanza */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Piano {room.floor || 'Terra'}
          </div>

          {room.capacity && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {room.capacity} posti
            </div>
          )}

          {/* Descrizione con fallback */}
          <div className="text-sm text-gray-600">
            {room.description ? (
              <p className="line-clamp-2">{room.description}</p>
            ) : (
              <p className="text-gray-500 italic">
                {getDefaultDescription(room)}
              </p>
            )}
          </div>
        </div>

        {/* Attrezzature/Features con fallback */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {(room.features && room.features.length > 0) ? (
              <>
                {room.features.slice(0, 3).map((feature, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200">
                    {feature}
                  </span>
                ))}
                {room.features.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                    +{room.features.length - 3} altre
                  </span>
                )}
              </>
            ) : (
              // Attrezzature predefinite basate su piano/capacità
              getDefaultFeatures(room).map((feature, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">
                  {feature}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Disponibilità finestre temporali per oggi */}
        {!isBlocked && todayAvailability && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Disponibilità oggi:</div>
            <div className="flex gap-2">
              {TIME_SLOTS.map(slot => (
                <div key={slot.id} className="flex-1">
                  <div className={`text-center py-2 px-2 rounded text-xs font-medium ${
                    todayAvailability[slot.id] 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    <div className="font-semibold">{slot.label}</div>
                    <div className="opacity-75">{slot.hours}</div>
                    <div className="mt-1">
                      {todayAvailability[slot.id] ? (
                        <span className="text-green-600">✓ Libera</span>
                      ) : (
                        <span className="text-red-600">✗ Occupata</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prenotazione corrente */}
        {room.booking && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm">
              <div className="font-medium text-yellow-800">Prenotata ora:</div>
              <div className="text-yellow-700">
                {room.booking.user} - {room.booking.time}
              </div>
              {room.booking.purpose && (
                <div className="text-xs text-yellow-600 mt-1">{room.booking.purpose}</div>
              )}
            </div>
          </div>
        )}

        {/* Prossime prenotazioni */}
        {room.bookings && room.bookings.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Prossime prenotazioni:</div>
            <div className="space-y-1">
              {room.bookings.slice(0, 2).map((booking, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="font-medium">{booking.date} - {booking.startTime}-{booking.endTime}</div>
                  <div>{booking.user}</div>
                  {booking.purpose && <div className="text-gray-500">{booking.purpose}</div>}
                </div>
              ))}
              {room.bookings.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{room.bookings.length - 2} altre prenotazioni
                </div>
              )}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex space-x-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => onBook(room)}
            disabled={isBlocked}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
              isBlocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isBlocked ? 'Non disponibile' : 'Prenota'}
          </button>
          
          {isAdmin && onEdit && (
            <button
              onClick={() => onEdit(room)}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Modifica
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
