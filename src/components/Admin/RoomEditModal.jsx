import { useState } from 'react';
import { updateRoom, createRoom } from '../../services/bookingService';

const RoomEditModal = ({ room, onClose, onSuccess, isCreating = false }) => {
  const [formData, setFormData] = useState({
    nome: room.nome || room.name || '',
    capienza: room.capienza || room.capacity || '',
    piano: room.piano || room.floor || '',
    descrizione: room.descrizione || room.description || '',
    isVirtual: Boolean(room.isVirtual || room.virtuale) // Supporta entrambi i formati per compatibilità
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAttempts, setRetryAttempts] = useState(0);

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
    if (errorMessage?.includes('duplicato') || errorMessage?.includes('esiste già')) {
      return 'DUPLICATE';
    }
    if (errorMessage?.includes('validazione') || errorMessage?.includes('campo')) {
      return 'VALIDATION';
    }
    return 'GENERIC';
  };

  const getEnhancedErrorMessage = (originalError, errorType, action) => {
    switch (errorType) {
      case 'AUTH':
        return "Sessione scaduta o permessi insufficienti. Effettua nuovamente il login.";
      case 'NETWORK':
        return "Problema di connessione. Controlla la tua connessione internet e riprova.";
      case 'SERVER':
        return "Errore del server. Il problema è temporaneo, riprova tra qualche momento.";
      case 'DUPLICATE':
        return "Esiste già una stanza con questo nome. Scegli un nome diverso.";
      case 'VALIDATION':
        return originalError || "I dati inseriti non sono validi. Controlla i campi e riprova.";
      default:
        return originalError || `Si è verificato un errore durante ${action}. Riprova più tardi.`;
    }
  };

  const isRetryableError = (errorType) => {
    return errorType === 'NETWORK' || errorType === 'SERVER';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione
    if (!formData.nome.trim()) {
      setError('Il nome della stanza è obbligatorio');
      return;
    }
    
    if (!formData.capienza || formData.capienza <= 0) {
      setError('La capienza deve essere un numero positivo');
      return;
    }

    setLoading(true);
    setError('');
    
    const maxRetries = 3;
    let currentRetry = 0;
    const action = isCreating ? 'la creazione' : "l'aggiornamento";
    
    while (currentRetry <= maxRetries) {
      try {
        const updateData = {
          nome: formData.nome.trim(),
          capienza: parseInt(formData.capienza),
          piano: parseInt(formData.piano) || 0,
          descrizione: formData.descrizione.trim(),
          isVirtual: formData.isVirtual
        };
        
        let result;
        if (isCreating) {
          result = await createRoom(updateData);
        } else {
          result = await updateRoom(room.id, updateData);
        }
        
        if (result.success) {
          onSuccess(`Stanza ${formData.nome} ${isCreating ? 'creata' : 'aggiornata'} con successo`);
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
            setError(getEnhancedErrorMessage(result.error, errorType, action));
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
          setError(getEnhancedErrorMessage(err.message, errorType, action));
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
            {isCreating ? 'Crea Nuova Stanza' : 'Modifica Stanza'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isCreating ? 'Inserisci le informazioni per la nuova stanza' : 'Aggiorna le informazioni della stanza'}
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

          {/* Nome stanza */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Stanza *
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es: Aula 101"
              required
            />
          </div>

          {/* Capienza */}
          <div>
            <label htmlFor="capienza" className="block text-sm font-medium text-gray-700 mb-1">
              Capienza *
            </label>
            <input
              type="number"
              id="capienza"
              name="capienza"
              value={formData.capienza}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es: 50"
              required
            />
          </div>

          {/* Piano */}
          <div>
            <label htmlFor="piano" className="block text-sm font-medium text-gray-700 mb-1">
              Piano
            </label>
            <input
              type="number"
              id="piano"
              name="piano"
              value={formData.piano}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="es: 1"
            />
          </div>

          {/* Tipo Stanza */}
          <div>
            <label htmlFor="isVirtual" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Stanza *
            </label>
            <select
              id="isVirtual"
              name="isVirtual"
              value={formData.isVirtual.toString()} // Convertiamo boolean a stringa
              onChange={(e) => setFormData(prev => ({ ...prev, isVirtual: e.target.value === 'true' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="false">Stanza Fisica</option>
              <option value="true">Stanza Virtuale</option>
            </select>
          </div>

          {/* Descrizione */}
          <div>
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              id="descrizione"
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrizione opzionale della stanza..."
            />
          </div>
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading 
              ? (retryAttempts > 0 
                  ? `${isCreating ? 'Creazione' : 'Aggiornamento'}... (${retryAttempts}/3)`
                  : `${isCreating ? 'Creazione' : 'Aggiornamento'}...`)
              : (isCreating ? 'Crea Stanza' : 'Aggiorna Stanza')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomEditModal;
