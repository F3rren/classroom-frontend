import { useState, useEffect } from 'react';
import { getRoomBookingsByDate } from '../../services/bookingService';

// Sistema di gestione errori intelligente
const categorizeError = (error) => {
  if (error.response?.status === 401 || error.message?.includes('non autorizzato')) {
    return 'AUTH';
  }
  if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
    return 'NETWORK';
  }
  if (error.response?.status >= 500) {
    return 'SERVER';
  }
  if (error.response?.status === 409) {
    return 'CONFLICT';
  }
  if (error.response?.status === 400) {
    return 'VALIDATION';
  }
  return 'GENERIC';
};

const getEnhancedErrorMessage = (error, operation = '') => {
  const category = categorizeError(error);
  const baseMessages = {
    'AUTH': 'Sessione scaduta. Effettua nuovamente il login.',
    'NETWORK': 'Connessione internet non disponibile. Riprova quando torni online.',
    'SERVER': 'Problema temporaneo del server. Stiamo lavorando per risolverlo.',
    'CONFLICT': operation === 'block' ? 'La stanza ha prenotazioni attive e non può essere bloccata.' : 'Operazione non possibile per conflitto con altri dati.',
    'VALIDATION': operation === 'block' ? 'Dati non validi per il blocco della stanza.' : 'I dati forniti non sono validi.',
    'GENERIC': operation === 'load' ? 'Impossibile caricare le informazioni della stanza.' : 'Si è verificato un errore imprevisto.'
  };
  return baseMessages[category] || 'Errore sconosciuto';
};

const isRetryableError = (error) => {
  const category = categorizeError(error);
  return ['NETWORK', 'SERVER'].includes(category);
};

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

const RoomCard = ({ room, onBook }) => {
  const [isBlocked, setIsBlocked] = useState(room.isBlocked || room.blocked !== null);
  const [todayAvailability, setTodayAvailability] = useState(null);
  const [error, setError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [operationType, setOperationType] = useState(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // Aggiorna lo stato quando il room prop cambia
  useEffect(() => {
    setIsBlocked(room.isBlocked || room.blocked !== null);
  }, [room.isBlocked, room.blocked]);

  // Funzione di retry
  const retryOperation = async (operation, maxAttempts = 3) => {
    setIsRetrying(true);
    setRetryAttempts(0);
    setError('');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryAttempts(attempt);
        const result = await operation();
        setIsRetrying(false);
        setRetryAttempts(0);
        setOperationType(null);
        return result;
      } catch (error) {
        if (attempt === maxAttempts) {
          setIsRetrying(false);
          setRetryAttempts(0);
          setOperationType(null);
          setError(getEnhancedErrorMessage(error, operationType));
          throw error;
        }
        
        if (isRetryableError(error)) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          setIsRetrying(false);
          setRetryAttempts(0);
          setOperationType(null);
          setError(getEnhancedErrorMessage(error, operationType));
          throw error;
        }
      }
    }
  };

  // Carica la disponibilità per oggi
  useEffect(() => {
    const loadTodayAvailability = async () => {
      if (!room.id) return;
      
      setIsLoadingAvailability(true);
      setOperationType('load');
      const today = formatDateLocal(new Date());

      try {
        await retryOperation(async () => {
          const result = await getRoomBookingsByDate(room.id, today);
          if (result.success) {
            const availability = checkTimeSlotAvailability(result.data);
            setTodayAvailability(availability);
            return result;
          } else {
            throw new Error(result.error || 'Errore nel caricamento disponibilità');
          }
        });
      } catch {
        // Errore già gestito in retryOperation
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    loadTodayAvailability();
  }, [room.id]);

  // Funzione per verificare lo stato della stanza basato sull'orario
  const getRoomStatus = () => {
    const bookings = room.bookings || [];
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return 'LIBERA';
    }
    
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const today = formatDateLocal(now);
    
    // Filtra solo le prenotazioni di oggi
    const todayBookings = bookings.filter(booking => {
      const bookingDate = booking.date || booking.data;
      return bookingDate === today;
    });
    
    if (todayBookings.length === 0) {
      return 'LIBERA';
    }
    
    // Controlla se è attualmente occupata
    const isCurrentlyOccupied = todayBookings.some(booking => {
      const startTime = booking.startTime || booking.oraInizio;
      const endTime = booking.endTime || booking.oraFine;
      
      if (!startTime || !endTime) {
        return false;
      }
      
      const isActive = currentTime >= startTime && currentTime <= endTime;
      
      return isActive;
    });
    
    if (isCurrentlyOccupied) {
      return 'OCCUPATA';
    }
    
    // Se non è occupata ora ma ha prenotazioni oggi, è prenotata
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
              {room.name || room.nome || `Stanza ${room.id}`}
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
        {!isBlocked && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Disponibilità oggi:
              {(isLoadingAvailability || (isRetrying && operationType === 'load')) && (
                <span className="ml-2 text-blue-600">
                  {isRetrying ? `Tentativo ${retryAttempts}/3...` : 'Caricamento...'}
                </span>
              )}
            </div>
            
            {todayAvailability ? (
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
            ) : (isLoadingAvailability || (isRetrying && operationType === 'load')) ? (
              <div className="flex gap-2">
                {TIME_SLOTS.map(slot => (
                  <div key={slot.id} className="flex-1">
                    <div className="text-center py-2 px-2 rounded text-xs bg-gray-100 text-gray-500 border border-gray-200">
                      <div className="font-semibold">{slot.label}</div>
                      <div className="opacity-75">{slot.hours}</div>
                      <div className="mt-1">
                        <div className="animate-pulse">Caricamento...</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-2">
                Informazioni disponibilità non disponibili
              </div>
            )}
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

        {/* Messaggio di errore */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError('')}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
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
          
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
