import { useRoomDetails } from '../../hooks/useRoomDetails';
import { getCapacityIcon, getCapacityLabel, getCapacityColor } from '../../utils/roomUtils';

export default function SmartRoomDetail({ roomId, isAdmin = false, onClose }) {
  const { 
    room, 
    loading, 
    error, 
    hasBookings, 
    dataSource, 
    refreshRoom, 
    getRoomStatus, 
    getBookingStats
  } = useRoomDetails(roomId, isAdmin);

  const roomStatus = getRoomStatus();
  const bookingStats = getBookingStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dettagli stanza...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={refreshRoom}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold text-gray-900">Stanza non trovata</h3>
        <p className="text-gray-600">La stanza richiesta non esiste o non è accessibile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header con stato */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Stanza {room.id} - {room.name}
            </h1>
            <p className="text-gray-600">Piano {room.floor}</p>
          </div>
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Stato attuale */}
        <div className="flex items-center space-x-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            roomStatus.status === 'available' ? 'bg-green-100 text-green-800' :
            roomStatus.status === 'occupied' ? 'bg-red-100 text-red-800' :
            roomStatus.status === 'soon' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              roomStatus.status === 'available' ? 'bg-green-400' :
              roomStatus.status === 'occupied' ? 'bg-red-400' :
              roomStatus.status === 'soon' ? 'bg-yellow-400' :
              'bg-gray-400'
            }`}></div>
            {roomStatus.text}
          </div>

          {/* Informazioni aggiuntive sullo stato */}
          {roomStatus.until && (
            <span className="text-sm text-gray-600">
              fino alle {roomStatus.until}
            </span>
          )}
          
          {roomStatus.hoursUntil && (
            <span className="text-sm text-gray-600">
              (libera per {Math.floor(roomStatus.hoursUntil)}h)
            </span>
          )}
        </div>

        {/* Avviso tipo di dati */}
        <div className="mt-4">
          <div className={`text-xs px-2 py-1 rounded inline-block ${
            dataSource === 'details' ? 'bg-blue-100 text-blue-700' :
            dataSource === 'basic' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {dataSource === 'details' && hasBookings && '📋 Dati completi con prenotazioni'}
            {dataSource === 'basic' && '📝 Dati base (prenotazioni non disponibili)'}
            {dataSource === 'error' && '⚠️ Dati limitati'}
          </div>
        </div>
      </div>

      {/* Informazioni principali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Capacità */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Capacità</h3>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getCapacityIcon(room.capacity)}</span>
            <div>
              <div className={`text-xl font-bold ${getCapacityColor(room.capacity)}`}>
                {room.capacity} posti
              </div>
              <div className="text-sm text-gray-600">
                {getCapacityLabel(room.capacity)}
              </div>
            </div>
          </div>
        </div>

        {/* Piano */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Piano</h3>
          <div className="text-xl font-bold text-gray-700">
            Piano {room.floor}
          </div>
        </div>

        {/* Statistiche prenotazioni (se disponibili) */}
        {hasBookings && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Prenotazioni</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Totali:</span>
                <span className="font-medium">{bookingStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Prossime:</span>
                <span className="font-medium text-blue-600">{bookingStats.upcoming}</span>
              </div>
              {bookingStats.current > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In corso:</span>
                  <span className="font-medium text-green-600">{bookingStats.current}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Descrizione */}
      {room.description && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Descrizione</h3>
          <p className="text-gray-700 leading-relaxed">{room.description}</p>
        </div>
      )}

      {/* Attrezzature */}
      {room.equipment && room.equipment.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Attrezzature Disponibili</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {room.equipment.map((item, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg p-3">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prenotazioni dettagliate (se disponibili) */}
      {hasBookings && room.bookings && room.bookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Prenotazioni Recenti</h3>
            <button
              onClick={refreshRoom}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Aggiorna
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {room.bookings
              .sort((a, b) => new Date(`${b.date}T${b.startTime}`) - new Date(`${a.date}T${a.startTime}`))
              .slice(0, 10)
              .map((booking, index) => {
                const isPast = new Date(`${booking.date}T${booking.endTime}`) < new Date();
                const isCurrent = roomStatus.currentBooking?.id === booking.id;
                
                return (
                  <div key={booking.id || index} className={`border rounded-lg p-4 ${
                    isCurrent ? 'border-green-400 bg-green-50' :
                    isPast ? 'border-gray-200 bg-gray-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(booking.date).toLocaleDateString('it-IT', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {booking.startTime} - {booking.endTime}
                        </div>
                        {booking.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {booking.description}
                          </div>
                        )}
                        {booking.userName && (
                          <div className="text-xs text-gray-500 mt-1">
                            {booking.userName}
                          </div>
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        isCurrent ? 'bg-green-100 text-green-700' :
                        isPast ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {isCurrent ? 'In corso' : isPast ? 'Completata' : 'Prossima'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Messaggio per stanze senza prenotazioni */}
      {!hasBookings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Informazioni di prenotazione non disponibili
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Il sistema non ha potuto recuperare le informazioni dettagliate sulle prenotazioni per questa stanza. 
                  Sono disponibili solo le informazioni base.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug info */}
      {/*
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <details className="text-xs">
          <summary className="font-medium text-gray-700 cursor-pointer">Debug Info</summary>
          <pre className="mt-2 text-gray-600 whitespace-pre-wrap">
            {JSON.stringify({
              roomId: room.id,
              dataSource,
              hasBookings,
              bookingsCount: room.bookings?.length || 0,
              roomStatus: roomStatus,
              bookingStats
            }, null, 2)}
          </pre>
        </details>
      </div>
      */}
    </div>
  );
}
