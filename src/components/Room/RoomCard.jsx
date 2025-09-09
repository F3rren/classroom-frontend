import { getStatusColor, getCapacityIcon, getCapacityLabel, getStatusLabel, formatShortDate } from "../../utils/roomUtils";

export default function RoomCard({ room, onRoomClick, showBookingInfo = false, layoutStyle = "compact" }) {
  
  // Debug: mostra i dati della stanza
  if (layoutStyle === "extended") {
    console.log("RoomCard data:", room);
  }

  // Determina se la stanza è attualmente occupata basandosi sulle prenotazioni
  const getCurrentBookingStatus = () => {
    if (!showBookingInfo || !room.bookings || room.bookings.length === 0) {
      return { status: room.stato || 'libera', isOccupied: false };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD formato
    
    // Prima controlla se esiste una prenotazione oggi
    const todayBookings = room.bookings.filter(booking => booking.date === today);
    
    if (todayBookings.length > 0) {
      const currentBooking = todayBookings.find(booking => {
        const start = new Date(`${booking.date}T${booking.startTime}`);
        const end = new Date(`${booking.date}T${booking.endTime}`);
        return start <= now && now <= end;
      });

      if (currentBooking) {
        return { 
          status: 'occupata', 
          isOccupied: true,
          currentBooking,
          until: currentBooking.endTime
        };
      }

      // Verifica se c'è una prenotazione nelle prossime 2 ore
      const soonThreshold = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const upcomingBooking = todayBookings.find(booking => {
        const start = new Date(`${booking.date}T${booking.startTime}`);
        return start > now && start <= soonThreshold;
      });

      if (upcomingBooking) {
        return {
          status: 'presto-occupata',
          isOccupied: false,
          upcomingBooking,
          nextAt: upcomingBooking.startTime
        };
      }
    }

    // Se non ci sono prenotazioni oggi, usa lo status della stanza o libera
    return { status: room.status === 'prenotata' ? 'occupata' : 'libera', isOccupied: false };
  };

  const bookingStatus = getCurrentBookingStatus();

  // Colore personalizzato se abbiamo informazioni sulle prenotazioni
  const getCardColor = () => {
    if (showBookingInfo) {
      switch (bookingStatus.status) {
        case 'occupata':
          return 'bg-red-500 hover:bg-red-600 border-red-400';
        case 'presto-occupata':
          return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400';
        case 'libera':
          return 'bg-green-500 hover:bg-green-600 border-green-400';
        default:
          return getStatusColor(room.status);
      }
    }
    return getStatusColor(room.status);
  };

  // Layout compatto (come era prima) o esteso (stile admin)
  if (layoutStyle === "extended") {
    return (
      <div 
        className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onRoomClick(room)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{room.nome || `Stanza ${room.id}`}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(room.status).split(' ')[0]}`}>
                {getStatusLabel(bookingStatus.status)}
              </span>
              <span className="text-sm text-gray-500">#{room.id}</span>
            </div>
            
            {/* Dettagli prenotazione corrente */}
            {showBookingInfo && bookingStatus.status === 'occupata' && bookingStatus.currentBooking && (
              <div className="mb-2 text-sm text-gray-600">
                <p><strong>Occupata da:</strong> {bookingStatus.currentBooking.user}</p>
                <p><strong>Orario:</strong> {bookingStatus.currentBooking.startTime} - {bookingStatus.currentBooking.endTime}</p>
                {bookingStatus.currentBooking.purpose && (
                  <p><strong>Scopo:</strong> {bookingStatus.currentBooking.purpose}</p>
                )}
              </div>
            )}

            {/* Prossima prenotazione */}
            {showBookingInfo && bookingStatus.status === 'presto-occupata' && bookingStatus.upcomingBooking && (
              <div className="mb-2 text-sm text-amber-600">
                <p><strong>Prossima prenotazione:</strong> {bookingStatus.upcomingBooking.user}</p>
                <p><strong>Alle:</strong> {bookingStatus.upcomingBooking.startTime}</p>
              </div>
            )}

            {/* Stanza bloccata */}
            {room.status === "bloccata" && room.blocked && (
              <div className="mb-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800 mb-1">Motivo blocco:</p>
                  <p className="text-sm text-red-700">{room.blocked.reason}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Bloccata il {formatShortDate(room.blocked.blockedAt)} da {room.blocked.blockedBy}
                  </p>
                </div>
              </div>
            )}

            {/* Info prenotazioni giornaliere */}
            {showBookingInfo && room.bookings && room.bookings.length > 0 && (
              <div className="mb-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    📅 Prenotazioni oggi: {(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayBookings = room.bookings.filter(booking => booking.date === today);
                      return todayBookings.length;
                    })()}
                  </p>
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayBookings = room.bookings.filter(booking => booking.date === today);
                    return todayBookings.slice(0, 2).map((booking, index) => (
                      <p key={index} className="text-xs text-blue-700">
                        {booking.startTime}-{booking.endTime}: {booking.user}
                      </p>
                    ));
                  })()}
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todayBookings = room.bookings.filter(booking => booking.date === today);
                    return todayBookings.length > 2 && (
                      <p className="text-xs text-blue-600 mt-1">
                        +{todayBookings.length - 2} altre prenotazioni...
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {/* Badge status */}
          <div className="flex flex-col items-end gap-2 ml-4">
            {showBookingInfo && room.bookings && room.bookings.length > 0 && (
              <div className="bg-blue-600 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayBookings = room.bookings.filter(booking => booking.date === today);
                  return todayBookings.length > 0 ? todayBookings.length : room.bookings.length;
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>Piano:</strong> {room.piano !== undefined ? room.piano : 'N/D'}
            </div>
            <div>
              <strong>Capacità:</strong> {room.capienza || 'N/D'} {room.capienza && getCapacityIcon(room.capienza)}
            </div>
            <div>
              <strong>Tipo:</strong> {room.capienza ? getCapacityLabel(room.capienza) : 'N/D'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout compatto (originale)
  return (
    <button
      onClick={() => onRoomClick(room)}
      className={`
        ${getCardColor()}
        p-4 rounded-lg border-2 text-white font-semibold
        transform transition-all duration-200 hover:scale-105 shadow-lg
        relative w-full
      `}
    >
      <div className="text-center space-y-2">
        {/* ID e Nome */}
        <div>
          <div className="text-lg font-bold">{room.id}</div>
          <div className="text-xs mt-1 opacity-90">{room.nome}</div>
        </div>

        {/* Capacità */}
        {room.capienza && (
          <div className="text-xs opacity-90">
            <div className="flex items-center justify-center gap-1">
              <span>{getCapacityIcon(room.capienza)}</span>
              <span>{room.capienza}</span>
            </div>
            <div className="text-xs opacity-75 mt-1">
              {getCapacityLabel(room.capienza)}
            </div>
          </div>
        )}

        {/* Informazioni prenotazioni */}
        {showBookingInfo && (
          <div className="text-xs">
            <div className="bg-black bg-opacity-20 rounded px-2 py-1">
              {bookingStatus.status === 'occupata' && (
                <div>
                  <div className="font-medium">Occupata</div>
                  <div className="opacity-75">fino alle {bookingStatus.until}</div>
                </div>
              )}
              
              {bookingStatus.status === 'presto-occupata' && (
                <div>
                  <div className="font-medium">Libera</div>
                  <div className="opacity-75">occupata alle {bookingStatus.nextAt}</div>
                </div>
              )}
              
              {bookingStatus.status === 'libera' && (
                <div className="font-medium">Disponibile</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Badge numero prenotazioni */}
      {showBookingInfo && room.bookings && room.bookings.length > 0 && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const todayBookings = room.bookings.filter(booking => booking.date === today);
              return todayBookings.length > 0 ? todayBookings.length : room.bookings.length;
            })()}
          </div>
        </div>
      )}
    </button>
  );
}
