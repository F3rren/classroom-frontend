export async function getRoomList() {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      const response = await fetch("http://localhost:8080/api/rooms", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Dati stanze ricevuti:", data);
        return {
          success: true,
          error: null,
          data: data.rooms || data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Errore nel caricamento degli utenti",
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
      const detailsResponse = await fetch(`http://localhost:8080/api/rooms/${roomId}/details`, {
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
      
      const baseResponse = await fetch(`http://localhost:8080/api/rooms/${roomId}`, {
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