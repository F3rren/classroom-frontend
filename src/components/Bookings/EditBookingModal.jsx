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

const EditBookingModal = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '', // Sostituisce startTime/endTime
    startTime: '',
    endTime: '',
    purpose: '',
    roomId: '',
    corsoId: '1'
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [roomAvailabilityInfo, setRoomAvailabilityInfo] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [operationType, setOperationType] = useState(''); // 'load', 'check', 'update'

  // Imposta data minima (oggi)
  const today = formatDateLocal(new Date());

  // Popola il form con i dati della prenotazione esistente
  useEffect(() => {
    if (booking) {
      // Converti il formato datetime del backend in date e time separati
      const startDateTime = new Date(booking.inizio || booking.startTime);
      const endDateTime = new Date(booking.fine || booking.endTime);
      
      // Determina la fascia oraria in base agli orari
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
        purpose: booking.descrizione || booking.purpose || '',
        roomId: (booking.aulaId || booking.roomId || '').toString(),
        corsoId: (booking.corsoId || '1').toString()
      });
    }
  }, [booking]);

  // Aggiorna automaticamente startTime e endTime quando si seleziona una fascia oraria
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

  // Carica le stanze disponibili
  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset risultato disponibilità quando cambiano i dati del form
  useEffect(() => {
    setRoomAvailabilityInfo(null);
    setError(null);
  }, [formData.date, formData.timeSlot, formData.roomId]);

  // Controllo automatico della disponibilità quando vengono selezionati data, fascia oraria e stanza
  useEffect(() => {
    const checkRoomAvailabilityInfo = async () => {
      if (!formData.date || !formData.timeSlot || !formData.roomId) {
        setRoomAvailabilityInfo(null);
        return;
      }

      setCheckingAvailability(true);
      setError(null);
      
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const bookingsResult = await getRoomBookingsByDate(formData.roomId, formData.date);
          
          if (bookingsResult.success) {
            const availabilityInfo = analyzeRoomAvailability(bookingsResult.data);
            setRoomAvailabilityInfo(availabilityInfo);
            setCheckingAvailability(false);
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
      
      setCheckingAvailability(false);
    };

    checkRoomAvailabilityInfo();
  }, [formData.date, formData.timeSlot, formData.roomId]);

  const loadRooms = async (isRetryAttempt = false) => {
    setLoadingRooms(true);
    if (!isRetryAttempt) {
      setError(null);
      setRetryAttempts(0);
      setIsRetrying(false);
      setOperationType('load');
    }

    let attempts = isRetryAttempt ? retryAttempts : 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          setIsRetrying(true);
          setRetryAttempts(attempts);
        }

        const result = await getAllRooms();
        
        if (result.success) {
          setAvailableRooms(result.data || []);
          setError(null);
          setIsRetrying(false);
          setRetryAttempts(0);
          setLoadingRooms(false);
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
            break;
          }
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        const enhancedMessage = getEnhancedErrorMessage(err.message, errorType);
        
        if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        } else {
          setError(enhancedMessage);
          break;
        }
      }
    }
    
    setLoadingRooms(false);
    setIsRetrying(false);
    setRetryAttempts(0);
  };

  // Genera opzioni orarie (non più utilizzate, ma mantengo per compatibilità)
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  // Funzione per verificare se una fascia oraria specifica è disponibile
  const isTimeSlotAvailable = (timeSlotId) => {
    if (!roomAvailabilityInfo || !roomAvailabilityInfo.timeSlots) return true;
    return roomAvailabilityInfo.timeSlots[timeSlotId]?.available !== false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica che tutti i campi obbligatori siano compilati
    if (!formData.date || !formData.timeSlot || !formData.roomId) {
      const errorType = 'VALIDATION';
      const enhancedMessage = getEnhancedErrorMessage('Tutti i campi obbligatori devono essere compilati', errorType);
      setError(enhancedMessage);
      return;
    }

    // Verifica se la fascia oraria è disponibile
    if (!isTimeSlotAvailable(formData.timeSlot)) {
      const errorType = 'CONFLICT';
      const enhancedMessage = getEnhancedErrorMessage('La fascia oraria selezionata non è disponibile', errorType);
      setError(enhancedMessage);
      return;
    }

    setLoading(true);
    setError(null);
    setOperationType('update');
    setRetryAttempts(0);
    setIsRetrying(false);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        if (attempts > 0) {
          setIsRetrying(true);
          setRetryAttempts(attempts);
        }

        const result = await updateBooking(booking.id, formData);

        if (result.success) {
          setIsRetrying(false);
          onSuccess('Prenotazione aggiornata con successo!');
          onClose();
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
            break;
          }
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        const enhancedMessage = getEnhancedErrorMessage(err.message, errorType);
        
        if (isRetryableError(errorType) && attempts < maxAttempts - 1) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          continue;
        } else {
          setError(enhancedMessage);
          break;
        }
      }
    }
    
    setLoading(false);
    setIsRetrying(false);
    setRetryAttempts(0);
  };

  const retryOperation = () => {
    setError(null);
    setRetryAttempts(0);
    setIsRetrying(false);
    
    if (operationType === 'load') {
      loadRooms(false);
    }
    // La verifica disponibilità è automatica, si riattiverà automaticamente
    // Per 'update' non facciamo retry automatico, l'utente deve ripremere submit
  };

  const selectedRoom = availableRooms.find(room => room.id?.toString() === formData.roomId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
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

        {/* Informazioni prenotazione corrente */}
        <div className="px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <h4 className="font-medium text-gray-900">Prenotazione #{booking.id}</h4>
          <div className="text-sm text-gray-600 mt-1">
            <span>Attualmente: {booking.roomName || `Stanza ${booking.aulaId || booking.roomId}`}</span>
            <span className="mx-2">•</span>
            <span>{new Date(booking.inizio || booking.date).toLocaleDateString('it-IT')}</span>
          </div>
        </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="text-red-600 text-xl mr-3 flex-shrink-0">⚠️</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800 mb-1">Errore modifica prenotazione</h4>
                    <p className="text-red-700 text-sm mb-3">{error}</p>
                    <div className="flex space-x-2">
                      {operationType !== 'update' && (
                        <button
                          type="button"
                          onClick={retryOperation}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                        >
                          Riprova
                        </button>
                      )}
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
              {/* Selezione stanza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stanza <span className="text-red-500">*</span>
                </label>
                {loadingRooms ? (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                    {isRetrying && operationType === 'load' ? 
                      `Caricamento stanze... (${retryAttempts}/3)` : 
                      'Caricamento stanze...'
                    }
                  </div>
                ) : (
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona una stanza...</option>
                    {availableRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name || `Stanza ${room.id}`} - Piano {room.floor}
                        {room.capacity && ` (${room.capacity} posti)`}
                      </option>
                    ))}
                  </select>
                )}
                {selectedRoom && (
                  <p className="text-xs text-gray-500 mt-1">
                    Piano {selectedRoom.floor} • {selectedRoom.capacity} posti
                  </p>
                )}
              </div>

              {/* Data */}
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
              </div>

              {/* Fascia Oraria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fascia Oraria <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const isAvailable = isTimeSlotAvailable(slot.id);
                    const isSelected = formData.timeSlot === slot.id;
                    
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, timeSlot: slot.id }))}
                        disabled={!isAvailable}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isAvailable
                            ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                            : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-semibold">{slot.label}</div>
                        <div className="text-xs opacity-75">{slot.hours}</div>
                        {!isAvailable && (
                          <div className="absolute top-1 right-1 text-red-500 text-xs">
                            ✗
                          </div>
                        )}
                        {isAvailable && (
                          <div className="absolute top-1 right-1 text-green-500 text-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {formData.timeSlot && (
                  <div className="mt-2 text-sm text-gray-600">
                    {TIME_SLOTS.find(s => s.id === formData.timeSlot)?.label}: {' '}
                    {TIME_SLOTS.find(s => s.id === formData.timeSlot)?.hours}
                  </div>
                )}
                
                {/* Avviso controllo disponibilità automatico */}
                {checkingAvailability && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Controllo disponibilità...
                    </div>
                  </div>
                )}
              </div>

              {/* Corso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Corso
                </label>
                <input
                  type="number"
                  value={formData.corsoId}
                  onChange={(e) => setFormData(prev => ({ ...prev, corsoId: e.target.value }))}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">ID del corso per cui si prenota (default: 1)</p>
              </div>

              {/* Pulsante verifica disponibilità rimosso - ora è automatico */}

              {/* Stato disponibilità stanza */}
              {roomAvailabilityInfo && formData.date && formData.roomId && (
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
                      
                      {/* Mostra stato delle finestre temporali */}
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

              {/* Descrizione */}
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

            {/* Azioni */}
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
                disabled={loading || (formData.timeSlot && !isTimeSlotAvailable(formData.timeSlot))}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isRetrying && operationType === 'update' ? 
                      `Tentativo ${retryAttempts}/3...` : 
                      'Aggiornando...'
                    }
                  </div>
                ) : (formData.timeSlot && !isTimeSlotAvailable(formData.timeSlot)) ? (
                  'Fascia oraria non disponibile'
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
