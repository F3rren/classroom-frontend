import { useState, useEffect } from 'react';
import { getAllRoomsAdmin } from '../../services/bookingService';
import RoomEditModal from './RoomEditModal';
import RoomBlockModal from './RoomBlockModal';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [blockingRoom, setBlockingRoom] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const result = await getAllRoomsAdmin();
    
    if (result.success) {
      setRooms(result.data || []);
      setError(null);
    } else {
      setError(result.error);
      setRooms([]);
    }
    setLoading(false);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
  };

  const handleCloseEditModal = () => {
    setEditingRoom(null);
  };

  const handleEditSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
    setEditingRoom(null);
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

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Caricamento stanze...</p>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestione Stanze</h2>
        <p className="text-gray-600">
          Modifica le informazioni delle stanze e gestisci la loro disponibilità
        </p>
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
                            {room.nome || room.name}
                            {getStatusBadge(room)}
                          </h3>
                          <div className="mt-1 flex items-center gap-6 text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zm-6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Capienza: {room.capienza || room.capacity || 'N/A'}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Piano: {room.piano || room.floor || 'Terra'}
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
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {rooms.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 01-2-2V3m0 4h10m-5 0v6m3-3h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nessuna stanza trovata</h3>
                <p className="text-gray-500">
                  Non ci sono stanze nel sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal per modifica stanza */}
      {editingRoom && (
        <RoomEditModal
          room={editingRoom}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
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
    </div>
  );
};

export default RoomManagement;
