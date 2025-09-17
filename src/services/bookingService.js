// ====== SERVIZI STANZE ======

// Cache locale per le stanze bloccate (workaround per backend che non restituisce i dati)
let blockedRoomsCache = new Map(); // Map<roomId, {isBlocked: boolean, blockReason: string}>

// Funzione per aggiornare la cache locale
function updateBlockedRoomCache(roomId, isBlocked, blockReason = null) {
  if (isBlocked) {
    blockedRoomsCache.set(parseInt(roomId), {
      isBlocked: true,
      blockReason: blockReason
    });
    console.log('🔒 Cache: stanza bloccata aggiunta:', roomId, blockReason);
  } else {
    blockedRoomsCache.delete(parseInt(roomId));
    console.log('🔒 Cache: stanza sbloccata rimossa:', roomId);
  }
  
  // Salva in localStorage per persistenza
  try {
    localStorage.setItem('blockedRoomsCache', JSON.stringify(Array.from(blockedRoomsCache.entries())));
  } catch (e) {
    console.warn('⚠️ Impossibile salvare cache in localStorage');
  }
}

// Funzione per caricare la cache da localStorage
function loadBlockedRoomCache() {
  try {
    const cached = localStorage.getItem('blockedRoomsCache');
    if (cached) {
      const entries = JSON.parse(cached);
      blockedRoomsCache = new Map(entries);
      console.log('🔒 Cache caricata da localStorage:', blockedRoomsCache.size, 'stanze');
    }
  } catch (e) {
    console.warn('⚠️ Errore caricamento cache da localStorage');
    blockedRoomsCache = new Map();
  }
}

// Carica la cache all'avvio
loadBlockedRoomCache();

