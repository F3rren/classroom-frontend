import { useState, useEffect } from 'react';
import { getVirtualRoomsDetailed } from '../../services/bookingService';
import { getAllBookings } from '../../services/bookingService';
import { createBooking } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';

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
    'CONFLICT': operation === 'booking' ? 'La fascia oraria è già stata prenotata da qualcun altro.' : 'Conflitto con i dati esistenti.',
    'VALIDATION': operation === 'booking' ? 'I dati della prenotazione non sono validi.' : 'I dati forniti non sono validi.',
    'GENERIC': operation === 'load' ? 'Impossibile caricare i dati del calendario.' : operation === 'booking' ? 'Errore durante la creazione della prenotazione.' : 'Si è verificato un errore imprevisto.'
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

const WeeklyCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [slotDetails, setSlotDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [operationType, setOperationType] = useState(null);

  // Debug logging per monitorare i tipi di dato
  
  

  // Fasce orarie fisse
  const timeSlots = [
    { id: 'morning', label: 'Mattina', startTime: '09:00', endTime: '13:00', hours: '9:00-13:00' },
    { id: 'afternoon', label: 'Pomeriggio', startTime: '14:00', endTime: '18:00', hours: '14:00-18:00' }
  ];

  // Ottiene i giorni della settimana lavorativa (Lunedì-Venerdì)
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    
    // Trova il lunedì della settimana
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjusting when day is Sunday
    startOfWeek.setDate(diff);
    
    // Genera i 5 giorni lavorativi
    for (let i = 0; i < 5; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      week.push(currentDay);
    }
    
    return week;
  };

  const weekDays = getWeekDays(currentWeek);

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

  // Carica i dati iniziali
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setOperationType('load');
      
      try {
        await retryOperation(async () => {
          // Carica utente corrente
          const userResult = await getCurrentUser();
          if (userResult && userResult.success) {
            setCurrentUser(userResult.data);
          }

          // Carica stanze virtuali
          const roomsResult = await getVirtualRoomsDetailed();
          if (roomsResult.success) {
            let virtualRooms = roomsResult.data || [];
            
            // Assicurati che virtualRooms sia sempre un array
            if (!Array.isArray(virtualRooms)) {
              
              virtualRooms = [];
            }
            
            setRooms(virtualRooms);
          } else {
            
            setRooms([]); // Fallback su array vuoto
            throw new Error(roomsResult.error || 'Errore nel caricamento stanze virtuali');
          }

          // Carica prenotazioni
          const bookingsResult = await getAllBookings();
          if (bookingsResult.success) {
            let allBookings = bookingsResult.data || [];
            
            // Assicurati che allBookings sia sempre un array
            if (!Array.isArray(allBookings)) {
              
              allBookings = [];
            }
            
            setBookings(allBookings);
          } else {
            
            setBookings([]); // Fallback su array vuoto
            throw new Error(bookingsResult.error || 'Errore nel caricamento prenotazioni');
          }

          return { rooms: roomsResult, bookings: bookingsResult, user: userResult };
        });
      } catch {
        // Errore già gestito in retryOperation
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentWeek]);

  // Naviga tra le settimane
  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  // Verifica se uno slot è occupato
  const isSlotOccupied = (roomId, date, timeSlot) => {
    if (!Array.isArray(bookings)) {
      
      return false;
    }
    const dateStr = formatDateLocal(date);
    return bookings.some(booking => {
      if (booking.stato === 'ANNULLATA') return false;
      
      const bookingDate = booking.date;
      const bookingStartTime = booking.startTime;
      const bookingEndTime = booking.endTime;
      const bookingRoomId = booking.roomId || booking.aulaId;

      return (
        bookingRoomId === roomId &&
        bookingDate === dateStr &&
        ((bookingStartTime <= timeSlot.startTime && bookingEndTime > timeSlot.startTime) ||
         (bookingStartTime < timeSlot.endTime && bookingEndTime >= timeSlot.endTime) ||
         (bookingStartTime >= timeSlot.startTime && bookingEndTime <= timeSlot.endTime))
      );
    });
  };

  // Trova la prenotazione per uno slot specifico
  const findBookingForSlot = (roomId, date, timeSlot) => {
    if (!Array.isArray(bookings)) {
      
      return null;
    }
    const dateStr = formatDateLocal(date);
    return bookings.find(booking => {
      if (booking.stato === 'ANNULLATA') return false;
      
      const bookingDate = booking.date;
      const bookingStartTime = booking.startTime;
      const bookingEndTime = booking.endTime;
      const bookingRoomId = booking.roomId || booking.aulaId;

      return (
        bookingRoomId === roomId &&
        bookingDate === dateStr &&
        ((bookingStartTime <= timeSlot.startTime && bookingEndTime > timeSlot.startTime) ||
         (bookingStartTime < timeSlot.endTime && bookingEndTime >= timeSlot.endTime) ||
         (bookingStartTime >= timeSlot.startTime && bookingEndTime <= timeSlot.endTime))
      );
    });
  };

  // Trova i dettagli del blocco per una stanza
  const findBlockDetailsForRoom = (roomId) => {
    if (!Array.isArray(rooms)) {
      
      return null;
    }
    const room = rooms.find(r => r.id === roomId);
    return room && room.isBlocked ? {
      reason: room.blockReason || 'Motivo non specificato',
      isBlocked: true
    } : null;
  };

  // Gestisce il click su uno slot
  const handleSlotClick = (roomId, date, timeSlot) => {
    const isOccupied = isSlotOccupied(roomId, date, timeSlot);
    const room = Array.isArray(rooms) ? rooms.find(r => r.id === roomId) : null;
    const isBlocked = room?.isBlocked;
    const isPast = date < new Date().setHours(0, 0, 0, 0);
    
    // Se è occupato, mostra i dettagli della prenotazione
    if (isOccupied) {
      const booking = findBookingForSlot(roomId, date, timeSlot);
      setSlotDetails({
        type: 'booking',
        roomName: room?.nome || room?.name || `Stanza ${room?.id}`,
        date: date,
        timeSlot: timeSlot,
        booking: booking
      });
      setShowDetailsModal(true);
      return;
    }
    
    // Se è bloccato, mostra i dettagli del blocco
    if (isBlocked) {
      const blockDetails = findBlockDetailsForRoom(roomId);
      setSlotDetails({
        type: 'blocked',
        roomName: room?.nome || room?.name || `Stanza ${room?.id}`,
        date: date,
        timeSlot: timeSlot,
        blockDetails: blockDetails
      });
      setShowDetailsModal(true);
      return;
    }
    
    // Se è nel passato, non fare nulla
    if (isPast) {
      return;
    }

    // Se è libero, apri il modale di prenotazione
    setSelectedSlot({
      roomId,
      date: formatDateLocal(date),
      timeSlot,
      roomName: room?.nome || room?.name || `Stanza ${room?.id}`
    });
    setShowBookingModal(true);
  };

  // Formatta la data per la visualizzazione
  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Formatta il range di date della settimana
  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[4];
    return `${start.getDate()} ${start.toLocaleDateString('it-IT', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('it-IT', { month: 'short' })} ${end.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <span className="text-gray-600">
            {isRetrying && operationType === 'load' ? 
              `Caricamento calendario (tentativo ${retryAttempts}/3)...` : 
              'Caricamento calendario...'
            }
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Errore nel caricamento calendario</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              {isRetrying && operationType === 'load' && (
                <div className="mt-2 text-sm text-red-600">
                  Tentativo {retryAttempts} di 3 in corso...
                </div>
              )}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  disabled={loading || isRetrying}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading || (isRetrying && operationType === 'load') ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-800 mr-2"></div>
                      Riprovando...
                    </>
                  ) : (
                    'Ricarica pagina'
                  )}
                </button>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 px-2 py-1 text-sm font-medium"
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

  // Titolo dinamico basato sul tipo di calendario
  const getCalendarTitle = () => {
    return "Calendario Aule Virtuali";
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header con navigazione settimana */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getCalendarTitle()}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {Array.isArray(rooms) ? rooms.length : 0} aule virtuali
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Settimana Prec.
            </button>
            <div className="text-lg font-semibold text-gray-700">
              {formatWeekRange()}
            </div>
            <button
              onClick={() => navigateWeek(1)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Settimana Succ. →
            </button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mb-6 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 border border-green-600 rounded"></div>
          <span className="text-sm text-gray-600">Disponibile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 border border-red-600 rounded"></div>
          <span className="text-sm text-gray-600">Occupato (clicca per dettagli)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 border border-yellow-600 rounded"></div>
          <span className="text-sm text-gray-600">Bloccata (clicca per motivo)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-200 rounded"></div>
          <span className="text-sm text-gray-600">Data passata</span>
        </div>
      </div>

      {/* Calendario principale */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header giorni con sottocolonne mattina/pomeriggio */}
        <div className="bg-gray-50 border-b">
          <div className="grid grid-cols-11 gap-0"> {/* 1 colonna stanze + 10 colonne (2 per ogni giorno) */}
            <div className="p-4 font-semibold text-gray-700 border-r row-span-2">Stanze</div>
            {weekDays.map((day, index) => (
              <div key={index} className="col-span-2 border-r last:border-r-0">
                <div className="p-2 font-semibold text-gray-700 text-center border-b bg-gray-100">
                  {formatDate(day)}
                </div>
                <div className="grid grid-cols-2 gap-0">
                  <div className="p-2 text-xs font-medium text-gray-600 text-center border-r bg-gray-50">
                    Mattina<br />9:00-13:00
                  </div>
                  <div className="p-2 text-xs font-medium text-gray-600 text-center bg-gray-50">
                    Pomeriggio<br />14:00-18:00
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Griglia calendario */}
        <div className="max-h-96 overflow-y-auto">
          {!Array.isArray(rooms) || rooms.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-xl font-medium mb-2">
                {!Array.isArray(rooms) ? 'Errore nel caricamento aule' : 'Nessuna aula virtuale disponibile'}
              </div>
              <p className="text-sm text-gray-400">
                {!Array.isArray(rooms) 
                  ? 'Si è verificato un errore durante il caricamento delle aule virtuali'
                  : 'Non sono state configurate aule virtuali nel sistema'
                }
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="grid grid-cols-11 gap-0 border-b last:border-b-0">
                {/* Nome stanza */}
                <div className="p-4 bg-gray-50 border-r font-medium text-gray-900">
                  <div className="text-sm">
                    {room.nome || room.name || `Stanza ${room.id}`}
                  </div>
                </div>
                
                {/* Slot per ogni giorno (2 colonne per giorno: mattina e pomeriggio) */}
                {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="col-span-2 grid grid-cols-2 gap-0 border-r last:border-r-0">
                  {timeSlots.map((timeSlot, slotIndex) => {
                    const isOccupied = isSlotOccupied(room.id, day, timeSlot);
                    const isPast = day < new Date().setHours(0, 0, 0, 0);
                    const isBlocked = room.isBlocked;

                    let slotClass = "p-2 h-16 cursor-pointer transition-colors flex items-center justify-center text-sm font-bold ";
                    
                    if (slotIndex === 0) {
                      slotClass += "border-r ";
                    }
                    
                    if (isPast) {
                      slotClass += "bg-gray-100 text-gray-600 cursor-not-allowed font-bold";
                    } else if (isBlocked) {
                      slotClass += "bg-yellow-400 text-yellow-700 cursor-pointer font-bold hover:bg-yellow-300";
                    } else if (isOccupied) {
                      slotClass += "bg-red-400 text-red-700 cursor-pointer font-bold hover:bg-red-300";
                    } else {
                      slotClass += "bg-green-400 hover:bg-green-200 text-green-700";
                    }

                    return (
                      <div
                        key={slotIndex}
                        className={slotClass}
                        onClick={() => handleSlotClick(room.id, day, timeSlot)}
                      >
                        <div className="text-center">
                          {isPast ? 'Passato' : 
                           isBlocked ? 'Bloccata' :
                           isOccupied ? 'Occupato' : 'Libero'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            ))
          )}
        </div>
      </div>

      {/* Modal di prenotazione */}
      {showBookingModal && selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            // Ricarica i dati
            window.location.reload();
          }}
          currentUser={currentUser}
        />
      )}

      {/* Modal dettagli slot occupato/bloccato */}
      {showDetailsModal && slotDetails && (
        <SlotDetailsModal
          details={slotDetails}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
};

// Componente Modal per la prenotazione
const BookingModal = ({ slot, onClose, onSuccess, currentUser }) => {
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [operationType, setOperationType] = useState(null);

  // Funzione di retry per il modal
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOperationType('booking');

    try {
      await retryOperation(async () => {
        const bookingData = {
          aulaId: slot.roomId,
          date: slot.date,
          startTime: slot.timeSlot.startTime,
          endTime: slot.timeSlot.endTime,
          purpose: purpose.trim() || null
        };

        const result = await createBooking(bookingData);
        if (result.success) {
          onSuccess();
          return result;
        } else {
          throw new Error(result.error || 'Errore nella creazione della prenotazione');
        }
      });
    } catch {
      // Errore già gestito in retryOperation
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Conferma Prenotazione</h3>
        
        <div className="mb-4 space-y-2">
          <p><strong>Stanza:</strong> {slot.roomName}</p>
          <p><strong>Data:</strong> {new Date(slot.date).toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Orario:</strong> {slot.timeSlot.hours}</p>
          <p><strong>Utente:</strong> {currentUser?.nome || 'N/A'}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-sm text-red-600">{error}</p>
                {isRetrying && operationType === 'booking' && (
                  <p className="text-xs text-red-500 mt-1">
                    Tentativo {retryAttempts} di 3 in corso...
                  </p>
                )}
              </div>
              <button
                onClick={() => setError('')}
                className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors ml-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              Scopo della prenotazione (opzionale)
            </label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Es: Riunione di progetto, lezione, presentazione..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRetrying && operationType === 'booking' ? 
                    `Tentativo ${retryAttempts}/3...` : 
                    'Prenotando...'
                  }
                </div>
              ) : (
                'Conferma Prenotazione'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Modal per visualizzare i dettagli di slot occupati o bloccati
const SlotDetailsModal = ({ details, onClose }) => {
  const { type, roomName, date, timeSlot, booking, blockDetails } = details;

  const formatDate = (date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {type === 'booking' ? 'Dettagli Prenotazione' : 'Stanza Bloccata'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="mb-4 space-y-3">
          <div>
            <strong className="text-gray-700">Stanza:</strong>
            <span className="ml-2">{roomName}</span>
          </div>
          
          <div>
            <strong className="text-gray-700">Data:</strong>
            <span className="ml-2">{formatDate(date)}</span>
          </div>
          
          <div>
            <strong className="text-gray-700">Orario:</strong>
            <span className="ml-2">{timeSlot.hours}</span>
          </div>

          {type === 'booking' && booking && (
            <>
              <div>
                <strong className="text-gray-700">Prenotato da:</strong>
                <span className="ml-2">{booking.userName || 'Utente sconosciuto'}</span>
              </div>
              
              <div>
                <strong className="text-gray-700">Stato:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  booking.stato === 'PRENOTATA' ? 'bg-green-100 text-green-800' :
                  booking.stato === 'ANNULLATA' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.stato || 'Attiva'}
                </span>
              </div>

              {booking.purpose && (
                <div>
                  <strong className="text-gray-700">Motivazione:</strong>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className='text-gray-700'>
                      {booking.purpose}

                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'blocked' && blockDetails && (
            <div>
              <strong className="text-gray-700">Motivo blocco:</strong>
              <div className="mt-1 p-3 bg-yellow-50 rounded-lg text-sm">
                {blockDetails.reason}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
