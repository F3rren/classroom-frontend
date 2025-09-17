import { useState, useEffect } from 'react';
import { getAllBookings, deleteBookingAsAdmin } from '../../services/bookingService';
import EditBookingModal from '../Bookings/EditBookingModal';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage?.includes('autorizzazione') || errorMessage?.includes('token')) {
      return 'AUTH';
    }
    if (errorMessage?.includes('connessione') || errorMessage?.includes('rete') || errorMessage?.includes('fetch')) {
      return 'NETWORK';
    }
    if (errorMessage?.includes('server') || errorMessage?.includes('500')) {
      return 'SERVER';
    }
    return 'GENERIC';
  };

  const getEnhancedErrorMessage = (originalError, errorType) => {
    switch (errorType) {
      case 'AUTH':
        return "Sessione scaduta. Effettua nuovamente il login per continuare.";
      case 'NETWORK':
        return "Problema di connessione. Controlla la tua connessione internet e riprova.";
      case 'SERVER':
        return "Errore del server. Il problema è temporaneo, riprova tra qualche momento.";
      default:
        return originalError || "Si è verificato un errore imprevisto. Riprova più tardi.";
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  const loadBookings = async () => {
    const maxRetries = 3;
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        setError(null);
        
        const result = await getAllBookings();
        
        if (result.success) {
          // Assicurati che i dati siano sempre un array
          const allBookingsData = Array.isArray(result.data) ? result.data : [];
          
          // Per gli admin, mostra tutte le prenotazioni (incluse quelle annullate)
          setBookings(allBookingsData);
          setError(null);
          break;
        } else {
          const errorType = categorizeError(result.error);
          
          if (isRetryableError(errorType) && currentRetry < maxRetries) {
            currentRetry++;
            setRetryAttempts(currentRetry);
            const delay = 1000 * currentRetry; // Backoff lineare
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            setError(getEnhancedErrorMessage(result.error, errorType));
            setBookings([]); // Reset a array vuoto in caso di errore
            break;
          }
        }
      } catch (err) {
        const errorType = categorizeError(err.message);
        
        if (isRetryableError(errorType) && currentRetry < maxRetries) {
          currentRetry++;
          setRetryAttempts(currentRetry);
          const delay = 1000 * currentRetry;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          setError(getEnhancedErrorMessage(err.message, errorType));
          setBookings([]);
          break;
        }
      }
    }
    
    setLoading(false);
    setRetryAttempts(0);
  };

  useEffect(() => {
    loadBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      return;
    }

    setDeletingId(bookingId);

    try {
      const result = await deleteBookingAsAdmin(bookingId);
      
      if (result.success) {
        setSuccessMessage('Prenotazione eliminata con successo');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadBookings(); // Ricarica la lista
      } else {
        const errorType = categorizeError(result.error);
        setError(getEnhancedErrorMessage(result.error, errorType));
      }
    } catch (err) {
      const errorType = categorizeError(err.message);
      setError(getEnhancedErrorMessage(err.message, errorType));
    } finally {
      setDeletingId(null);
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
    switch (booking.stato) {
      case 'ANNULLATA':
        return 'bg-red-100 text-red-800';
      case 'ATTIVA':
      default: {
        const now = new Date();
        const bookingDate = new Date(booking.date);
        
        if (bookingDate < now) {
          return 'bg-gray-100 text-gray-800'; // Completata
        } else {
          return 'bg-green-100 text-green-800'; // Attiva
        }
      }
    }
  };

  const getStatusText = (booking) => {
    switch (booking.stato) {
      case 'ANNULLATA':
        return 'Annullata';
      case 'ATTIVA':
      default: {
        const now = new Date();
        const bookingDate = new Date(booking.date);
        
        if (bookingDate < now) {
          return 'Completata';
        } else {
          return 'Attiva';
        }
      }
    }
  };

  // Filtra le prenotazioni in base alla ricerca e al filtro di stato
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && booking.stato !== 'ANNULLATA') ||
      (statusFilter === 'cancelled' && booking.stato === 'ANNULLATA');

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">
            Caricamento prenotazioni...
            {retryAttempts > 0 && (
              <span className="block text-sm text-gray-400">
                Tentativo {retryAttempts}/3
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Prenotazioni</h1>
        <p className="text-gray-600">Gestisci tutte le prenotazioni del sistema</p>
      </div>

      {/* Controlli di ricerca e filtri */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cerca per utente, stanza, o scopo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Solo attive</option>
            <option value="cancelled">Solo annullate</option>
          </select>
        </div>
      </div>

      {/* Messaggio di successo */}
      {successMessage && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Errore */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-red-600 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Errore nel caricamento delle prenotazioni</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <button 
                  onClick={loadBookings}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Riprova
                </button>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiche */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{filteredBookings.length}</div>
          <div className="text-gray-600">Prenotazioni visualizzate</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {filteredBookings.filter(b => b.stato !== 'ANNULLATA').length}
          </div>
          <div className="text-gray-600">Prenotazioni attive</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {filteredBookings.filter(b => b.stato === 'ANNULLATA').length}
          </div>
          <div className="text-gray-600">Prenotazioni annullate</div>
        </div>
      </div>

      {!Array.isArray(filteredBookings) || filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Nessuna prenotazione trovata
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nessuna prenotazione corrisponde ai criteri di ricerca'
              : 'Non ci sono prenotazioni nel sistema'
            }
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Rimuovi filtri
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(filteredBookings) && filteredBookings.map(booking => (
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Data:</span>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Orario:</span>
                        <span>{booking.startTime || 'N/A'} - {booking.endTime || 'N/A'}</span>
                      </div>

                      <div className="flex items-center">
                        <span className="font-medium mr-2">Utente:</span>
                        <span className="truncate">{booking.userName || 'N/A'}</span>
                      </div>

                      {booking.purpose && (
                        <div className="flex items-center col-span-1 md:col-span-3">
                          <span className="font-medium mr-2">Scopo:</span>
                          <span className="truncate">{booking.purpose}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    {/* Pulsante modifica */}
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-300 rounded transition-colors"
                    >
                      Modifica
                    </button>
                    
                    {/* Pulsante elimina (solo se non è già annullata) */}
                    {booking.stato !== 'ANNULLATA' && (
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === booking.id ? 'Eliminando...' : 'Elimina'}
                      </button>
                    )}
                  </div>
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

export default BookingManagement;
