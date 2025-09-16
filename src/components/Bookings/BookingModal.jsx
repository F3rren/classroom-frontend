import { useState, useEffect } from 'react';
import { createBooking, getRoomBookingsByDate, analyzeRoomAvailability } from '../../services/bookingService';

// Funzione helper per convertire date senza problemi di fuso orario
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fasce orarie per le aule fisiche (come nel WeeklyCalendar)
const TIME_SLOTS = [
  { id: 'morning', label: 'Mattina', startTime: '09:00', endTime: '13:00', hours: '9:00-13:00' },
  { id: 'afternoon', label: 'Pomeriggio', startTime: '14:00', endTime: '18:00', hours: '14:00-18:00' }
];

const BookingModal = ({ room, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '', // Sostituisce startTime e endTime
    startTime: '',
    endTime: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomAvailabilityInfo, setRoomAvailabilityInfo] = useState(null);
  const [checkingRoomInfo, setCheckingRoomInfo] = useState(false);

  // Imposta data minima (oggi)
  const today = formatDateLocal(new Date());

  // Reset risultato disponibilità quando cambiano i dati del form
  useEffect(() => {
    setError(null);
  }, [formData.date, formData.timeSlot]);

  // Controllo automatico della disponibilità quando viene selezionata la data
  useEffect(() => {
    const checkRoomAvailabilityInfo = async () => {
      if (!formData.date || !room?.id) {
        setRoomAvailabilityInfo(null);
        return;
      }

      setCheckingRoomInfo(true);
      try {
        const bookingsResult = await getRoomBookingsByDate(room.id, formData.date);
        
        if (bookingsResult.success) {
          const availabilityInfo = analyzeRoomAvailability(bookingsResult.data);
          setRoomAvailabilityInfo(availabilityInfo);
        } else {
          console.warn("Errore nel recupero prenotazioni:", bookingsResult.error);
          setRoomAvailabilityInfo(null);
        }
      } catch (err) {
        console.error("Errore nel controllo disponibilità stanza:", err);
        setRoomAvailabilityInfo(null);
      } finally {
        setCheckingRoomInfo(false);
      }
    };

    checkRoomAvailabilityInfo();
  }, [formData.date, room?.id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazioni
    if (!formData.date || !formData.timeSlot) {
      setError('Data e fascia oraria sono obbligatorie');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        roomId: room.id,
        date: formData.date,
        startTime: formData.startTime, // Popolato automaticamente dal timeSlot
        endTime: formData.endTime,     // Popolato automaticamente dal timeSlot
        purpose: formData.purpose.trim(),
        corsoId: 1 // ID corso fisso
      };

      const result = await createBooking(bookingData);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch {
      setError('Errore durante la creazione della prenotazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Prenota Stanza
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors w-6 h-6 flex items-center justify-center"
            >
              <span className="text-lg font-bold">×</span>
            </button>
          </div>
        </div>

        {/* Informazioni stanza */}
        <div className="px-6 py-3 bg-gray-50 border-b flex-shrink-0">
          <h4 className="font-medium text-gray-900">{room.name || `Stanza ${room.id}`}</h4>
          <div className="text-sm text-gray-600 mt-1">
            <span>Piano {room.floor}</span>
            {room.capacity && <span> • {room.capacity} posti</span>}
          </div>
        </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
              
              {/* Avviso automatico disponibilità stanza */}
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
            </div>

            {/* Fascia Oraria */}
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

            {/* Corso */}
            {/* Rimosso campo corso per semplificare l'interfaccia */}

            {/* Pulsante verifica disponibilità rimosso per semplificare l'interfaccia */}

            {/* Risultato verifica disponibilità rimosso */}

            {/* Scopo */}
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Prenotando...
                </div>
              ) : (
                'Prenota'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
