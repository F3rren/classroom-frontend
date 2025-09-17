import { useState } from 'react';
import { toggleRoomBlock } from '../../services/bookingService';
import { getCurrentUser, isCurrentUserAdmin } from '../../services/authService';

const RoomBlockModal = ({ room, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const isCurrentlyBlocked = room.isBlocked || room.blocked;
  const actionText = isCurrentlyBlocked ? 'sbloccare' : 'bloccare';
  const actionButtonText = isCurrentlyBlocked ? 'Sblocca Stanza' : 'Blocca Stanza';

  // Funzioni di supporto per la gestione degli errori
  const categorizeError = (errorMessage) => {
    if (errorMessage?.includes('autorizzazione') || errorMessage?.includes('token') || errorMessage?.includes('permessi')) {
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
        return "Sessione scaduta o permessi insufficienti. Effettua nuovamente il login.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Se stiamo bloccando, la motivazione è obbligatoria
    if (!isCurrentlyBlocked && !reason.trim()) {
      setError('La motivazione del blocco è obbligatoria');
      return;
    }

    setLoading(true);
    setError('');
    
    const maxRetries = 3;
    let currentRetry = 0;
    
    while (currentRetry <= maxRetries) {
      try {
        // Verifica permessi utente
        await getCurrentUser(); // Per verificare che il token sia valido
        const userIsAdmin = await isCurrentUserAdmin();
        
        if (!userIsAdmin) {
          setError('Permessi insufficienti: solo gli amministratori possono bloccare le stanze');
          setLoading(false);
          return;
        }
        
        const blockData = {
          isBlocked: !isCurrentlyBlocked,
          blockReason: !isCurrentlyBlocked ? reason.trim() : null
        };
        
        const result = await toggleRoomBlock(room.id, blockData);
        
        if (result.success) {
          const message = isCurrentlyBlocked 
            ? `Stanza ${room.nome || room.name} sbloccata con successo`
            : `Stanza ${room.nome || room.name} bloccata con successo`;
          onSuccess(message);
          return;
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
          break;
        }
      }
    }
    
    setLoading(false);
    setRetryAttempts(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isCurrentlyBlocked ? 'Sblocca Stanza' : 'Blocca Stanza'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {room.nome || room.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-red-600 text-lg mr-3">⚠️</div>
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">Errore</h4>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  {retryAttempts > 0 && (
                    <p className="text-xs text-red-600">
                      Tentativo {retryAttempts}/3 in corso...
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Chiudi messaggio
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stato attuale */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Stato attuale:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isCurrentlyBlocked 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isCurrentlyBlocked ? 'Bloccata' : 'Disponibile'}
              </span>
            </div>
            {isCurrentlyBlocked && room.blockReason && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Motivo attuale:</strong> {room.blockReason}
                </p>
              </div>
            )}
          </div>

          {/* Motivazione (solo per blocco) */}
          {!isCurrentlyBlocked && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Motivazione del blocco *
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Specificare il motivo del blocco (es: Manutenzione programmata, Guasto impianto, etc.)"
                required={!isCurrentlyBlocked}
              />
              <p className="text-xs text-gray-500 mt-1">
                Questa motivazione sarà visibile agli utenti che tenteranno di prenotare la stanza.
              </p>
            </div>
          )}

          {/* Conferma per sblocco */}
          {isCurrentlyBlocked && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Conferma sblocco
                  </h3>
                  <div className="mt-1 text-sm text-green-700">
                    <p>La stanza tornerà ad essere disponibile per le prenotazioni.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
              isCurrentlyBlocked
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
            }`}
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading 
              ? (retryAttempts > 0 
                  ? `${actionText}... (${retryAttempts}/3)`
                  : `${actionText}...`)
              : actionButtonText
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomBlockModal;
