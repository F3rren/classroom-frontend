import { useState, useEffect } from 'react';
import { getAllBookings } from '../../services/bookingService';

// Funzioni per la gestione intelligente degli errori
const categorizeError = (error) => {
  const errorMessage = error?.message || error || '';
  
  if (errorMessage.includes('token') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return 'AUTH';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
    return 'NETWORK';
  }
  if (errorMessage.includes('server') || errorMessage.includes('500') || errorMessage.includes('503')) {
    return 'SERVER';
  }
  if (errorMessage.includes('validation') || errorMessage.includes('required') || errorMessage.includes('invalid')) {
    return 'VALIDATION';
  }
  return 'GENERIC';
};

const getEnhancedErrorMessage = (error, category) => {
  const baseMessage = error?.message || error || 'Errore sconosciuto';
  
  switch (category) {
    case 'AUTH':
      return 'Sessione scaduta. Effettua nuovamente il login per visualizzare le prenotazioni.';
    case 'NETWORK':
      return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    case 'SERVER':
      return 'Il server è temporaneamente non disponibile. Riprova tra qualche momento.';
    case 'VALIDATION':
      return 'Errore nella validazione dei dati del calendario.';
    default:
      return baseMessage.includes('prenotazioni') ? baseMessage : `Errore nel caricamento del calendario: ${baseMessage}`;
  }
};

const isRetryableError = (category) => {
  return ['NETWORK', 'SERVER'].includes(category);
};

// Funzione helper per convertire date senza problemi di fuso orario
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BookingsCalendarWidget = ({ selectedRoomId, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const retryLoadBookings = () => {
    setError(null);
    loadBookings(false);
  };

  const loadBookings = async (isRetryAttempt = false) => {
    setLoading(true);
    if (!isRetryAttempt) {
      setError(null);
      setRetryAttempts(0);
      setIsRetrying(false);
    }

    let attempts = isRetryAttempt ? retryAttempts : 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          setIsRetrying(true);
          setRetryAttempts(attempts);
        }

        const result = await getAllBookings();
        
        if (result.success) {
          setBookings(result.data);
          setError(null);
          setIsRetrying(false);
          setRetryAttempts(0);
          setLoading(false);
          return;
        } else {
          const errorType = categorizeError(result.error);
          const enhancedMessage = getEnhancedErrorMessage(result.error, errorType);
          
          if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            setError(enhancedMessage);
            setBookings([]);
            break;
          }
        }
      } catch (error) {
        const errorType = categorizeError(error.message);
        const enhancedMessage = getEnhancedErrorMessage(error.message, errorType);
        
        if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        } else {
          setError(enhancedMessage);
          setBookings([]);
          break;
        }
      }
    }
    
    setLoading(false);
    setIsRetrying(false);
    setRetryAttempts(0);
  };

  // Ottieni il primo giorno del mese corrente
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Ottieni il primo lunedì della settimana che contiene il primo del mese
  const startDate = new Date(startOfMonth);
  const dayOfWeek = startDate.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunedì = 0
  startDate.setDate(startDate.getDate() - daysToSubtract);

  // Genera array dei giorni da mostrare (6 settimane)
  const calendarDays = [];
  const currentCalendarDate = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(currentCalendarDate));
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    calendarDays.push(weekDays);
  }

  // Filtra le prenotazioni per il mese corrente e per la stanza selezionata (se specificata)
  const getBookingsForDate = (date) => {
    const dateStr = formatDateLocal(date);
    return bookings.filter(booking => {
      const bookingDate = booking.date;
      const roomMatches = !selectedRoomId || booking.roomId == selectedRoomId || booking.aulaId == selectedRoomId;
      return bookingDate === dateStr && roomMatches && 
             (booking.status === 'active' || booking.stato === 'PRENOTATA');
    });
  };

  // Controlla se una data ha prenotazioni
  const hasBookings = (date) => {
    return getBookingsForDate(date).length > 0;
  };

  // Controlla se è il giorno corrente
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Controlla se è nel mese corrente
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date, getBookingsForDate(date));
    }
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header con navigazione */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedRoomId ? 'Prenotazioni Stanza' : 'Calendario Prenotazioni'}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center min-w-[120px]">
            <div className="font-medium text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
          </div>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">
            {isRetrying ? `Tentativo ${retryAttempts}/3...` : 'Caricamento...'}
          </span>
        </div>
      )}

      {/* Messaggio di errore */}
      {error && !loading && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-red-600 text-xl mr-3 flex-shrink-0">📅</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Errore nel calendario</h4>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <div className="flex space-x-2">
                <button
                  onClick={retryLoadBookings}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Riprova
                </button>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 px-3 py-1 rounded text-sm border border-red-300 hover:bg-red-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendario */}
      {!error && (
        <div className="grid grid-cols-7 gap-1">
          {/* Header giorni della settimana */}
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}

          {/* Giorni del calendario */}
          {calendarDays.flat().map((date, index) => {
            const hasBookingsForDate = hasBookings(date);
            const isCurrentDay = isToday(date);
            const isInCurrentMonth = isCurrentMonth(date);
            const bookingsCount = getBookingsForDate(date).length;

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`relative p-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 ${
                  !isInCurrentMonth 
                    ? 'text-gray-300'
                    : isCurrentDay
                    ? 'bg-blue-100 text-blue-800 font-semibold ring-2 ring-blue-300'
                    : hasBookingsForDate
                    ? 'bg-green-50 text-green-800 font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                disabled={loading}
              >
                <span>{date.getDate()}</span>
                
                {/* Indicatore prenotazioni */}
                {hasBookingsForDate && (
                  <div className="absolute bottom-1 right-1">
                    <div className={`w-2 h-2 rounded-full ${
                      bookingsCount === 1 ? 'bg-green-500' :
                      bookingsCount <= 3 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                  </div>
                )}
                
                {/* Numero prenotazioni per hover */}
                {hasBookingsForDate && bookingsCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {bookingsCount > 9 ? '9+' : bookingsCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Stato vuoto quando c'è un errore */}
      {error && !loading && (
        <div className="grid grid-cols-7 gap-1 opacity-50">
          {/* Header giorni della settimana */}
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
          {/* Giorni vuoti */}
          {Array.from({ length: 42 }, (_, index) => (
            <div key={index} className="p-2 text-sm text-center text-gray-300">
              {((index % 31) + 1)}
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      {!error && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded mr-1"></div>
              <span className="text-gray-600">Oggi</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded mr-1"></div>
              <span className="text-gray-600">Con prenotazioni</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span className="text-gray-600">1</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
              <span className="text-gray-600">2-3</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span className="text-gray-600">4+</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer con info errore */}
      {error && !loading && (
        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Impossibile caricare le prenotazioni. Clicca "Riprova" sopra per ricaricare.
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingsCalendarWidget;