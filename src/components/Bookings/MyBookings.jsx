import { useState, useEffect } from 'react';
import { getMyBookings, deleteBooking } from '../../services/bookingService';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    const result = await getMyBookings();
    if (result.success) {
      setBookings(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
      return;
    }

    setDeletingId(bookingId);
    const result = await deleteBooking(bookingId);
    
    if (result.success) {
      setBookings(bookings.filter(b => b.id !== bookingId));
    } else {
      alert('Errore durante la cancellazione: ' + result.error);
    }
    
    setDeletingId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    
    if (booking.status === 'cancelled') return 'bg-red-100 text-red-800';
    if (bookingDate < today) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    
    if (booking.status === 'cancelled') return 'Cancellata';
    if (bookingDate < today) return 'Completata';
    return 'Attiva';
  };

  const canCancel = (booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    return bookingDate >= today && booking.status !== 'cancelled';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Le tue prenotazioni</h1>
        <p className="text-gray-600">
          Visualizza e gestisci le tue prenotazioni delle stanze
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 01-2-2V3m0 4h10m-5 0v6m3-3h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna prenotazione</h3>
          <p className="text-gray-500 mb-4">
            Non hai ancora effettuato nessuna prenotazione
          </p>
          <button 
            onClick={() => window.location.href = '/bookings/rooms'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Prenota una stanza
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {booking.roomName || `Stanza ${booking.roomId}`}
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
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>

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
                    <div className="ml-4">
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        disabled={deletingId === booking.id}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors disabled:opacity-50"
                      >
                        {deletingId === booking.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-1"></div>
                            Cancellando...
                          </div>
                        ) : (
                          'Cancella'
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
    </div>
  );
};

export default MyBookings;
