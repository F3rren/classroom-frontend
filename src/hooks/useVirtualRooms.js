import { useState, useEffect, useCallback } from 'react';
import { getVirtualRoomsDetailed } from '../services/bookingService';

/**
 * Hook personalizzato per la gestione delle stanze virtuali
 * Fornisce stato, caricamento, errori e funzioni di refresh per le stanze virtuali
 * 
 * @returns {object} - {virtualRooms, loading, error, refreshVirtualRooms}
 */
export function useVirtualRooms() {
  const [virtualRooms, setVirtualRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzione per caricare le stanze virtuali
  const loadVirtualRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🌐 useVirtualRooms: Caricamento stanze virtuali...');
      
      const result = await getVirtualRoomsDetailed();

      if (result.success) {
        setVirtualRooms(result.data || []);
        console.log(`✅ useVirtualRooms: Caricate ${result.data?.length || 0} stanze virtuali`);
      } else {
        setError(result.error || 'Errore nel caricamento delle stanze virtuali');
        setVirtualRooms([]);
        console.error('❌ useVirtualRooms: Errore caricamento stanze virtuali:', result.error);
      }
    } catch (err) {
      const errorMessage = 'Errore di connessione durante il caricamento delle stanze virtuali';
      setError(errorMessage);
      setVirtualRooms([]);
      console.error('❌ useVirtualRooms: Errore di rete:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Funzione per ricaricare le stanze virtuali (esposta per componenti)
  const refreshVirtualRooms = useCallback(() => {
    console.log('🔄 useVirtualRooms: Refresh richiesto');
    loadVirtualRooms();
  }, [loadVirtualRooms]);

  // Carica le stanze virtuali all'avvio
  useEffect(() => {
    loadVirtualRooms();
  }, [loadVirtualRooms]);

  return {
    virtualRooms,
    loading,
    error,
    refreshVirtualRooms
  };
}