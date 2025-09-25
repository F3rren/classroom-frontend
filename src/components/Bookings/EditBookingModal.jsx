import { useState, useEffect } from 'react';
import { updateBooking, getRoomBookingsByDate, analyzeRoomAvailability, getAllRooms } from '../../services/bookingService';

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
  if (errorMessage.includes('conflict') || errorMessage.includes('already exists') || errorMessage.includes('già prenotata') || errorMessage.includes('non disponibile')) {
    return 'CONFLICT';
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
      return 'Sessione scaduta. Effettua nuovamente il login per modificare la prenotazione.';
    case 'NETWORK':
      return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    case 'SERVER':
      return 'Il server è temporaneamente non disponibile. Riprova tra qualche momento.';
    case 'CONFLICT':
      return 'La fascia oraria selezionata è già occupata. Scegli un altro orario.';
    case 'VALIDATION':
      if (baseMessage.includes('Data')) return 'Seleziona una data valida per la prenotazione.';
      if (baseMessage.includes('orario') || baseMessage.includes('time')) return 'Seleziona una fascia oraria valida.';
      if (baseMessage.includes('stanza') || baseMessage.includes('room')) return 'Seleziona una stanza valida.';
      return 'Controlla che tutti i campi obbligatori siano compilati correttamente.';
    default:
      return baseMessage.includes('prenotazione') ? baseMessage : `Errore nella modifica: ${baseMessage}`;
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

// Fasce orarie predefinite
const TIME_SLOTS = [
  { id: 'morning', label: 'Mattina', startTime: '09:00', endTime: '13:00', hours: '9:00-13:00' },
  { id: 'afternoon', label: 'Pomeriggio', startTime: '14:00', endTime: '18:00', hours: '14:00-18:00' }
];

const EditBookingModal = ({ booking, room, onClose, onSuccess }) => {
  
  
  
  const [roomName, setRoomName] = useState('');
  
  const roomData = room || {
    id: booking?.aula?.id || booking?.aulaId || booking?.roomId,
    name: roomName || booking?.aula?.nome || booking?.nomeAula || booking?.roomName || booking?.aulaNome || 
          booking?.stanzaNome || booking?.aulaName || 
          (booking?.aulaId ? `Stanza ${booking.aulaId}` : 
           booking?.roomId ? `Stanza ${booking.roomId}` : 'Stanza Sconosciuta'),
    nome: roomName || booking?.aula?.nome || booking?.nomeAula || booking?.roomName || booking?.aulaNome || 
          booking?.stanzaNome || booking?.aulaName || 
          (booking?.aulaId ? `Stanza ${booking.aulaId}` : 
           booking?.roomId ? `Stanza ${booking.roomId}` : 'Stanza Sconosciuta'),
    floor: booking?.aula?.piano || booking?.floor || booking?.piano || 1,
    piano: booking?.aula?.piano || booking?.floor || booking?.piano || 1,
    capacity: booking?.aula?.capienza || booking?.capacity || booking?.capienza || null
  };
  
  
  
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    startTime: '',
    endTime: '',
    purpose: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomAvailabilityInfo, setRoomAvailabilityInfo] = useState(null);
  const [checkingRoomInfo, setCheckingRoomInfo] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const today = formatDateLocal(new Date());

  useEffect(() => {
    const fetchRoomName = async () => {
      if (!room && !booking?.nomeAula && !booking?.roomName && (booking?.aulaId || booking?.roomId)) {
        try {
          const roomsResult = await getAllRooms();
          if (roomsResult.success && roomsResult.data) {
            const targetRoom = roomsResult.data.find(r => 
              r.id === (booking.aulaId || booking.roomId)
            );
            if (targetRoom) {
              setRoomName(targetRoom.nome || targetRoom.name || '');
              
            }
          }
        } catch {
          return null;
        }
      }
    };
    
    fetchRoomName();
  }, [booking?.aulaId, booking?.roomId, booking?.nomeAula, booking?.roomName, room]);

  useEffect(() => {
    if (booking) {
      const startDateTime = new Date(booking.inizio || booking.startTime);
      const endDateTime = new Date(booking.fine || booking.endTime);
      
      let timeSlot = '';
      const startHour = startDateTime.getHours();
      if (startHour >= 9 && startHour < 13) {
        timeSlot = 'morning';
      } else if (startHour >= 14 && startHour < 18) {
        timeSlot = 'afternoon';
      }
      
      setFormData({
        date: formatDateLocal(startDateTime),
        timeSlot: timeSlot,
        startTime: startDateTime.toTimeString().slice(0, 5),
        endTime: endDateTime.toTimeString().slice(0, 5),
        purpose: booking.descrizione || booking.purpose || ''
      });
    }
  }, [booking]);

  useEffect(() => {
    if (formData.timeSlot) {
      const selectedSlot = TIME_SLOTS.find(slot => slot.id === formData.timeSlot);
      if (selectedSlot) {
        setFormData(prev => ({
          ...prev,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        }));
      }
    }
  }, [formData.timeSlot]);

  useEffect(() => {
    setError(null);
  }, [formData.date, formData.timeSlot]);

  useEffect(() => {
    const checkRoomAvailabilityInfo = async () => {
      if (!formData.date || !roomData?.id) {
        setRoomAvailabilityInfo(null);
        return;
      }

      setCheckingRoomInfo(true);
      setError(null);
      
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const bookingsResult = await getRoomBookingsByDate(roomData.id, formData.date);
          
          if (bookingsResult.success) {
            const availabilityInfo = analyzeRoomAvailability(bookingsResult.data);
            setRoomAvailabilityInfo(availabilityInfo);
            setCheckingRoomInfo(false);
            return;
          } else {
            const errorType = categorizeError(bookingsResult.error);
            const enhancedMessage = getEnhancedErrorMessage(bookingsResult.error, errorType);
            
            if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, attempts * 1000));
              continue;
            } else {
              setError(enhancedMessage);
              setRoomAvailabilityInfo(null);
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
            setRoomAvailabilityInfo(null);
            break;
          }
        }
      }
      
      setCheckingRoomInfo(false);
    };

    checkRoomAvailabilityInfo();
  }, [formData.date, roomData?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.timeSlot) {
      setError('Seleziona una data e una fascia oraria per procedere.');
      return;
    }

    setLoading(true);
    setError(null);
    setRetryAttempts(0);
    setIsRetrying(false);

    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const selectedSlot = TIME_SLOTS.find(slot => slot.id === formData.timeSlot);
        const startDateTime = `${formData.date}T${selectedSlot.startTime}:00`;
        const endDateTime = `${formData.date}T${selectedSlot.endTime}:00`;

        const updateData = {
          aulaId: roomData.id,
          corsoId: null, // Prenotazioni libere per ora
          inizio: startDateTime,
          fine: endDateTime,
          descrizione: formData.purpose || ''
        };

        const result = await updateBooking(booking.id, updateData);
        
        if (result.success) {
          
          if (onSuccess) {
            onSuccess(result.data);
          }
          onClose();
          return;
        } else {
          const errorType = categorizeError(result.error);
          const enhancedMessage = getEnhancedErrorMessage(result.error, errorType);
          
          if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
            attempts++;
            setRetryAttempts(attempts);
            setIsRetrying(true);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
            continue;
          } else {
            setError(enhancedMessage);
            setLoading(false);
            setIsRetrying(false);
            return;
          }
        }
      } catch (error) {
        
        const errorType = categorizeError(error.message);
        const enhancedMessage = getEnhancedErrorMessage(error.message, errorType);
        
        if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
          attempts++;
          setRetryAttempts(attempts);
          setIsRetrying(true);
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        } else {
          setError(enhancedMessage);
          setLoading(false);
          setIsRetrying(false);
          return;
        }
      }
    }
  };

  const retryOperation = () => {
    setError(null);
    setRetryAttempts(0);
    setIsRetrying(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Modifica Prenotazione
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors w-6 h-6 flex items-center justify-center"
            >
              <span className="text-lg font-bold">×</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <h4 className="font-medium text-gray-900">
            {roomData.name || roomData.nome || `Stanza ${roomData.id}`}
          </h4>
          <div className="text-sm text-gray-600 mt-1">
            <span>Piano {roomData.floor || roomData.piano}</span>
            {(roomData.capacity || roomData.capienza) && <span> • {roomData.capacity || roomData.capienza} posti</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="text-red-600 text-xl mr-3 flex-shrink-0">🚫</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 mb-1">Errore nella prenotazione</h4>
                    <p className="text-red-700 text-sm mb-3">{error}</p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={retryOperation}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Riprova
                      </button>
                      <button
                        type="button"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={today}
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {checkingRoomInfo && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Controllo disponibilità...
                    </div>
                  </div>
                )}
                
                {roomAvailabilityInfo && formData.date && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    roomAvailabilityInfo.status === 'free' ? 'bg-green-50 border border-green-200 text-green-700' :
                    roomAvailabilityInfo.status === 'partial' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                    'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {roomAvailabilityInfo.status === 'free' && (
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2 font-bold">✓</span>
                        Stanza libera per tutta la giornata
                      </div>
                    )}
                    
                    {roomAvailabilityInfo.status === 'partial' && (
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-600 mr-2 font-bold">⚠</span>
                          <span className="font-medium">Disponibilità parziale</span>
                        </div>
                        
                        {roomAvailabilityInfo.timeSlots && (
                          <div className="grid grid-cols-2 gap-1 mt-2">
                            {Object.entries(roomAvailabilityInfo.timeSlots).map(([slotId, slot]) => (
                              <div key={slotId} className={`text-center p-1 rounded text-xs ${
                                slot.available 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                <div className="font-medium">
                                  {slotId === 'morning' ? 'Mattina' : 'Pomeriggio'}
                                </div>
                                <div className="text-xs">
                                  {slot.available ? '✓ Libera' : '✗ Occupata'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {roomAvailabilityInfo.status === 'full' && (
                      <div className="flex items-center">
                        <span className="text-red-600 mr-2 font-bold">×</span>
                        <span className="font-medium">{roomAvailabilityInfo.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fascia Oraria <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot.id }))}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.timeSlot === slot.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold">{slot.label}</div>
                      <div className="text-xs opacity-75">{slot.hours}</div>
                    </button>
                  ))}
                </div>
                {formData.timeSlot && (
                  <div className="mt-2 text-sm text-gray-600">
                    {TIME_SLOTS.find(s => s.id === formData.timeSlot)?.label}: {' '}
                    {TIME_SLOTS.find(s => s.id === formData.timeSlot)?.hours}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scopo della prenotazione
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Es: Riunione di lavoro, lezione, presentazione..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Facoltativo</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isRetrying ? (
                      <span>Tentativo {retryAttempts}/3...</span>
                    ) : (
                      <span>Aggiornando...</span>
                    )}
                  </div>
                ) : (
                  'Aggiorna Prenotazione'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;