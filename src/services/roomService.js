export async function getRoomList() {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      const response = await fetch("/api/rooms", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Dati stanze ricevuti:", data);
        
        // Normalizziamo i dati delle stanze
        let roomsArray = data.rooms || data || [];
        if (!Array.isArray(roomsArray)) {
          roomsArray = [];
        }
        
        const normalizedRooms = roomsArray.map(room => ({
          ...room,
          name: room.nome || room.name || `Stanza ${room.id}`,
          nome: room.nome || room.name || `Stanza ${room.id}`,
          capacity: room.capienza || room.capacity,
          capienza: room.capienza || room.capacity,
          floor: room.piano || room.floor || 0,
          piano: room.piano || room.floor || 0,
          description: room.descrizione || room.description || '',
          descrizione: room.descrizione || room.description || ''
        }));
        
        return {
          success: true,
          error: null,
          data: normalizedRooms
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Errore nel caricamento delle stanze",
          data: null
        };
      }
      
    } catch (err) {
      console.error("Errore di rete:", err);
      return {
        success: false,
        error: "Errore di connessione al server",
        data: null
      };
    }
}

// Funzione per ottenere tutte le stanze con dettagli completi
export async function getDetailedRooms() {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      console.log("🔄 Tentativo di connessione a /api/rooms/detailed...");
      
      const response = await fetch("/api/rooms/detailed", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      
      console.log("📡 Risposta ricevuta da /api/rooms/detailed:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        ok: response.ok
      });
      
      if (response.ok) {
        // Controlla se la risposta ha contenuto
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn("⚠️ Risposta non è JSON, probabilmente endpoint non implementato");
          throw new Error("Endpoint /api/rooms/detailed non implementato - content-type: " + contentType);
        }
        
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn("⚠️ Risposta vuota dall'endpoint detailed");
          throw new Error("Risposta vuota dall'endpoint detailed");
        }
        
        console.log("📄 Contenuto grezzo ricevuto:", text.substring(0, 500) + (text.length > 500 ? "..." : ""));
        
        try {
          const data = JSON.parse(text);
          console.log("✅ Dati stanze dettagliati parsati:", {
            type: typeof data,
            isArray: Array.isArray(data),
            hasRoomsProperty: 'rooms' in data,
            dataKeys: Object.keys(data || {}),
            firstItemKeys: Array.isArray(data) && data[0] ? Object.keys(data[0]) : 
                          data.rooms && data.rooms[0] ? Object.keys(data.rooms[0]) : 'N/A'
          });
          
          // Normalizza i dati ricevuti
          const rawRooms = data.rooms || data || [];
          console.log(`📊 Trovate ${rawRooms.length} stanze da processare`);
          
          const normalizedRooms = rawRooms.map((room, index) => {
            console.log(`🔧 Normalizzando stanza ${index + 1}:`, {
              id: room.id,
              name: room.name,
              hasBookings: !!(room.bookings && room.bookings.length > 0),
              bookingsCount: room.bookings ? room.bookings.length : 0
            });
            return normalizeRoomData(room);
          });
          
          console.log(`✅ ${normalizedRooms.length} stanze normalizzate con successo`);
          
          return {
            success: true,
            error: null,
            data: normalizedRooms
          };
        } catch (parseError) {
          console.error("❌ Errore parsing JSON:", parseError);
          console.log("📄 Contenuto che ha causato l'errore:", text);
          throw new Error("Formato dati non valido dall'endpoint detailed: " + parseError.message);
        }
      } else {
        console.warn(`⚠️ Endpoint detailed non disponibile, status: ${response.status} ${response.statusText}`);
        
        // Se l'endpoint detailed non esiste (404), prova con l'endpoint base
        if (response.status === 404) {
          console.log("🔄 Fallback a /api/rooms...");
          const fallbackResult = await getRoomList();
          
          if (fallbackResult.success) {
            console.log("✅ Fallback riuscito, normalizzando dati base...");
            return {
              success: true,
              error: "Endpoint /api/rooms/detailed non disponibile, utilizzando dati base da /api/rooms",
              data: fallbackResult.data.map(room => normalizeRoomData(room))
            };
          } else {
            throw new Error("Anche l'endpoint di fallback /api/rooms ha fallito: " + fallbackResult.error);
          }
        }
        
        // Prova a leggere l'errore se possibile
        let errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Se non riesce a parsare l'errore, usa il messaggio di default
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (err) {
      console.error("❌ Errore in getDetailedRooms:", err);
      
      // Se c'è un errore di rete, prova il fallback all'endpoint base
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.log("🔄 Errore di rete, tentativo di fallback a /api/rooms...");
        try {
          const fallbackResult = await getRoomList();
          
          if (fallbackResult.success) {
            console.log("✅ Fallback di rete riuscito");
            return {
              success: true,
              error: "Server non raggiungibile su /api/rooms/detailed, utilizzando dati base",
              data: fallbackResult.data.map(room => normalizeRoomData(room))
            };
          }
        } catch (fallbackError) {
          console.error("❌ Anche il fallback di rete è fallito:", fallbackError);
        }
      }
      
      return {
        success: false,
        error: err.message || "Errore di connessione al server",
        data: null
      };
    }
}

