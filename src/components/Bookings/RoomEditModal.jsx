import { useState } from 'react';
import { updateRoom } from '../../services/bookingService';

// Sistema di gestione errori intelligente
const categorizeError = (error) => {
  if (error.response?.status === 401 || error.message?.includes('non autorizzato')) {
    return 'AUTH';
  }
  if (!navigator.onLine || error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
    return 'NETWORK';
  }
  if (error.response?.status >= 500) {
    return 'SERVER';
  }
  if (error.response?.status === 409) {
    return 'CONFLICT';
  }
  if (error.response?.status === 400) {
    return 'VALIDATION';
  }
  return 'GENERIC';
};

const getEnhancedErrorMessage = (error, operation = '') => {
  const category = categorizeError(error);
  const baseMessages = {
    'AUTH': 'Sessione scaduta. Effettua nuovamente il login.',
    'NETWORK': 'Connessione internet non disponibile. Riprova quando torni online.',
    'SERVER': 'Problema temporaneo del server. Stiamo lavorando per risolverlo.',
    'CONFLICT': operation === 'update' ? 'Impossibile aggiornare: esiste già una stanza con questo nome.' : 'Conflitto con i dati esistenti.',
    'VALIDATION': operation === 'update' ? 'I dati della stanza non sono validi. Controlla i campi obbligatori.' : 'I dati forniti non sono validi.',
    'GENERIC': operation === 'update' ? 'Errore durante l\'aggiornamento della stanza. Riprova più tardi.' : 'Si è verificato un errore imprevisto.'
  };
  return baseMessages[category] || 'Errore sconosciuto';
};

const isRetryableError = (error) => {
  const category = categorizeError(error);
  return ['NETWORK', 'SERVER'].includes(category);
};

const RoomEditModal = ({ room, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: room.name || '',
    description: room.description || '',
    floor: room.floor || '',
    capacity: room.capacity || '',
    features: room.features ? room.features.join(', ') : ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [operationType, setOperationType] = useState(null);

  // Funzione di retry
  const retryOperation = async (operation, maxAttempts = 3) => {
    setIsRetrying(true);
    setRetryAttempts(0);
    setError('');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryAttempts(attempt);
        const result = await operation();
        setIsRetrying(false);
        setRetryAttempts(0);
        setOperationType(null);
        return result;
      } catch (error) {
        if (attempt === maxAttempts) {
          setIsRetrying(false);
          setRetryAttempts(0);
          setOperationType(null);
          setError(getEnhancedErrorMessage(error, operationType));
          throw error;
        }
        
        if (isRetryableError(error)) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          setIsRetrying(false);
          setRetryAttempts(0);
          setOperationType(null);
          setError(getEnhancedErrorMessage(error, operationType));
          throw error;
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazioni
    if (!formData.name.trim()) {
      setError('Il nome della stanza è obbligatorio');
      return;
    }

    if (formData.capacity && (isNaN(formData.capacity) || formData.capacity <= 0)) {
      setError('La capacità deve essere un numero positivo');
      return;
    }

    setLoading(true);
    setError(null);
    setOperationType('update');

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        floor: formData.floor ? parseInt(formData.floor) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        features: formData.features 
          ? formData.features.split(',').map(f => f.trim()).filter(f => f)
          : []
      };

      await retryOperation(async () => {
        const result = await updateRoom(room.id, updateData);
        if (result.success) {
          onSuccess();
          return result;
        } else {
          throw new Error(result.error || 'Errore durante l\'aggiornamento della stanza');
        }
      });
    } catch {
      // Errore già gestito in retryOperation
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Modifica Stanza
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-red-600">{error}</p>
                    {isRetrying && (
                      <p className="text-xs text-red-500 mt-1">
                        Tentativo {retryAttempts} di 3 in corso...
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome stanza <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es: Sala Riunioni A"
                required
              />
            </div>

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descrizione della stanza e delle sue caratteristiche..."
              />
            </div>

            {/* Piano e Capacità */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Piano
                </label>
                <input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: 1"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacità
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Es: 20"
                  min="1"
                />
              </div>
            </div>

            {/* Attrezzature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attrezzature disponibili
              </label>
              <input
                type="text"
                value={formData.features}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es: Proiettore, WiFi, Lavagna, PC"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separa le attrezzature con una virgola
              </p>
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRetrying && operationType === 'update' ? 
                    `Tentativo ${retryAttempts}/3...` : 
                    'Salvando...'
                  }
                </div>
              ) : (
                'Salva Modifiche'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomEditModal;
