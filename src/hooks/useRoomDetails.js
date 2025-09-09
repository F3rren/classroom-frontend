import { useState, useEffect, useCallback } from 'react';
import { getRoomDetails, normalizeRoomData } from '../services/roomService';
import { getRoomDetails as getAdminRoomDetails } from '../services/adminService';

// Hook per gestire i dettagli di una stanza con gestione intelligente delle prenotazioni
export function useRoomDetails(roomId, useAdminService = false) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasBookings, setHasBookings] = useState(false);
  const [dataSource, setDataSource] = useState(null); // 'details', 'basic', 'fallback'

  const loadRoomDetails = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Caricamento dettagli stanza ${roomId}...`);
      
      // Usa il servizio appropriato
      const result = useAdminService 
        ? await getAdminRoomDetails(roomId)
        : await getRoomDetails(roomId);

      if (result.success) {
        const normalizedRoom = normalizeRoomData(result.data);
        
        setRoom(normalizedRoom);
        setHasBookings(result.hasBookings || false);
        setDataSource(result.data?.dataSource || (result.hasBookings ? 'details' : 'basic'));
        
        console.log(`✅ Stanza ${roomId} caricata:`, {
          name: normalizedRoom.name,
          hasBookings: result.hasBookings,
          dataSource: result.data?.dataSource,
          bookingsCount: normalizedRoom.bookings?.length || 0
        });
      } else {
        console.error(`❌ Errore caricamento stanza ${roomId}:`, result.error);
        setError(result.error);
        setRoom(null);
        setHasBookings(false);
        setDataSource('error');
      }
    } catch (err) {
      console.error(`❌ Errore rete stanza ${roomId}:`, err);
      setError("Errore di connessione");
      setRoom(null);
      setHasBookings(false);
      setDataSource('error');
    } finally {
      setLoading(false);
    }
  }, [roomId, useAdminService]);

  useEffect(() => {
    loadRoomDetails();
  }, [loadRoomDetails]);

  // Funzioni helper per determinare lo stato della stanza
  const getRoomStatus = useCallback(() => {
    if (!room) return { status: 'unknown', text: 'Sconosciuto' };

    // Se abbiamo informazioni dettagliate sulle prenotazioni
    if (hasBookings && room.bookings) {
      const now = new Date();
      
      // Verifica prenotazione corrente
      const currentBooking = room.currentBooking || room.bookings.find(booking => {
        const start = new Date(`${booking.date}T${booking.startTime}`);
        const end = new Date(`${booking.date}T${booking.endTime}`);
        return start <= now && now <= end;
      });

      if (currentBooking) {
        return {
          status: 'occupied',
          text: 'Occupata',
          currentBooking,
          until: currentBooking.endTime
        };
      }

      // Verifica prossima prenotazione
      const nextBooking = room.nextBooking || room.bookings
        .filter(booking => new Date(`${booking.date}T${booking.startTime}`) > now)
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))[0];

      if (nextBooking) {
        const startTime = new Date(`${nextBooking.date}T${nextBooking.startTime}`);
        const hoursUntil = (startTime - now) / (1000 * 60 * 60);
        
        if (hoursUntil <= 2) {
          return {
            status: 'soon',
            text: 'Libera (presto occupata)',
            nextBooking,
            hoursUntil
          };
        }
      }

      return {
        status: 'available',
        text: 'Disponibile',
        nextBooking
      };
    }

    // Se non abbiamo informazioni dettagliate, usa lo status base
    switch (room.status?.toLowerCase()) {
      case 'occupata':
      case 'occupied':
        return { status: 'occupied', text: 'Occupata' };
      case 'libera':
      case 'available':
      case 'free':
        return { status: 'available', text: 'Disponibile' };
      case 'manutenzione':
      case 'maintenance':
        return { status: 'maintenance', text: 'In manutenzione' };
      default:
        return { status: 'available', text: 'Disponibile' };
    }
  }, [room, hasBookings]);

  // Funzione per ottenere statistiche prenotazioni
  const getBookingStats = useCallback(() => {
    if (!room || !hasBookings || !room.bookings) {
      return {
        total: 0,
        upcoming: 0,
        completed: 0,
        current: 0
      };
    }

    const now = new Date();
    const stats = {
      total: room.bookings.length,
      upcoming: 0,
      completed: 0,
      current: 0
    };

    room.bookings.forEach(booking => {
      const start = new Date(`${booking.date}T${booking.startTime}`);
      const end = new Date(`${booking.date}T${booking.endTime}`);

      if (start <= now && now <= end) {
        stats.current++;
      } else if (start > now) {
        stats.upcoming++;
      } else {
        stats.completed++;
      }
    });

    return stats;
  }, [room, hasBookings]);

  return {
    room,
    loading,
    error,
    hasBookings,
    dataSource,
    refreshRoom: loadRoomDetails,
    getRoomStatus,
    getBookingStats,
    
    // Campi calcolati per convenience
    isOccupied: getRoomStatus().status === 'occupied',
    isAvailable: getRoomStatus().status === 'available',
    currentBooking: getRoomStatus().currentBooking,
    nextBooking: getRoomStatus().nextBooking
  };
}

// Hook per gestire più stanze contemporaneamente
export function useRoomsDetails(roomIds, useAdminService = false) {
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllRooms = useCallback(async () => {
    if (!roomIds || roomIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Caricamento ${roomIds.length} stanze...`);
      
      const promises = roomIds.map(async (roomId) => {
        const result = useAdminService 
          ? await getAdminRoomDetails(roomId)
          : await getRoomDetails(roomId);
        
        return {
          roomId,
          ...result
        };
      });

      const results = await Promise.all(promises);
      const roomsData = {};

      results.forEach(result => {
        if (result.success) {
          roomsData[result.roomId] = {
            ...normalizeRoomData(result.data),
            hasBookings: result.hasBookings || false,
            dataSource: result.data?.dataSource || (result.hasBookings ? 'details' : 'basic')
          };
        } else {
          console.error(`❌ Errore stanza ${result.roomId}:`, result.error);
        }
      });

      setRooms(roomsData);
      
      const successCount = Object.keys(roomsData).length;
      console.log(`✅ ${successCount}/${roomIds.length} stanze caricate con successo`);
      
      if (successCount === 0) {
        setError("Impossibile caricare alcuna stanza");
      }
    } catch (err) {
      console.error("❌ Errore caricamento stanze:", err);
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  }, [roomIds, useAdminService]);

  useEffect(() => {
    loadAllRooms();
  }, [loadAllRooms]);

  return {
    rooms,
    loading,
    error,
    refreshRooms: loadAllRooms,
    getRoomById: (roomId) => rooms[roomId] || null,
    hasAnyBookings: Object.values(rooms).some(room => room?.hasBookings)
  };
}
