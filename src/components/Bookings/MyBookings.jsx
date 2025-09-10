import { useState, useEffect } from 'react';
import { getMyBookings, deleteBooking, getAllBookings } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';
import EditBookingModal from './EditBookingModal';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  console.log("🔄 MyBookings - Current state:", { 
    bookings, 
    loading, 
    error, 
    isBookingsArray: Array.isArray(bookings),
    currentUser,
    isAdmin
  });

  const loadBookings = async (adminMode = isAdmin) => {
    console.log(`📋 Caricando prenotazioni - Admin Mode: ${adminMode}`);
    
    const result = adminMode ? await getAllBookings() : await getMyBookings();
    
    if (result.success) {
      // Assicurati che i dati siano sempre un array
      const bookingsData = Array.isArray(result.data) ? result.data : [];
      console.log("📋 Prenotazioni caricate:", bookingsData);
      setBookings(bookingsData);
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
        const isUserAdmin = userResult.data.ruolo === 'admin';
        setIsAdmin(isUserAdmin);
        
        // Poi carica le prenotazioni appropriate
        let result;
        let actualIsAdmin = false;
        
        if (isUserAdmin) {
          console.log("🔧 Tentativo caricamento prenotazioni admin...");
          result = await getAllBookings();
          
          if (result.success) {
            actualIsAdmin = true;
            console.log("✅ Prenotazioni admin caricate con successo");
          } else {
            console.warn("⚠️ Fallimento caricamento admin, fallback a prenotazioni personali:", result.error);
            // Fallback alle prenotazioni personali dell'admin
            result = await getMyBookings();
            actualIsAdmin = false; // Tratta come utente normale per la UI
          }
        } else {
          result = await getMyBookings();
        }
        
        setIsAdmin(actualIsAdmin); // Aggiorna basandosi sul successo del caricamento admin
        
        if (result.success) {
          const bookingsData = Array.isArray(result.data) ? result.data : [];
          console.log("📋 Prenotazioni caricate:", bookingsData);
          setBookings(bookingsData);
          setError(null);
        } else {
          setError(result.error);
          setBookings([]);
        }
      } else {
        setError("Errore nel caricamento dell'utente");
      }
      setLoading(false);
    };
    
    initializeComponent();
  }, []);

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return;
    }

    setDeletingId(bookingId);
    const result = await deleteBooking(bookingId);
    
    if (result.success) {
      setBookings(bookings.filter(b => b.id !== bookingId));
      setSuccessMessage('Prenotazione eliminata con successo');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      alert('Errore durante la cancellazione: ' + result.error);
    }
    
    setDeletingId(null);
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleCloseEditModal = () => {
    setEditingBooking(null);
  };

  const handleEditSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    // Ricarica le prenotazioni per aggiornare la lista
    loadBookings(isAdmin);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Data non disponibile';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data non valida';
      
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Errore nel parsing della data:', dateString, error);
      return 'Data non valida';
    }
  };

  const getStatusColor = (booking) => {
    if (!booking.date) return 'bg-gray-100 text-gray-800';
    
    try {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      
      if (isNaN(bookingDate.getTime())) return 'bg-gray-100 text-gray-800';
      if (booking.status === 'cancelled') return 'bg-red-100 text-red-800';
      if (bookingDate < today) return 'bg-gray-100 text-gray-800';
      return 'bg-green-100 text-green-800';
    } catch {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (booking) => {
    if (!booking.date) return 'Stato sconosciuto';
    
    try {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      
      if (isNaN(bookingDate.getTime())) return 'Stato sconosciuto';
      if (booking.status === 'cancelled') return 'Cancellata';
      if (bookingDate < today) return 'Completata';
      return 'Attiva';
    } catch {
      return 'Stato sconosciuto';
    }
  };

  const canCancel = (booking) => {
    if (!booking.date) return false;
    
    try {
      const bookingDate = new Date(booking.date);
      const today = new Date();
      
      if (isNaN(bookingDate.getTime())) return false;
      return bookingDate >= today && booking.status !== 'cancelled';
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Caricamento prenotazioni...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errore nel caricamento</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={loadBookings}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
                >
                  Riprova
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Messaggio di successo */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isAdmin ? 'Tutte le prenotazioni' : 'Le tue prenotazioni'}
        </h1>
        <p className="text-gray-600">
          {isAdmin 
            ? 'Visualizza e gestisci tutte le prenotazioni del sistema (modalità amministratore)'
            : 'Visualizza e gestisci le tue prenotazioni delle stanze'
          }
        </p>
      </div>

      {/* Avviso per admin che vede solo le sue prenotazioni */}
      {currentUser?.ruolo === 'admin' && !isAdmin && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Modalità limitata
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <p>Non è stato possibile accedere alle prenotazioni di sistema. Stai visualizzando solo le tue prenotazioni personali.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!Array.isArray(bookings) || bookings.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 01-2-2V3m0 4h10m-5 0v6m3-3h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {isAdmin ? 'Nessuna prenotazione nel sistema' : 'Nessuna prenotazione'}
          </h3>
          <p className="text-gray-500 mb-4">
            {!Array.isArray(bookings) ? 
              'Errore nel caricamento dei dati. Riprova.' : 
              isAdmin 
                ? 'Non ci sono prenotazioni nel sistema'
                : 'Non hai ancora effettuato nessuna prenotazione'
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking)}`}>
                        {getStatusText(booking)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 01-2-2V3m0 4h10m-5 0v6m3-3h4" />
                        </svg>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{booking.startTime || 'N/A'} - {booking.endTime || 'N/A'}</span>
                      </div>

                      {/* Mostra il nome dell'utente in modalità admin */}
                      {isAdmin && booking.userName && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">Utente: {booking.userName}</span>
                        </div>
                      )}

                      {booking.purpose && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">{booking.purpose}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {canCancel(booking) && (
                    <div className="ml-4 flex space-x-2">
                      {/* Pulsante modifica */}
                      <button
                        onClick={() => handleEditBooking(booking)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-300 rounded transition-colors"
                      >
                        Modifica
                      </button>
                      
                      {/* Pulsante elimina */}
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === booking.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                            Eliminando...
                          </div>
                        ) : (
                          'Elimina'
                        )}
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
