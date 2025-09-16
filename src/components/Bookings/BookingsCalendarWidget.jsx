import { useState, useEffect } from 'react';
import { getAllBookings } from '../../services/bookingService';

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

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await getAllBookings();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento prenotazioni:', error);
    } finally {
      setLoading(false);
    }
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
          <span className="ml-2 text-sm text-gray-600">Caricamento...</span>
        </div>
      )}

      {/* Calendario */}
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

      {/* Legenda */}
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
    </div>
  );
};

export default BookingsCalendarWidget;