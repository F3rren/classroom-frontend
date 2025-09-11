import { useState, useEffect } from 'react';
import { getAllRooms } from '../../services/bookingService';
import { getAllBookings } from '../../services/bookingService';
import { createBooking } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';

const WeeklyCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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

  // Carica i dati iniziali
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Carica utente corrente
        const userResult = await getCurrentUser();
        if (userResult && userResult.success) {
          setCurrentUser(userResult.data);
        }

        // Carica stanze
        const roomsResult = await getAllRooms();
        if (roomsResult.success) {
          setRooms(roomsResult.data || []);
        }

        // Carica prenotazioni
        const bookingsResult = await getAllBookings();
        if (bookingsResult.success) {
          setBookings(bookingsResult.data || []);
        }

        setError(null);
      } catch (err) {
        console.error('Errore caricamento dati:', err);
        setError('Errore nel caricamento dei dati');
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
    const dateStr = date.toISOString().split('T')[0];
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

  // Gestisce il click su uno slot
  const handleSlotClick = (roomId, date, timeSlot) => {
    if (isSlotOccupied(roomId, date, timeSlot)) {
      return; // Non fare nulla se lo slot è occupato
    }

    const now = new Date();
    if (date < now.setHours(0, 0, 0, 0)) {
      alert('Non puoi prenotare date passate');
      return;
    }

    setSelectedSlot({
      roomId,
      date: date.toISOString().split('T')[0],
      timeSlot,
      roomName: rooms.find(r => r.id === roomId)?.nome || `Stanza ${roomId}`
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento calendario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <button onClick={() => window.location.reload()} className="ml-4 underline">
          Ricarica
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header con navigazione settimana */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Calendario Prenotazioni</h1>
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
        <p className="text-gray-600">Clicca su uno slot libero per prenotare. Verde = Libero, Rosso = Occupato</p>
      </div>

      {/* Legenda */}
      <div className="mb-6 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Disponibile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Occupato</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
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
          {rooms.map((room) => (
            <div key={room.id} className="grid grid-cols-11 gap-0 border-b last:border-b-0">
              {/* Nome stanza */}
              <div className="p-4 bg-gray-50 border-r font-medium text-gray-900">
                <div className="text-sm">{room.nome || `Stanza ${room.id}`}</div>
              </div>
              
              {/* Slot per ogni giorno (2 colonne per giorno: mattina e pomeriggio) */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="col-span-2 grid grid-cols-2 gap-0 border-r last:border-r-0">
                  {timeSlots.map((timeSlot, slotIndex) => {
                    const isOccupied = isSlotOccupied(room.id, day, timeSlot);
                    const isPast = day < new Date().setHours(0, 0, 0, 0);
                    const isBlocked = room.isBlocked;

                    let slotClass = "p-2 h-16 cursor-pointer transition-colors flex items-center justify-center text-xs font-medium ";
                    
                    if (slotIndex === 0) {
                      slotClass += "border-r ";
                    }
                    
                    if (isPast) {
                      slotClass += "bg-gray-100 text-gray-400 cursor-not-allowed";
                    } else if (isBlocked) {
                      slotClass += "bg-yellow-100 text-yellow-700 cursor-not-allowed";
                    } else if (isOccupied) {
                      slotClass += "bg-red-100 text-red-700 cursor-not-allowed";
                    } else {
                      slotClass += "bg-green-50 hover:bg-green-100 text-green-700";
                    }

                    return (
                      <div
                        key={slotIndex}
                        className={slotClass}
                        onClick={() => !isPast && !isOccupied && !isBlocked && handleSlotClick(room.id, day, timeSlot)}
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
          ))}
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
    </div>
  );
};

// Componente Modal per la prenotazione
const BookingModal = ({ slot, onClose, onSuccess, currentUser }) => {
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        aulaId: slot.roomId,
        date: slot.date,
        startTime: slot.timeSlot.startTime,
        endTime: slot.timeSlot.endTime,
        purpose: purpose.trim() || null
      };

      console.log('Creando prenotazione:', bookingData);
      const result = await createBooking(bookingData);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Errore nella creazione della prenotazione');
      }
    } catch (err) {
      console.error('Errore prenotazione:', err);
      setError('Errore di rete nella creazione della prenotazione');
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
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
            {error}
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
              {loading ? 'Prenotando...' : 'Conferma Prenotazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
