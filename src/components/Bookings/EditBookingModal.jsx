import { useState, useEffect } from 'react';
import { updateBooking, checkAvailability, getAllRooms } from '../../services/bookingService';

// Funzione helper per convertire date senza problemi di fuso orario
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditBookingModal = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
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
  const [availabilityResult, setAvailabilityResult] = useState(null);

  // Imposta data minima (oggi)
  const today = formatDateLocal(new Date());

  // Popola il form con i dati della prenotazione esistente
  useEffect(() => {
    if (booking) {
      // Converti il formato datetime del backend in date e time separati
      const startDateTime = new Date(booking.inizio || booking.startTime);
      const endDateTime = new Date(booking.fine || booking.endTime);
      
      setFormData({
        date: formatDateLocal(startDateTime),
        startTime: startDateTime.toTimeString().slice(0, 5),
        endTime: endDateTime.toTimeString().slice(0, 5),
        purpose: booking.descrizione || booking.purpose || '',
        roomId: (booking.aulaId || booking.roomId || '').toString(),
        corsoId: (booking.corsoId || '1').toString()
      });
    }
  }, [booking]);

  // Carica le stanze disponibili
  useEffect(() => {
    loadRooms();
  }, []);

  // Reset risultato disponibilità quando cambiano i dati del form
  useEffect(() => {
    setAvailabilityResult(null);
    setError(null);
  }, [formData.date, formData.startTime, formData.endTime, formData.roomId]);

  const loadRooms = async () => {
    setLoadingRooms(true);
    const result = await getAllRooms();
    if (result.success) {
      setAvailableRooms(result.data || []);
    } else {
      setError('Errore nel caricamento delle stanze: ' + result.error);
    }
    setLoadingRooms(false);
  };

  // Genera opzioni orarie
  const timeOptions = [];
  for (let hour = 8; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

  // Funzione per verificare la disponibilità
  const handleCheckAvailability = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.roomId) {
      setError('Inserisci tutti i campi obbligatori per verificare la disponibilità');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('L\'orario di fine deve essere successivo a quello di inizio');
      return;
    }

    setCheckingAvailability(true);
    setError(null);
    setAvailabilityResult(null);

    try {
      const result = await checkAvailability(
        formData.roomId,
        formData.date,
        formData.startTime,
        formData.endTime
      );

      if (result.success) {
        setAvailabilityResult(result.data);
      } else {
        setError('Errore nella verifica della disponibilità: ' + result.error);
      }
    } catch (err) {
      console.error('Errore durante la verifica della disponibilità:', err);
      setError('Errore durante la verifica della disponibilità');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica che tutti i campi obbligatori siano compilati
    if (!formData.date || !formData.startTime || !formData.endTime || !formData.roomId) {
      setError('Tutti i campi obbligatori devono essere compilati');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError('L\'orario di fine deve essere successivo a quello di inizio');
      return;
    }

    // Se non abbiamo verificato la disponibilità, facciamolo ora
    if (!availabilityResult) {
      setError('Verifica prima la disponibilità della stanza');
      return;
    }

    if (!availabilityResult.available) {
      setError('La stanza non è disponibile nell\'orario selezionato');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await updateBooking(booking.id, formData);

      if (result.success) {
        onSuccess('Prenotazione aggiornata con successo!');
        onClose();
      } else {
        setError(result.error || 'Errore durante l\'aggiornamento della prenotazione');
      }
    } catch (err) {
      console.error('Errore durante l\'aggiornamento della prenotazione:', err);
      setError('Errore durante l\'aggiornamento della prenotazione');
    } finally {
      setLoading(false);
    }
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
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
                    Caricamento stanze...
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

              {/* Orari */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora inizio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona...</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora fine <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona...</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
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

              {/* Pulsante verifica disponibilità */}
              {formData.date && formData.startTime && formData.endTime && formData.roomId && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleCheckAvailability}
                    disabled={checkingAvailability}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {checkingAvailability ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verificando...
                      </div>
                    ) : (
                      'Verifica Disponibilità'
                    )}
                  </button>
                </div>
              )}

              {/* Risultato verifica disponibilità */}
              {availabilityResult && (
                <div className={`p-3 rounded-md ${availabilityResult.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className={`text-sm font-medium ${availabilityResult.available ? 'text-green-800' : 'text-red-800'}`}>
                    {availabilityResult.available ? (
                      <div className="flex items-center">
                        <span className="text-green-600 mr-2 font-bold">✓</span>
                        Stanza disponibile
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-red-600 mr-2 font-bold">×</span>
                        Stanza non disponibile
                      </div>
                    )}
                  </div>
                  {availabilityResult.message && (
                    <p className={`text-xs mt-1 ${availabilityResult.available ? 'text-green-600' : 'text-red-600'}`}>
                      {availabilityResult.message}
                    </p>
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
                disabled={loading || !availabilityResult?.available}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aggiornando...
                  </div>
                ) : availabilityResult?.available ? (
                  'Aggiorna Prenotazione'
                ) : (
                  'Verifica disponibilità prima'
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
