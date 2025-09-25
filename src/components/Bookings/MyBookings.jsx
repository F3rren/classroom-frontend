import { useState, useEffect } from 'react';
import { getMyBookings, deleteBooking } from '../../services/bookingService';
import { getCurrentUser } from '../../services/authService';
import EditBookingModal from './EditBookingModal';

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
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return 'NOT_FOUND';
  }
  return 'GENERIC';
};

const getEnhancedErrorMessage = (error, category) => {
  const baseMessage = error?.message || error || 'Errore sconosciuto';
  
  switch (category) {
    case 'AUTH':
      return 'Sessione scaduta. Effettua nuovamente il login per visualizzare le tue prenotazioni.';
    case 'NETWORK':
      return 'Problema di connessione. Verifica la tua connessione internet e riprova.';
    case 'SERVER':
      return 'Il server è temporaneamente non disponibile. Riprova tra qualche momento.';
    case 'NOT_FOUND':
      return 'Non sono state trovate prenotazioni per il tuo account.';
    default:
      return baseMessage.includes('prenotazioni') ? baseMessage : `Errore nel caricamento delle prenotazioni: ${baseMessage}`;
  }
};

const isRetryableError = (category) => {
  return ['NETWORK', 'SERVER'].includes(category);
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [operationType, setOperationType] = useState(''); // 'load', 'delete'

  const loadBookings = async (isRetryAttempt = false) => {
    if (!isRetryAttempt) {
      setLoading(true);
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

        // Carica sempre solo le proprie prenotazioni (non admin mode)
        const result = await getMyBookings();
        
        if (result.success) {
          // Assicurati che i dati siano sempre un array
          const allBookingsData = Array.isArray(result.data) ? result.data : [];
          
          // Filtra solo le prenotazioni attive (non annullate)
          const activeBookings = allBookingsData.filter(booking => {
            return booking.stato !== 'ANNULLATA';
          });
          
          setBookings(activeBookings);
          setError(null);
          setIsRetrying(false);
          setRetryAttempts(0);
          setLoading(false);
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
            setBookings([]); // Reset a array vuoto in caso di errore
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
          setBookings([]);
          break;
        }
      }
    }
    
    setLoading(false);
    setIsRetrying(false);
    setRetryAttempts(0);
  };

  useEffect(() => {
    const initializeComponent = async () => {
      setLoading(true);
      setError(null);
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
          
          // Prima carica l'utente corrente
          const userResult = await getCurrentUser();
          
          if (userResult === null) {
            // Utente non autenticato - sarà gestito da ProtectedRoute
            setLoading(false);
            return;
          }
          
          if (userResult && userResult.success) {
            
            // Carica sempre solo le proprie prenotazioni
            await loadBookings(false);
            setIsRetrying(false);
            setRetryAttempts(0);
            return;
          } else {
            const errorType = categorizeError(userResult?.error);
            const enhancedMessage = getEnhancedErrorMessage(userResult?.error, errorType);
            
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
    
    initializeComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
  };

  const handleCancelBooking = (booking) => {
    setDeletingBooking(booking);
  };

  const confirmCancelBooking = async () => {
    if (!deletingBooking) return;
    
    const bookingId = deletingBooking.id;
    setCancellingId(bookingId);
    setOperationType('delete');
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

        const result = await deleteBooking(bookingId);
        
        if (result.success) {
          setSuccessMessage('Prenotazione cancellata con successo');
          setTimeout(() => setSuccessMessage(''), 3000);
          await loadBookings(false); // Ricarica la lista
          setIsRetrying(false);
          setRetryAttempts(0);
          setCancellingId(null);
          setDeletingBooking(null);
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
            setTimeout(() => setError(null), 5000);
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
          setTimeout(() => setError(null), 5000);
          break;
        }
      }
    }
    
    setCancellingId(null);
    setIsRetrying(false);
    setRetryAttempts(0);
    setDeletingBooking(null);
  };

  const cancelDeleteBooking = () => {
    setDeletingBooking(null);
  };

  const handleCloseEditModal = () => {
    setEditingBooking(null);
  };

  const handleEditSuccess = () => {
    setEditingBooking(null);
    setSuccessMessage('Prenotazione modificata con successo!');
    setTimeout(() => setSuccessMessage(''), 3000);
    loadBookings(false); // Ricarica la lista
  };

  const retryOperation = () => {
    setError(null);
    setRetryAttempts(0);
    setIsRetrying(false);
    
    if (operationType === 'load') {
      loadBookings(false);
    }
    // Per 'delete' non facciamo retry automatico, l'utente deve ripremere il pulsante
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
        <span className="ml-3 text-gray-600">
          {isRetrying ? `Caricamento prenotazioni... (${retryAttempts}/3)` : 'Caricamento prenotazioni...'}
        </span>
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-red-600 text-xl mr-3 flex-shrink-0">📋</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Errore nel caricamento delle prenotazioni</h4>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <div className="flex space-x-2">
                <button
                  onClick={retryOperation}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Riprova
                </button>
                <button
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
          {Array.isArray(bookings) && bookings.map(booking => {
            // Debug logging per vedere la struttura del booking
            console.log('🔍 MyBookings - booking object:', booking);
            console.log('🔍 MyBookings - booking.aula:', booking?.aula);
            
            return (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {booking.aula?.nome || booking.nomeAula || booking.roomName || `Stanza ${booking.roomId || booking.aulaId || 'Senza Nome'}`}
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
                      onClick={() => handleCancelBooking(booking)}
                      disabled={cancellingId === booking.id}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? (
                        isRetrying && operationType === 'delete' ? 
                          `Tentativo ${retryAttempts}/3...` : 
                          'Cancellando...'
                      ) : (
                        'Cancella'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
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

      {/* Modal di conferma cancellazione */}
      {deletingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Conferma Cancellazione
              </h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Sei sicuro di voler cancellare questa prenotazione?
                  </h3>
                  <div className="mt-2">
                    <div className="text-sm text-gray-700">
                      <p><strong>Stanza:</strong> {deletingBooking.aula?.nome || deletingBooking.nomeAula || deletingBooking.roomName || `Stanza ${deletingBooking.roomId || deletingBooking.aulaId || 'Senza Nome'}`}</p>
                      <p><strong>Data:</strong> {formatDate(deletingBooking.date)}</p>
                      <p><strong>Orario:</strong> {deletingBooking.startTime || 'N/A'} - {deletingBooking.endTime || 'N/A'}</p>
                      {deletingBooking.purpose && (
                        <p><strong>Scopo:</strong> {deletingBooking.purpose}</p>
                      )}
                    </div>
                    <p className="text-sm text-red-600 mt-3">
                      ⚠️ <strong>Attenzione:</strong> Questa azione non può essere annullata.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex space-x-3">
              <button
                onClick={cancelDeleteBooking}
                disabled={cancellingId === deletingBooking?.id}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={confirmCancelBooking}
                disabled={cancellingId === deletingBooking?.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingId === deletingBooking?.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isRetrying ? (
                      <span>Tentativo {retryAttempts}/3...</span>
                    ) : (
                      <span>Cancellando...</span>
                    )}
                  </div>
                ) : (
                  'Cancella Definitivamente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