// Funzione per ottenere i dettagli di una stanza specifica
export async function getRoomDetails(roomId) {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      // Prima prova con l'endpoint details
      const detailsResponse = await fetch(`/api/rooms/${roomId}/details`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        console.log("Dettagli stanza ricevuti:", detailsData);
        
        // Verifica se i dati contengono informazioni di prenotazione
        const hasBookingInfo = detailsData.bookings || 
                             detailsData.currentBooking || 
                             detailsData.nextBooking ||
                             detailsData.prenotazioni;
        
        return {
          success: true,
          error: null,
          data: detailsData,
          hasBookings: Boolean(hasBookingInfo)
        };
      }

      // Se l'endpoint details fallisce, prova con l'endpoint base
      console.warn(`Endpoint details fallito per stanza ${roomId}, provo con endpoint base`);
      
      const baseResponse = await fetch(`/api/rooms/${roomId}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (baseResponse.ok) {
        const baseData = await baseResponse.json();
        console.log("Dati base stanza ricevuti:", baseData);
        
        return {
          success: true,
          error: null,
          data: {
            ...baseData,
            bookings: [], // Array vuoto per stanze senza prenotazioni
            currentBooking: null,
            nextBooking: null,
            isAvailable: true
          },
          hasBookings: false
        };
      }

      // Se entrambi gli endpoint falliscono
      const errorData = await baseResponse.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento dei dettagli stanza",
        data: null
      };
      
    } catch (err) {
      console.error("Errore di rete:", err);
      return {
        success: false,
        error: "Errore di connessione al server",
        data: null
      };
    }
}

// Funzione per normalizzare i dati della stanza
export function normalizeRoomData(roomData) {
  if (!roomData) return null;

  return {
    id: roomData.id || roomData.roomId,
    name: roomData.name || roomData.roomName || roomData.nome || `Stanza ${roomData.id}`,
    floor: roomData.floor !== undefined ? roomData.floor : (roomData.piano !== undefined ? roomData.piano : 0),
    capacity: roomData.capacity !== undefined ? roomData.capacity : (roomData.capienza !== undefined ? roomData.capienza : (roomData.posti !== undefined ? roomData.posti : 0)),
    status: roomData.status || roomData.stato || "libera",
    description: roomData.description || roomData.descrizione || "",
    equipment: roomData.equipment || roomData.attrezzature || [],
    
    // Dati prenotazioni (potrebbero essere presenti o meno)
    bookings: roomData.bookings || roomData.prenotazioni || [],
    currentBooking: roomData.currentBooking || roomData.prenotazioneCorrente || null,
    nextBooking: roomData.nextBooking || roomData.prossimaPrenotazione || null,
    isAvailable: roomData.isAvailable !== undefined ? roomData.isAvailable : true,
    
    // Mantieni tutti gli altri dati originali
    ...roomData
  };
}

// Funzione helper per determinare se una stanza è attualmente occupata
export function isRoomCurrentlyOccupied(room) {
  if (!room) return false;

  // Se c'è una prenotazione corrente esplicita
  if (room.currentBooking) {
    const now = new Date();
    const endTime = new Date(`${room.currentBooking.date}T${room.currentBooking.endTime}`);
    return endTime > now;
  }

  // Controlla nell'array delle prenotazioni
  if (room.bookings && room.bookings.length > 0) {
    const now = new Date();
    return room.bookings.some(booking => {
      const start = new Date(`${booking.date}T${booking.startTime}`);
      const end = new Date(`${booking.date}T${booking.endTime}`);
      return start <= now && now <= end;
    });
  }

  return false;
}

// Funzione per ottenere la prossima prenotazione
export function getNextBooking(room) {
  if (!room || !room.bookings || room.bookings.length === 0) return null;

  const now = new Date();
  const futureBookings = room.bookings
    .filter(booking => new Date(`${booking.date}T${booking.startTime}`) > now)
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`));

  return futureBookings[0] || null;
}