// Funzione per recuperare tutte le stanze
export async function getAllRooms() {
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
      console.log("🏠 Risposta getAllRooms:", data);
      
      // Gestisci diversi formati di risposta
      let roomsArray = [];
      
      if (Array.isArray(data)) {
        roomsArray = data;
      } else if (data.rooms && Array.isArray(data.rooms)) {
        roomsArray = data.rooms;
      } else if (data.aule && Array.isArray(data.aule)) {
        roomsArray = data.aule;
      } else {
        console.warn("⚠️ Formato risposta rooms inaspettato:", data);
        roomsArray = [];
      }
      
      // Arricchisci le stanze con i dati di blocco dalla cache
      roomsArray = roomsArray.map(room => {
        const cached = blockedRoomsCache.get(room.id);
        
        // Normalizziamo i campi per compatibilità
        const normalizedRoom = {
          ...room,
          name: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'name' esista
          nome: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'nome' esista
          capacity: room.capienza || room.capacity,
          capienza: room.capienza || room.capacity,
          floor: room.piano || room.floor || 0,
          piano: room.piano || room.floor || 0,
          description: room.descrizione || room.description || '',
          descrizione: room.descrizione || room.description || ''
        };
        
        if (cached) {
          return {
            ...normalizedRoom,
            isBlocked: cached.isBlocked,
            blockReason: cached.blockReason
          };
        }
        return {
          ...normalizedRoom,
          isBlocked: false,
          blockReason: null
        };
      });
      
      console.log("🔒 Stanze getAllRooms arricchite con cache:", roomsArray.filter(r => r.isBlocked));
      
      return {
        success: true,
        error: null,
        data: roomsArray
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

// Funzione per recuperare tutte le stanze per admin (include stanze bloccate)
export async function getAllRoomsAdmin() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/admin/rooms", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("🏠 Risposta getAllRoomsAdmin:", data);
      
      // Gestisci diversi formati di risposta
      let roomsArray = [];
      
      if (Array.isArray(data)) {
        roomsArray = data;
      } else if (data.rooms && Array.isArray(data.rooms)) {
        roomsArray = data.rooms;
      } else if (data.aule && Array.isArray(data.aule)) {
        roomsArray = data.aule;
      } else {
        console.warn("⚠️ Formato risposta admin rooms inaspettato:", data);
        roomsArray = [];
      }
      
      // Arricchisci le stanze con i dati di blocco dalla cache
      roomsArray = roomsArray.map(room => {
        const cached = blockedRoomsCache.get(room.id);
        
        // Normalizziamo i campi per compatibilità
        const normalizedRoom = {
          ...room,
          name: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'name' esista
          nome: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'nome' esista
          capacity: room.capienza || room.capacity,
          capienza: room.capienza || room.capacity,
          floor: room.piano || room.floor || 0,
          piano: room.piano || room.floor || 0,
          description: room.descrizione || room.description || '',
          descrizione: room.descrizione || room.description || ''
        };
        
        if (cached) {
          return {
            ...normalizedRoom,
            isBlocked: cached.isBlocked,
            blockReason: cached.blockReason
          };
        }
        return {
          ...normalizedRoom,
          isBlocked: false,
          blockReason: null
        };
      });
      
      console.log("🔒 Stanze arricchite con cache blocco:", roomsArray.filter(r => r.isBlocked));
      
      return {
        success: true,
        error: null,
        data: roomsArray
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento delle stanze admin",
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

// Funzione per recuperare tutte le stanze con informazioni dettagliate
export async function getRoomsDetailed() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/rooms/detailed", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("🏠 Risposta getRoomsDetailed:", data);
      
      let roomsArray = data.rooms || data;
      
      // Arricchisci le stanze con i dati di blocco dalla cache
      if (Array.isArray(roomsArray)) {
        roomsArray = roomsArray.map(room => {
          const cached = blockedRoomsCache.get(room.id);
          if (cached) {
            return {
              ...room,
              isBlocked: cached.isBlocked,
              blockReason: cached.blockReason
            };
          }
          return {
            ...room,
            isBlocked: false,
            blockReason: null
          };
        });
        
        console.log("🔒 Stanze detailed arricchite con cache:", roomsArray.filter(r => r.isBlocked));
      }
      
      return {
        success: true,
        error: null,
        data: roomsArray
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento delle stanze dettagliate",
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

// Funzione per recuperare solo le stanze fisiche con dettagli
export async function getPhysicalRoomsDetailed() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/rooms/physical/detailed", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("🏠 Risposta getPhysicalRoomsDetailed:", data);
      
      let roomsArray = data.rooms || data;
      
      // Arricchisci le stanze con i dati di blocco dalla cache
      if (Array.isArray(roomsArray)) {
        roomsArray = roomsArray.map(room => {
          const cached = blockedRoomsCache.get(room.id);
          if (cached) {
            return {
              ...room,
              isBlocked: cached.isBlocked,
              blockReason: cached.blockReason
            };
          }
          return {
            ...room,
            isBlocked: false,
            blockReason: null
          };
        });
        
        console.log("🔒 Stanze fisiche detailed arricchite con cache:", roomsArray.filter(r => r.isBlocked));
      }
      
      return {
        success: true,
        error: null,
        data: roomsArray
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento delle stanze fisiche",
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

// Funzione per recuperare solo le stanze virtuali con dettagli
export async function getVirtualRoomsDetailed() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/rooms/virtual/detailed", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("🏠 Risposta getVirtualRoomsDetailed:", data);
      
      let roomsArray = data.rooms || data;
      
      // Arricchisci le stanze con i dati di blocco dalla cache
      if (Array.isArray(roomsArray)) {
        roomsArray = roomsArray.map(room => {
          const cached = blockedRoomsCache.get(room.id);
          
          // Normalizziamo i campi per compatibilità
          const normalizedRoom = {
            ...room,
            name: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'name' esista
            nome: room.nome || room.name || `Stanza ${room.id}`, // Assicura che 'nome' esista
            capacity: room.capienza || room.capacity,
            capienza: room.capienza || room.capacity,
            floor: room.piano || room.floor || 0,
            piano: room.piano || room.floor || 0,
            description: room.descrizione || room.description || '',
            descrizione: room.descrizione || room.description || '',
            virtuale: Boolean(room.virtuale || room.isVirtual || true), // Per stanze virtuali
            isVirtual: Boolean(room.virtuale || room.isVirtual || true)
          };
          
          if (cached) {
            return {
              ...normalizedRoom,
              isBlocked: cached.isBlocked,
              blockReason: cached.blockReason
            };
          }
          return {
            ...normalizedRoom,
            isBlocked: false,
            blockReason: null
          };
        });
        
        console.log("🔒 Stanze virtuali detailed arricchite con cache:", roomsArray.filter(r => r.isBlocked));
      }
      
      return {
        success: true,
        error: null,
        data: roomsArray
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento delle stanze virtuali",
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

// Funzione per recuperare i dettagli di una stanza
export async function getRoomDetails(roomId) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/rooms/${roomId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento dei dettagli della stanza",
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

// ====== SERVIZI PRENOTAZIONI ======

// Funzione per recuperare le prenotazioni dell'utente corrente
export async function getMyBookings() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/prenotazioni/mie", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("📋 RISPOSTA COMPLETA getMyBookings:", data);
      console.log("📋 TIPO DI DATA:", typeof data, Array.isArray(data));
      
      // Gestisci diversi formati di risposta
      let bookingsArray = [];
      
      if (Array.isArray(data)) {
        // Se data è già un array
        bookingsArray = data;
        console.log("📋 Data è array diretto, lunghezza:", bookingsArray.length);
      } else if (data.bookings && Array.isArray(data.bookings)) {
        // Se data ha una proprietà bookings che è un array
        bookingsArray = data.bookings;
        console.log("📋 Usando data.bookings, lunghezza:", bookingsArray.length);
      } else if (data.prenotazioni && Array.isArray(data.prenotazioni)) {
        // Se data ha una proprietà prenotazioni che è un array
        bookingsArray = data.prenotazioni;
        console.log("📋 Usando data.prenotazioni, lunghezza:", bookingsArray.length);
      } else {
        // Fallback: array vuoto
        console.warn("⚠️ Formato risposta inaspettato:", data);
        bookingsArray = [];
      }
      
      console.log("📋 BOOKINGS ARRAY FINALE:", bookingsArray);
      
      // Ottieni informazioni sulle stanze per i nomi
      const roomsResponse = await getAllRooms();
      const rooms = roomsResponse.success ? roomsResponse.data : [];
      console.log("🏠 Risposta getAllRooms per nomi:", roomsResponse);
      console.log("🏠 Dati stanze ricevuti:", rooms);
      
      const roomsMap = {};
      
      // Crea una mappa ID -> nome stanza
      rooms.forEach(room => {
        console.log("🏠 Elaborando stanza:", room);
        const roomId = room.id || room.aulaId;
        const roomName = room.name || room.nome || room.nomeAula || `Stanza ${roomId}`;
        roomsMap[roomId] = roomName;
        console.log(`🏠 Mappato ID ${roomId} -> "${roomName}"`);
      });
      
      console.log("🏠 Mappa stanze finale:", roomsMap);
      
      // Mappa i dati del backend al formato frontend
      const normalizedBookings = bookingsArray.map(booking => {
        console.log("📋 Prenotazione grezza dal backend:", booking);
        console.log("📋 Tutte le proprietà disponibili:", Object.keys(booking));
        
        // Prova diverse proprietà per l'ID della stanza
        let aulaId;
        
        if (booking.aulaId) {
          aulaId = booking.aulaId;
        } else if (booking.roomId) {
          aulaId = booking.roomId;
        } else if (booking.aula && booking.aula.id) {
          // Il backend restituisce un oggetto aula con id
          aulaId = booking.aula.id;
          console.log(`📋 ID stanza da booking.aula.id: ${aulaId}`);
        } else if (booking.aula_id) {
          aulaId = booking.aula_id;
        } else if (booking.stanza_id) {
          aulaId = booking.stanza_id;
        } else if (booking.idAula) {
          aulaId = booking.idAula;
        } else {
          aulaId = undefined;
        }
        
        console.log(`📋 ID stanza estratto: ${aulaId} (da: aulaId=${booking.aulaId}, roomId=${booking.roomId}, aula.id=${booking.aula?.id}, aula_id=${booking.aula_id}, stanza_id=${booking.stanza_id}, idAula=${booking.idAula})`);
        
        // Prova diverse fonti per il nome della stanza
        let roomName;
        
        if (booking.nomeAula) {
          roomName = booking.nomeAula;
          console.log(`📋 Nome dalla prenotazione (nomeAula): "${roomName}"`);
        } else if (booking.roomName) {
          roomName = booking.roomName;
          console.log(`📋 Nome dalla prenotazione (roomName): "${roomName}"`);
        } else if (roomsMap[aulaId]) {
          roomName = roomsMap[aulaId];
          console.log(`📋 Nome dalla mappa stanze per ID ${aulaId}: "${roomName}"`);
        } else {
          roomName = aulaId ? `Stanza ${aulaId}` : 'Stanza sconosciuta';
          console.log(`📋 Nome fallback per ID ${aulaId}: "${roomName}"`);
        }
        
        return {
          id: booking.id,
          roomId: aulaId,
          roomName: roomName,
          date: booking.inizio ? booking.inizio.split('T')[0] : booking.date,
          startTime: booking.inizio ? booking.inizio.split('T')[1]?.slice(0, 5) : booking.startTime,
          endTime: booking.fine ? booking.fine.split('T')[1]?.slice(0, 5) : booking.endTime,
          purpose: booking.descrizione || booking.purpose,
          status: booking.stato || booking.status || 'active',
          stato: booking.stato || booking.status || 'PRENOTATA', // ✅ Aggiungiamo anche il campo 'stato'
          inizio: booking.inizio, // Mantieni anche il formato originale per compatibilità
          fine: booking.fine,
          aulaId: aulaId,
          descrizione: booking.descrizione || booking.purpose,
          corsoId: booking.corsoId || 1
        };
      });
      
      console.log("🔄 Prenotazioni normalizzate:", normalizedBookings);
      
      return {
        success: true,
        error: null,
        data: normalizedBookings
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nel caricamento delle prenotazioni",
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

// Funzione per creare una nuova prenotazione
export async function createBooking(bookingData) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    // Converti i dati nel formato richiesto dal backend
    const startDateTime = `${bookingData.date}T${bookingData.startTime}:00`;
    const endDateTime = `${bookingData.date}T${bookingData.endTime}:00`;

    const backendRequest = {
      aulaId: parseInt(bookingData.aulaId),  // Usa aulaId direttamente (fix per WeeklyCalendar)
      corsoId: bookingData.corsoId || null, // Usa corsoId se fornito, altrimenti null (prenotazione libera)
      inizio: startDateTime,                // Converte date+startTime in formato LocalDateTime
      fine: endDateTime,                    // Converte date+endTime in formato LocalDateTime
      descrizione: bookingData.purpose || "" // Converte purpose in descrizione
    };

    console.log("🎯 Creando prenotazione:", {
      original: bookingData,
      converted: backendRequest
    });

    const response = await fetch("/api/prenotazioni/prenota", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(backendRequest)
    });

    console.log("📡 Risposta prenotazione:", {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      // Gestione più robusta della risposta
      const text = await response.text();
      console.log("✅ Prenotazione riuscita:", text);
      
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("📋 Risposta parsata:", data);
          
          // Il backend restituisce { message: "...", prenotazione: {...} }
          if (data.prenotazione) {
            data.booking = data.prenotazione; // Adatta per il frontend
          }
        } catch {
          console.warn("⚠️ Risposta non è JSON valido:", text);
          // Se la prenotazione è andata a buon fine ma non c'è JSON, creiamo una risposta
          data = { 
            message: "Prenotazione creata con successo",
            booking: backendRequest
          };
        }
      } else {
        // Risposta vuota ma successo HTTP
        data = { 
          message: "Prenotazione creata con successo",
          booking: backendRequest
        };
      }
      
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      // Gestione errori più robusta
      let errorMessage = "Errore nella creazione della prenotazione";
      
      try {
        const text = await response.text();
        console.log("❌ Errore prenotazione:", {
          status: response.status,
          statusText: response.statusText,
          content: text
        });
        
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        console.warn("⚠️ Errore nel parsing della risposta di errore");
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
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

// Funzione per verificare la disponibilità di una stanza
export async function checkAvailability(roomId, date, startTime, endTime) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    // Converti date e time nel formato LocalDateTime richiesto dal backend
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;

    const params = new URLSearchParams({
      aulaId: roomId.toString(),  // Cambiato da roomId a aulaId
      inizio: startDateTime,      // Cambiato da date+startTime a inizio
      fine: endDateTime          // Cambiato da endTime a fine
    });

    const apiUrl = `/api/prenotazioni/disponibilita?${params}`;
    console.log("🔍 Verificando disponibilità:", {
      url: apiUrl,
      aulaId: roomId,
      inizio: startDateTime,
      fine: endDateTime,
      token: localStorage.getItem("token") ? "presente" : "assente"
    });

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    console.log("📡 Risposta ricevuta:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url
    });

    if (response.ok) {
      // Controlla se la risposta ha contenuto
      const text = await response.text();
      console.log("✅ Risposta di successo:", {
        hasContent: !!text,
        contentLength: text.length,
        content: text.substring(0, 200) + (text.length > 200 ? "..." : "")
      });
      
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("📋 JSON parsato con successo:", data);
          
          // Adatta la risposta del backend al formato aspettato dal frontend
          if (data.disponibile !== undefined) {
            data = {
              available: data.disponibile,
              roomId: data.aulaId,
              period: data.periodo,
              message: data.disponibile ? "Stanza disponibile" : "Stanza non disponibile"
            };
          }
        } catch {
          console.warn("⚠️ Risposta non è JSON valido:", text);
          // Se non è JSON, assumiamo che sia disponibile
          data = { available: true, message: "Stanza disponibile" };
        }
      } else {
        // Risposta vuota, assumiamo disponibile
        console.log("📭 Risposta vuota, assumo disponibilità");
        data = { available: true, message: "Stanza disponibile" };
      }
      
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      // Gestione errori più robusta
      let errorMessage = "Errore nella verifica della disponibilità";
      
      const text = await response.text();
      console.log("❌ Errore HTTP:", {
        status: response.status,
        statusText: response.statusText,
        hasContent: !!text,
        content: text
      });
      
      try {
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        }
      } catch {
        console.warn("⚠️ Errore nel parsing della risposta di errore");
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
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

// Funzione per aggiornare una prenotazione esistente
export async function updateBooking(bookingId, bookingData) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    // Converti i dati nel formato richiesto dal backend
    const startDateTime = `${bookingData.date}T${bookingData.startTime}:00`;
    const endDateTime = `${bookingData.date}T${bookingData.endTime}:00`;

    const backendRequest = {
      aulaId: parseInt(bookingData.roomId),  // Converte roomId in aulaId
      corsoId: bookingData.corsoId || 1,    // Usa corsoId se fornito, altrimenti default a 1
      inizio: startDateTime,                // Converte date+startTime in formato LocalDateTime
      fine: endDateTime,                    // Converte date+endTime in formato LocalDateTime
      descrizione: bookingData.purpose || "" // Converte purpose in descrizione
    };

    console.log("🔄 Aggiornando prenotazione:", {
      id: bookingId,
      original: bookingData,
      converted: backendRequest
    });

    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(backendRequest)
    });

    console.log("📡 Risposta aggiornamento:", {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      // Gestione più robusta della risposta
      const text = await response.text();
      console.log("✅ Aggiornamento riuscito:", text);
      
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("📋 Risposta parsata:", data);
          
          // Il backend restituisce { message: "...", prenotazione: {...} }
          if (data.prenotazione) {
            data.booking = data.prenotazione; // Adatta per il frontend
          }
        } catch {
          console.warn("⚠️ Risposta non è JSON valido:", text);
          // Se l'aggiornamento è andato a buon fine ma non c'è JSON, creiamo una risposta
          data = { 
            message: "Prenotazione aggiornata con successo",
            booking: { ...backendRequest, id: bookingId }
          };
        }
      } else {
        // Risposta vuota ma successo HTTP
        data = { 
          message: "Prenotazione aggiornata con successo",
          booking: { ...backendRequest, id: bookingId }
        };
      }
      
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      // Gestione errori più robusta
      let errorMessage = "Errore nell'aggiornamento della prenotazione";
      
      try {
        const text = await response.text();
        console.log("❌ Errore aggiornamento:", {
          status: response.status,
          statusText: response.statusText,
          content: text
        });
        
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        console.warn("⚠️ Errore nel parsing della risposta di errore");
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
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

// Funzione per eliminare una prenotazione
export async function deleteBooking(bookingId) {
  try {
    console.log("🗑️ deleteBooking - Tentativo eliminazione prenotazione ID:", bookingId);
    
    if (!localStorage.getItem("token")) {
      console.log("❌ deleteBooking - Token mancante");
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    console.log("📡 deleteBooking - Invio richiesta DELETE a:", `/api/prenotazioni/${bookingId}`);
    
    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    console.log("📡 deleteBooking - Risposta ricevuta:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.ok) {
      console.log("✅ deleteBooking - Prenotazione eliminata con successo");
      return {
        success: true,
        error: null,
        data: { message: "Prenotazione eliminata con successo" }
      };
    } else {
      const errorData = await response.json();
      console.log("❌ deleteBooking - Errore dal server:", errorData);
      return {
        success: false,
        error: errorData.message || "Errore nell'eliminazione della prenotazione",
        data: null
      };
    }
  } catch (err) {
    console.error("❌ deleteBooking - Errore di rete:", err);
    return {
      success: false,
      error: "Errore di connessione al server",
      data: null
    };
  }
}

// Funzione per eliminare una prenotazione come admin (può eliminare qualsiasi prenotazione)
export async function deleteBookingAsAdmin(bookingId, reason = null) {
  try {
    console.log("🗑️ deleteBookingAsAdmin - Tentativo eliminazione admin prenotazione ID:", bookingId);
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ deleteBookingAsAdmin - Token mancante");
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    console.log("🔐 deleteBookingAsAdmin - Token presente:", token ? "SI" : "NO");
    console.log("🔐 deleteBookingAsAdmin - Token (prime 50 char):", token ? token.substring(0, 50) + "..." : "N/A");
    
    // Decodifica il token per verificare il contenuto (solo per debug)
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log("🔐 deleteBookingAsAdmin - Token payload:", {
            sub: payload.sub,
            ruolo: payload.ruolo,
            exp: payload.exp,
            iat: payload.iat,
            userId: payload.userId
          });
          
          // Verifica se il token è scaduto
          const now = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp < now;
          console.log("🔐 deleteBookingAsAdmin - Token scaduto:", isExpired, "- Scadenza:", new Date(payload.exp * 1000));
        }
      } catch (decodeError) {
        console.log("⚠️ deleteBookingAsAdmin - Errore decodifica token:", decodeError);
      }
    }

    console.log("📡 deleteBookingAsAdmin - Invio richiesta DELETE a:", `/api/admin/prenotazioni/${bookingId}`);
    
    const requestBody = reason ? { reason } : {};
    
    const response = await fetch(`/api/admin/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: reason ? JSON.stringify(requestBody) : undefined
    });

    console.log("📡 deleteBookingAsAdmin - Risposta ricevuta:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.ok) {
      // Gestione della risposta di successo
      let responseData = null;
      
      try {
        // Tenta di leggere il JSON solo se c'è contenuto
        const contentLength = response.headers.get("content-length");
        const contentType = response.headers.get("content-type");
        
        if (contentLength !== "0" && contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        }
      } catch (jsonError) {
        console.log("⚠️ deleteBookingAsAdmin - Risposta senza JSON valido, probabile successo");
      }
      
      console.log("✅ deleteBookingAsAdmin - Prenotazione eliminata con successo");
      return {
        success: true,
        error: null,
        data: responseData || { message: "Prenotazione eliminata con successo dall'amministratore" }
      };
    } else {
      // Fallback: se l'endpoint admin non esiste, usa quello normale
      if (response.status === 404) {
        console.log("⚠️ deleteBookingAsAdmin - Endpoint admin non trovato, fallback a deleteBooking normale");
        return await deleteBooking(bookingId);
      }
      
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.log("⚠️ deleteBookingAsAdmin - Errore senza JSON valido");
        errorData = { message: "Errore nell'eliminazione della prenotazione" };
      }
      
      console.log("❌ deleteBookingAsAdmin - Errore dal server:", errorData);
      return {
        success: false,
        error: errorData.message || "Errore nell'eliminazione della prenotazione",
        data: null
      };
    }
  } catch (err) {
    console.error("❌ deleteBookingAsAdmin - Errore di rete:", err);
    return {
      success: false,
      error: "Errore di connessione al server",
      data: null
    };
  }
}

// ====== SERVIZI ADMIN STANZE ======

// Funzione per aggiornare una stanza (solo admin)
export async function updateRoom(roomId, roomData) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(roomData)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nell'aggiornamento della stanza",
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

// Funzione per creare una nuova stanza (solo admin)
export async function createRoom(roomData) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/admin/createrooms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(roomData)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        error: null,
        data: data
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nella creazione della stanza",
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

// Funzione per bloccare/sbloccare una stanza (solo admin) - Versione aggiornata
export async function toggleRoomBlock(roomId, blockData) {
  try {
    const token = localStorage.getItem("token");
    
    console.log('🔒 toggleRoomBlock - Versione aggiornata:');
    console.log('  - Room ID:', roomId);
    console.log('  - Block Data:', blockData);
    
    if (!token) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    // Strategia: usa l'endpoint di update della stanza
    // Prima ottieni i dati correnti di tutte le stanze
    const roomsResponse = await fetch(`/api/admin/rooms`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (!roomsResponse.ok) {
      console.error('🔒 Errore nel recupero stanze:', roomsResponse.status);
      return {
        success: false,
        error: "Impossibile ottenere i dati delle stanze",
        data: null
      };
    }
    
    const roomsText = await roomsResponse.text();
    console.log('🔒 Risposta raw da /api/admin/rooms:', roomsText);
    
    let rooms;
    try {
      rooms = JSON.parse(roomsText);
      console.log('🔒 Dati parsati:', rooms);
      console.log('🔒 Tipo di rooms:', typeof rooms);
      console.log('🔒 È array?', Array.isArray(rooms));
      
      // Se rooms è un oggetto con una proprietà che contiene l'array
      if (typeof rooms === 'object' && !Array.isArray(rooms)) {
        console.log('🔒 Proprietà di rooms:', Object.keys(rooms));
        
        // Controlla se c'è una proprietà che contiene l'array
        for (const [key, value] of Object.entries(rooms)) {
          console.log(`🔒 ${key}:`, Array.isArray(value) ? `Array di ${value.length} elementi` : typeof value);
          if (Array.isArray(value)) {
            console.log('🔒 Trovato array in proprietà:', key);
            rooms = value; // Usa questo array
            break;
          }
        }
      }
      
    } catch (e) {
      console.error('🔒 Errore parsing stanze:', e);
      return {
        success: false,
        error: "Errore nel parsing dei dati delle stanze",
        data: null
      };
    }
    
    // Verifica finale che rooms sia un array
    if (!Array.isArray(rooms)) {
      console.error('🔒 rooms non è un array dopo il parsing:', rooms);
      return {
        success: false,
        error: "I dati delle stanze non sono nel formato array atteso",
        data: null
      };
    }
    
    // Trova la stanza specifica
    const targetRoom = rooms.find(room => room.id === parseInt(roomId));
    if (!targetRoom) {
      console.error('🔒 Stanza non trovata nella lista');
      return {
        success: false,
        error: "Stanza non trovata",
        data: null
      };
    }
    
    console.log('🔒 Stanza corrente:', targetRoom);
    
    // Gestisci i diversi formati di blockData (retrocompatibilità)
    let requestData;
    if (typeof blockData === 'boolean') {
      // Vecchio formato: solo booleano
      requestData = { isBlocked: blockData };
    } else if (blockData && typeof blockData === 'object') {
      // Nuovo formato: oggetto con isBlocked e blockReason
      requestData = blockData;
    } else {
      console.error('🔒 Formato blockData non valido:', blockData);
      return {
        success: false,
        error: "Formato dati blocco non valido",
        data: null
      };
    }

    // Crea i dati completi per l'update mantenendo tutti i valori esistenti
    const updateData = {
      nome: targetRoom.nome,
      capienza: targetRoom.capienza, 
      piano: targetRoom.piano,
      isBlocked: requestData.isBlocked,
      isVirtual: targetRoom.isVirtual || false,
      blockReason: requestData.blockReason || (requestData.isBlocked ? "Stanza bloccata" : null)
    };
    
    console.log('🔒 Dati update completi:', updateData);
    
    // Esegui l'update tramite PUT /api/admin/rooms/{id}
    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    console.log('🔒 Risposta update stanza:', {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      // Gestione robusta della risposta
      let responseText = "";
      try {
        responseText = await response.text();
      } catch (e) {
        console.log('🔒 Risposta vuota ma successo HTTP');
      }
      
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('✅ Risposta JSON parsata:', data);
        } catch (e) {
          console.log('⚠️ Risposta non è JSON valido, ma operazione riuscita');
          data = { 
            message: "Operazione completata con successo",
            roomId: roomId,
            isBlocked: requestData.isBlocked
          };
        }
      } else {
        console.log('✅ Risposta vuota, assumo successo');
        data = { 
          message: "Operazione completata con successo",
          roomId: roomId,
          isBlocked: requestData.isBlocked
        };
      }
      
      // Aggiorna la cache locale con i nuovi dati di blocco
      updateBlockedRoomCache(roomId, requestData.isBlocked, requestData.blockReason);
      
      return {
        success: true,
        error: null,
        data: data
      };
      
    } else {
      // Gestione errori robusta
      let errorMessage = "Errore nell'aggiornamento della stanza";
      
      try {
        const text = await response.text();
        console.error('❌ Errore update stanza:', {
          status: response.status,
          statusText: response.statusText,
          content: text
        });
        
        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Se non è JSON, usa il testo raw
            errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
          }
        }
      } catch (e) {
        console.error('🔒 Errore nella lettura della risposta di errore:', e);
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }

  } catch (error) {
    console.error('❌ Errore rete toggleRoomBlock:', error);
    return {
      success: false,
      error: `Errore di connessione: ${error.message}`,
      data: null
    };
  }
}

// Funzione per recuperare tutte le prenotazioni (solo admin)
export async function getAllBookings() {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch("/api/prenotazioni", {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      // Gestione robusta della risposta
      const text = await response.text();
      console.log("📋 RISPOSTA RAW getAllBookings:", {
        hasContent: !!text,
        contentLength: text.length,
        content: text.substring(0, 200) + (text.length > 200 ? "..." : "")
      });
      
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("📋 RISPOSTA COMPLETA getAllBookings:", data);
        } catch {
          console.warn("⚠️ Risposta getAllBookings non è JSON valido:", text);
          // Se non è JSON valido, assumiamo array vuoto
          data = [];
        }
      } else {
        // Risposta vuota
        console.log("📭 Risposta getAllBookings vuota, assumo array vuoto");
        data = [];
      }
      
      // Gestisci diversi formati di risposta
      let bookingsArray = [];
      
      if (Array.isArray(data)) {
        bookingsArray = data;
      } else if (data.bookings && Array.isArray(data.bookings)) {
        bookingsArray = data.bookings;
      } else if (data.prenotazioni && Array.isArray(data.prenotazioni)) {
        bookingsArray = data.prenotazioni;
      } else {
        console.warn("⚠️ Formato risposta getAllBookings inaspettato:", data);
        bookingsArray = [];
      }
      
      // Ottieni informazioni sulle stanze per i nomi
      const roomsResponse = await getAllRooms();
      const rooms = roomsResponse.success ? roomsResponse.data : [];
      const roomsMap = {};
      
      // Crea una mappa ID -> nome stanza
      rooms.forEach(room => {
        const roomId = room.id || room.aulaId;
        const roomName = room.name || room.nome || room.nomeAula || `Stanza ${roomId}`;
        roomsMap[roomId] = roomName;
      });
      
      // Normalizza i dati come in getMyBookings
      const normalizedBookings = bookingsArray.map(booking => {
        console.log("📋 Admin - Prenotazione grezza:", booking);
        
        // Prova diverse proprietà per l'ID della stanza (stesso logic di getMyBookings)
        let aulaId;
        
        if (booking.aulaId) {
          aulaId = booking.aulaId;
        } else if (booking.roomId) {
          aulaId = booking.roomId;
        } else if (booking.aula && booking.aula.id) {
          // Il backend restituisce un oggetto aula con id
          aulaId = booking.aula.id;
          console.log(`📋 Admin - ID stanza da booking.aula.id: ${aulaId}`);
        } else if (booking.aula_id) {
          aulaId = booking.aula_id;
        } else if (booking.stanza_id) {
          aulaId = booking.stanza_id;
        } else if (booking.idAula) {
          aulaId = booking.idAula;
        } else {
          aulaId = undefined;
        }
        
        let roomName;
        if (booking.nomeAula) {
          roomName = booking.nomeAula;
        } else if (booking.roomName) {
          roomName = booking.roomName;
        } else if (roomsMap[aulaId]) {
          roomName = roomsMap[aulaId];
        } else {
          roomName = aulaId ? `Stanza ${aulaId}` : 'Stanza sconosciuta';
        }
        
        return {
          id: booking.id,
          roomId: aulaId,
          roomName: roomName,
          date: booking.inizio ? booking.inizio.split('T')[0] : booking.date,
          startTime: booking.inizio ? booking.inizio.split('T')[1]?.slice(0, 5) : booking.startTime,
          endTime: booking.fine ? booking.fine.split('T')[1]?.slice(0, 5) : booking.endTime,
          purpose: booking.descrizione || booking.purpose,
          status: booking.stato || booking.status || 'active',
          stato: booking.stato || booking.status || 'PRENOTATA', // ✅ Aggiungiamo anche il campo 'stato'
          inizio: booking.inizio,
          fine: booking.fine,
          aulaId: aulaId,
          descrizione: booking.descrizione || booking.purpose,
          corsoId: booking.corsoId || 1,
          // Aggiungi info utente se disponibili
          userId: booking.userId || booking.utenteId,
          userName: booking.userName || booking.nomeUtente || booking.utente?.nome || 'Utente sconosciuto'
        };
      });
      
      console.log("🔄 Admin - Prenotazioni normalizzate:", normalizedBookings);
      
      return {
        success: true,
        error: null,
        data: normalizedBookings
      };
    } else {
      // Gestione errori più robusta per getAllBookings
      let errorMessage = "Errore nel caricamento delle prenotazioni admin";
      
      try {
        const text = await response.text();
        console.log("❌ Errore getAllBookings:", {
          status: response.status,
          statusText: response.statusText,
          content: text
        });
        
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        console.warn("⚠️ Errore nel parsing della risposta di errore getAllBookings");
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
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

// Funzione per ottenere le prenotazioni di una stanza per una data specifica
export async function getRoomBookingsByDate(roomId, date) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: []
      };
    }

    // Prima ottieni tutte le prenotazioni
    const allBookingsResult = await getAllBookings();
    
    if (!allBookingsResult.success) {
      // Se non è admin, prova con le proprie prenotazioni
      const myBookingsResult = await getMyBookings();
      if (!myBookingsResult.success) {
        return {
          success: false,
          error: "Impossibile ottenere le prenotazioni",
          data: []
        };
      }
      
      // Filtra le prenotazioni per stanza e data
      const filteredBookings = myBookingsResult.data.filter(booking => {
        const bookingRoomId = booking.roomId || booking.aulaId;
        const bookingDate = booking.date;
        return bookingRoomId == roomId && bookingDate === date;
      });

      return {
        success: true,
        error: null,
        data: filteredBookings
      };
    }

    // Se è admin, filtra tutte le prenotazioni
    const filteredBookings = allBookingsResult.data.filter(booking => {
      const bookingRoomId = booking.roomId || booking.aulaId;
      const bookingDate = booking.date;
      return bookingRoomId == roomId && bookingDate === date && 
             (booking.status === 'active' || booking.stato === 'PRENOTATA');
    });

    console.log(`🔍 Prenotazioni trovate per stanza ${roomId} in data ${date}:`, filteredBookings);

    return {
      success: true,
      error: null,
      data: filteredBookings
    };

  } catch (err) {
    console.error("Errore nel recupero prenotazioni per stanza/data:", err);
    return {
      success: false,
      error: "Errore di connessione al server",
      data: []
    };
  }
}

// Funzione per analizzare lo stato di disponibilità di una stanza in una data
export function analyzeRoomAvailability(bookings) {
  // Se non ci sono prenotazioni, la stanza è libera
  if (!bookings || bookings.length === 0) {
    return {
      status: 'free', // libera
      message: null,
      occupiedPeriods: [],
      timeSlots: {
        morning: { available: true, label: 'Mattina (9:00-13:00)' },
        afternoon: { available: true, label: 'Pomeriggio (14:00-18:00)' }
      }
    };
  }

  // Definisci le finestre temporali standard
  const timeSlots = [
    { id: 'morning', label: 'Mattina', startTime: '09:00', endTime: '13:00', hours: '9:00-13:00' },
    { id: 'afternoon', label: 'Pomeriggio', startTime: '14:00', endTime: '18:00', hours: '14:00-18:00' }
  ];

  // Controlla disponibilità per ogni finestra temporale
  const timeSlotAvailability = {};
  timeSlots.forEach(slot => {
    const hasConflict = bookings.some(booking => {
      if (!booking.startTime || !booking.endTime) return false;
      
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      // Verifica sovrapposizione con la finestra temporale
      return (bookingStart < slot.endTime && bookingEnd > slot.startTime);
    });
    
    timeSlotAvailability[slot.id] = {
      available: !hasConflict,
      label: `${slot.label} (${slot.hours})`
    };
  });

  // Ordina le prenotazioni per orario di inizio
  const sortedBookings = bookings
    .filter(booking => booking.startTime && booking.endTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const occupiedPeriods = sortedBookings.map(booking => ({
    start: booking.startTime,
    end: booking.endTime,
    purpose: booking.purpose || booking.descrizione || 'Prenotazione'
  }));

  // Determina lo status generale
  const availableSlots = Object.values(timeSlotAvailability).filter(slot => slot.available).length;
  
  if (availableSlots === 0) {
    return {
      status: 'full', // completamente occupata
      message: 'Stanza non disponibile - tutte le fasce orarie occupate',
      occupiedPeriods,
      timeSlots: timeSlotAvailability
    };
  } else if (availableSlots === timeSlots.length) {
    return {
      status: 'free', // completamente libera
      message: null,
      occupiedPeriods,
      timeSlots: timeSlotAvailability
    };
  } else {
    // Parzialmente occupata
    const occupiedSlots = Object.entries(timeSlotAvailability)
      .filter(([, slot]) => !slot.available)
      .map(([, slot]) => slot.label);
    
    return {
      status: 'partial', // parzialmente occupata
      message: `Fasce occupate: ${occupiedSlots.join(', ')}`,
      occupiedPeriods,
      timeSlots: timeSlotAvailability
    };
  }
}