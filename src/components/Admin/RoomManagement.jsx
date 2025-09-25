import { useState, useEffect } from 'react';
import { getAllRoomsAdmin } from '../../services/bookingService';
import { deleteRoom } from '../../services/adminService';
import RoomEditModal from './RoomEditModal';
import RoomBlockModal from './RoomBlockModal';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [blockingRoom, setBlockingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);
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
        return originalError || "Si è verificato un errore nel caricamento delle stanze. Riprova più tardi.";
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  useEffect(() => {
    loadRooms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRooms = async () => {
    const maxRetries = 3;
    let currentRetry = 0;
    
    setLoading(true);
    
    while (currentRetry <= maxRetries) {
      try {
        setError(null);
        
        const result = await getAllRoomsAdmin();
        
        if (result.success) {
          setRooms(result.data || []);
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
            setRooms([]);
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
          setRooms([]);
          break;
        }
      }
    }
    
    setLoading(false);
    setRetryAttempts(0);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
  };

  const handleCreateRoom = () => {
    setCreatingRoom(true);
  };

  const handleCloseEditModal = () => {
    setEditingRoom(null);
    setCreatingRoom(false);
  };

  const handleEditSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    setEditingRoom(null);
    setCreatingRoom(false);
    loadRooms(); // Ricarica la lista
  };

  const handleBlockRoom = (room) => {
    setBlockingRoom(room);
  };

  const handleCloseBlockModal = () => {
    setBlockingRoom(null);
  };

  const handleBlockSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    setBlockingRoom(null);
    loadRooms(); // Ricarica la lista
  };

  const handleDeleteRoom = (room) => {
    setDeletingRoom(room);
  };

  const confirmDeleteRoom = async () => {
    if (!deletingRoom) return;

    try {
      const result = await deleteRoom(deletingRoom.id);
      
      if (result.success) {
        setSuccessMessage(`Stanza "${deletingRoom.nome || deletingRoom.name || `Stanza ${deletingRoom.id}`}" eliminata con successo`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setDeletingRoom(null);
        loadRooms(); // Ricarica la lista
      } else {
        const errorType = categorizeError(result.error);
        const errorMessage = getEnhancedErrorMessage(result.error, errorType);
        setError(errorMessage);
        setTimeout(() => setError(null), 5000);
        setDeletingRoom(null);
      }
    } catch (err) {
      const errorType = categorizeError(err.message);
      const errorMessage = getEnhancedErrorMessage(err.message, errorType);
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
      setDeletingRoom(null);
    }
  };

  const cancelDeleteRoom = () => {
    setDeletingRoom(null);
  };

  const getStatusBadge = (room) => {
    if (room.isBlocked) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Bloccata
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Disponibile
      </span>
    );
  };

  const getTypeBadge = (room) => {
    if (room.isVirtual || room.virtuale) { // Supporta entrambi i formati
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Virtuale
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Fisica
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-gray-500">
            <p>Caricamento stanze...</p>
            {retryAttempts > 0 && (
              <p className="text-sm text-gray-400">
                Tentativo {retryAttempts}/3
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messaggio di successo */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
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

      {/* Errore */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-red-600 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 mb-2">Errore nel caricamento delle stanze</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={loadRooms}
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

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestione Stanze</h2>
          <p className="text-gray-600">
            Modifica le informazioni delle stanze e gestisci la loro disponibilità
          </p>
        </div>
        <button
          onClick={handleCreateRoom}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Crea Stanza
        </button>
      </div>

      {/* Lista stanze */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flow-root">
            <ul className="divide-y divide-gray-200">
              {rooms.map((room) => (
                <li key={room.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-3">
                            {room.nome || room.name || `Stanza ${room.id}`}
                            {getStatusBadge(room)}
                            {getTypeBadge(room)}
                          </h3>
                          <div className="mt-1 flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Capienza: {room.capienza || room.capacity || 'Non specificata'}
                            </span>
                            {!(room.isVirtual || room.virtuale) && ( // Supporta entrambi i formati
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Piano: {room.piano || room.floor || 'Terra'}
                              </span>
                            )}
                            <span className="flex items-center">
                              {(room.isVirtual || room.virtuale) ? ( // Supporta entrambi i formati
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Stanza Virtuale
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Stanza Fisica
                                </>
                              )}
                            </span>
                          </div>
                          {room.isBlocked && room.blockReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-700">
                                <strong>Motivo blocco:</strong> {room.blockReason}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Pulsante modifica */}
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-300 rounded transition-colors"
                          >
                            Modifica
                          </button>
                          
                          {/* Pulsante blocca/sblocca */}
                          <button
                            onClick={() => handleBlockRoom(room)}
                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                              room.isBlocked
                                ? 'text-green-600 hover:bg-green-50 border-green-300'
                                : 'text-red-600 hover:bg-red-50 border-red-300'
                            }`}
                          >
                            {room.isBlocked ? 'Sblocca' : 'Blocca'}
                          </button>
                          
                          {/* Pulsante elimina */}
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-300 rounded transition-colors"
                            title="Elimina stanza"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {rooms.length === 0 && !error && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 01-2-2V3m0 4h10m-5 0v6m3-3h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna stanza trovata</h3>
                <p className="text-gray-500 mb-4">
                  Non ci sono stanze nel sistema.
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crea la prima stanza
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal per modifica/creazione stanza */}
      {(editingRoom || creatingRoom) && (
        <RoomEditModal
          room={editingRoom || { nome: '', capienza: '', piano: '', descrizione: '', isVirtual: false }}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          isCreating={creatingRoom}
        />
      )}

      {/* Modal per blocco stanza */}
      {blockingRoom && (
        <RoomBlockModal
          room={blockingRoom}
          onClose={handleCloseBlockModal}
          onSuccess={handleBlockSuccess}
        />
      )}

      {/* Modal di conferma eliminazione stanza */}
      {deletingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Conferma Eliminazione
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
                    Sei sicuro di voler eliminare questa stanza?
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      La stanza <strong>"{deletingRoom.nome || deletingRoom.name || `Stanza ${deletingRoom.id}`}"</strong> verrà eliminata permanentemente dal sistema.
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      ⚠️ <strong>Attenzione:</strong> Questa azione non può essere annullata. Tutte le prenotazioni associate verranno eliminate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex space-x-3">
              <button
                onClick={cancelDeleteRoom}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
