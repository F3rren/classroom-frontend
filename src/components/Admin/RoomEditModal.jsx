import { useState } from 'react';
import { updateRoom } from '../../services/bookingService';

const RoomEditModal = ({ room, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: room.nome || room.name || '',
    capienza: room.capienza || room.capacity || '',
    piano: room.piano || room.floor || '',
    descrizione: room.descrizione || room.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    
    try {
      const updateData = {
        nome: formData.nome.trim(),
        capienza: parseInt(formData.capienza),
        piano: parseInt(formData.piano) || 0,
        descrizione: formData.descrizione.trim()
      };
      
      const result = await updateRoom(room.id, updateData);
      
      if (result.success) {
        onSuccess(`Stanza ${formData.nome} aggiornata con successo`);
      } else {
        setError(result.error || 'Errore durante l\'aggiornamento della stanza');
      }
    } catch {
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Modifica Stanza
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Aggiorna le informazioni della stanza
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
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
            {loading ? 'Aggiornamento...' : 'Aggiorna Stanza'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomEditModal;
