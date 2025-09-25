import { useState, useEffect, useCallback } from 'react';
import { getRoomList } from '../services/roomService';

/**
 * Hook personalizzato per la gestione delle stanze
 * Fornisce stato, caricamento, errori e funzioni di refresh per le stanze
 * 
 * @returns {object} - {rooms, loading, error, refreshRooms}
 */
export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione per caricare le stanze
  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      
      const result = await getRoomList();

      if (result.success) {
        setRooms(result.data || []);
        
      } else {
        setError(result.error || 'Errore nel caricamento delle stanze');
        setRooms([]);
        
      }
    } catch (err) {
      const errorMessage = 'Errore di connessione durante il caricamento delle stanze';
      setError(errorMessage);
      setRooms([]);
      
    } finally {
      setLoading(false);
    }
  }, []);

  // Funzione per ricaricare le stanze (esposta per componenti)
  const refreshRooms = useCallback(() => {
    
    loadRooms();
  }, [loadRooms]);

  // Carica le stanze all'avvio
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return {
    rooms,
    loading,
    error,
    refreshRooms
  };
}