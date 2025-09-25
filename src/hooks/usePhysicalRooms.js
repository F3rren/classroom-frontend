import { useState, useEffect, useCallback } from 'react';
import { getPhysicalRooms, getPhysicalRoomsDetailed } from '../services/bookingService';

/**
 * Hook personalizzato per la gestione delle stanze fisiche
 * Fornisce stato, caricamento, errori e funzioni di refresh per le stanze fisiche
 * 
 * @param {boolean} includeDetails - Se true, carica anche i dettagli delle prenotazioni
 * @returns {object} - {physicalRooms, loading, error, refreshPhysicalRooms}
 */
export function usePhysicalRooms(includeDetails = false) {
  const [physicalRooms, setPhysicalRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione per caricare le stanze fisiche
  const loadPhysicalRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      
      
      const result = includeDetails 
        ? await getPhysicalRoomsDetailed()
        : await getPhysicalRooms();

      if (result.success) {
        setPhysicalRooms(result.data || []);
        
      } else {
        setError(result.error || 'Errore nel caricamento delle stanze fisiche');
        setPhysicalRooms([]);
        
      }
    } catch (err) {
      const errorMessage = 'Errore di connessione durante il caricamento delle stanze fisiche';
      setError(errorMessage);
      setPhysicalRooms([]);
      
    } finally {
      setLoading(false);
    }
  }, [includeDetails]);

  // Funzione per ricaricare le stanze fisiche (esposta per componenti)
  const refreshPhysicalRooms = useCallback(() => {
    
    loadPhysicalRooms();
  }, [loadPhysicalRooms]);

  // Carica le stanze fisiche all'avvio e quando cambia includeDetails
  useEffect(() => {
    loadPhysicalRooms();
  }, [loadPhysicalRooms]);

  return {
    physicalRooms,
    loading,
    error,
    refreshPhysicalRooms
  };
}