import { useState, useEffect } from 'react';
import { toggleRoomBlock } from '../../services/bookingService';

const RoomCard = ({ room, onBook, onEdit, isAdmin }) => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(room.isBlocked || room.blocked !== null);

  // Aggiorna lo stato quando il room prop cambia
  useEffect(() => {
    setIsBlocked(room.isBlocked || room.blocked !== null);
  }, [room.isBlocked, room.blocked]);

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

  const getStatusColor = () => {
    if (isBlocked || room.isBlocked || room.blocked !== null) {
      return 'bg-red-500 text-white border-red-500';
    }
    if (room.status === 'prenotata') {
      return 'bg-yellow-500 text-white border-yellow-500';
    }
    return 'bg-green-500 text-white border-green-500';
  };

  const getStatusText = () => {
    if (isBlocked || room.isBlocked || room.blocked !== null) {
      return 'BLOCCATA';
    }
    if (room.status === 'prenotata') {
      return 'PRENOTATA';
    }
    return 'LIBERA';
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
              {room.name || `Stanza ${room.id}`}
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
            Piano {room.floor || 'N/A'}
          </div>

          {room.capacity && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {room.capacity} posti
            </div>
          )}

          {room.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {room.description}
            </p>
          )}
        </div>

        {/* Attrezzature/Features */}
        {room.features && room.features.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {room.features.slice(0, 3).map((feature, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  {feature}
                </span>
              ))}
              {room.features.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                  +{room.features.length - 3} altro
                </span>
              )}
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
