import { useState, useEffect } from 'react';
import { getMyBookings, deleteBooking } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';
import EditBookingModal from './EditBookingModal';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  console.log("🔄 MyBookings - Current state:", { 
    bookings, 
    loading, 
    error, 
    isBookingsArray: Array.isArray(bookings),
    currentUser
  });

  const loadBookings = async () => {
    console.log(`📋 Caricando le mie prenotazioni personali`);
    
    // Carica sempre solo le proprie prenotazioni (non admin mode)
    const result = await getMyBookings();
    
    if (result.success) {
      // Assicurati che i dati siano sempre un array
      const allBookingsData = Array.isArray(result.data) ? result.data : [];
      console.log("📋 Le mie prenotazioni caricate:", allBookingsData);
      console.log("📋 Stati prenotazioni:", allBookingsData.map(b => ({ id: b.id, stato: b.stato, userName: b.userName })));
      
      // Filtra solo le prenotazioni attive (non annullate)
      const activeBookings = allBookingsData.filter(booking => {
        const isActive = booking.stato !== 'ANNULLATA';
        console.log(`📋 Prenotazione ${booking.id} - Stato: "${booking.stato}" - Attiva: ${isActive}`);
        return isActive;
      });
      console.log("📋 Le mie prenotazioni filtrate (attive):", activeBookings);
      
      setBookings(activeBookings);
      setError(null);
    } else {
      setError(result.error);
      setBookings([]); // Reset a array vuoto in caso di errore
    }
    setLoading(false);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      
      // Prima carica l'utente corrente
      const userResult = await getCurrentUser();
      if (userResult && userResult.success) {
        setCurrentUser(userResult.data);
        console.log("👤 Utente caricato:", userResult.data);
      } else {
        console.error("❌ Errore caricamento utente:", userResult);
        setError("Errore nel caricamento del profilo utente");
        setLoading(false);
        return;
      }
      
      // Carica sempre solo le proprie prenotazioni
      await loadBookings();
    };
    
    initializeComponent();
  }, []);

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return;
    }

    console.log("🗑️ Cancellando prenotazione personale:", bookingId);
    setCancellingId(bookingId);

    try {
      const result = await deleteBooking(bookingId);
      console.log("🗑️ Risultato cancellazione:", result);
      
      if (result.success) {
        setSuccessMessage('Prenotazione cancellata con successo');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadBookings(); // Ricarica la lista
      } else {
        setError(result.error || 'Errore durante la cancellazione della prenotazione');
      }
    } catch (err) {
      console.error("🚨 Errore cancellazione prenotazione:", err);
      setError('Errore di rete durante la cancellazione della prenotazione');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCloseEditModal = () => {
    setEditingBooking(null);
  };

  const handleEditSuccess = () => {
    setEditingBooking(null);
    setSuccessMessage('Prenotazione modificata con successo!');
    setTimeout(() => setSuccessMessage(''), 3000);
    loadBookings(); // Ricarica la lista
  };

  const canCancel = (booking) => {
    if (!booking || !booking.date) return false;
    
    const today = new Date();
    const bookingDate = new Date(booking.date);
    
    // Può modificare solo se la prenotazione è futura
    return bookingDate > today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    if (bookingDate < now) {
      return 'bg-gray-100 text-gray-800'; // Completata
    } else {
      return 'bg-green-100 text-green-800'; // Attiva
    }
  };

  const getStatusText = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.date);
    
    if (bookingDate < now) {
      return 'Completata';
    } else {
      return 'Attiva';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento prenotazioni...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Le Mie Prenotazioni</h1>
        <p className="text-gray-600">Visualizza e modifica le tue prenotazioni personali</p>
      </div>

      {/* Messaggio di successo */}
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Errore */}
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex">
            <div>
              <p className="font-bold">Errore nel caricamento delle prenotazioni</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline"
              >
                Ricarica la pagina
              </button>
            </div>
          </div>
        </div>
      )}

      {!Array.isArray(bookings) || bookings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Nessuna prenotazione
          </h3>
          <p className="text-gray-500 mb-4">
            {!Array.isArray(bookings) ? 
              'Errore nel caricamento dei dati. Riprova.' : 
              'Non hai ancora effettuato nessuna prenotazione'
            }
          </p>
          <button 
            onClick={() => window.location.href = '/bookings/rooms'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {!Array.isArray(bookings) ? 'Ricarica pagina' : 'Prenota una stanza'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(bookings) && bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {booking.roomName || `Stanza ${booking.roomId || booking.aulaId || 'N/A'}`}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking)}`}>
                          {getStatusText(booking)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Data:</span>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Orario:</span>
                        <span>{booking.startTime || 'N/A'} - {booking.endTime || 'N/A'}</span>
                      </div>

                      {booking.purpose && (
                        <div className="flex items-center col-span-1 md:col-span-2">
                          <span className="font-medium mr-2">Scopo:</span>
                          <span className="truncate">{booking.purpose}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canCancel(booking) && (
                    <div className="ml-4 flex gap-2">
                      {/* Pulsante modifica */}
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-300 rounded transition-colors"
                      >
                        Modifica
                      </button>
                      
                      {/* Pulsante cancella */}
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? 'Cancellando...' : 'Cancella'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modale di modifica */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default MyBookings;
