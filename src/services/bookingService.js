// ===== UTILITY FUNCTIONS =====

/**
 * Genera un ID di richiesta univoco per il tracking
 * @param {string} operation - Nome dell'operazione (es: 'GET_BOOKINGS', 'CREATE_BOOKING')
 * @returns {string} - ID univoco
 */
function generateRequestId(operation = 'BOOKING') {
  return `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se il token è presente e valido
 * @returns {string|null} - Token se presente, null altrimenti
 */
function getValidToken() {
  const token = localStorage.getItem("token");
  if (!token || token.trim().length === 0) {
    return null;
  }
  return token;
}

/**
 * Crea headers standardizzati per le richieste booking
 * @param {string} requestId - ID della richiesta
 * @returns {object} - Headers object
 */
function createBookingHeaders(requestId) {
  const token = getValidToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Request-ID": requestId
  };
}

/**
 * Gestisce la risposta standardizzata del backend per bookings
 * @param {Response} response - Risposta fetch
 * @param {string} requestId - ID della richiesta
 * @param {string} errorMessage - Messaggio di errore default
 * @returns {Promise<{success: boolean, error: string|null, data: any|null}>}
 */
async function handleBookingResponse(response, requestId, errorMessage) {
  try {
    const data = await response.json();
        
    if (response.ok) {
      // Gestione successo con struttura standardizzata
      const resultData = data.success && data.data ? data.data : data;
      
      
      return {
        success: true,
        error: null,
        data: resultData
      };
    } else {
      // Gestione errori con struttura standardizzata
      const errorMsg = data.userMessage || data.message || errorMessage;
          
      return {
        success: false,
        error: errorMsg,
        data: null
      };
    }
  } catch  {
    
    return {
      success: false,
      error: "Errore nella comunicazione con il server",
      data: null
    };
  }
}

/**
 * Gestisce errori di rete per bookings
 * @param {Error} error - Errore di rete
 * @param {string} requestId - ID della richiesta
 * @returns {{success: boolean, error: string, data: null}}
 */
function handleBookingNetworkError(error) {
  
  
  let errorMessage = "Errore di connessione al server";
  
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    errorMessage = "Impossibile connettersi al server. Verifica la connessione internet.";
  } else if (error.name === "AbortError") {
    errorMessage = "Richiesta annullata. Riprova.";
  } else if (error.message.includes("timeout")) {
    errorMessage = "Timeout di connessione. Il server potrebbe essere sovraccarico.";
  }
  
  return {
    success: false,
    error: errorMessage,
    data: null
  };
}

// ===== ROOM CACHE MANAGEMENT =====

// Cache locale per le stanze bloccate (workaround per backend che non restituisce i dati)
let blockedRoomsCache = new Map(); // Map<roomId, {isBlocked: boolean, blockReason: string}>

// Funzione per aggiornare la cache locale
function updateBlockedRoomCache(roomId, isBlocked, blockReason = null) {
  if (isBlocked) {
    blockedRoomsCache.set(parseInt(roomId), {
      isBlocked: true,
      blockReason: blockReason
    });
    
  } else {
    blockedRoomsCache.delete(parseInt(roomId));
    
  }
  
  // Salva in localStorage per persistenza
  try {
    localStorage.setItem('blockedRoomsCache', JSON.stringify(Array.from(blockedRoomsCache.entries())));
  } catch {
    return null;
  }
}

// Funzione per caricare la cache da localStorage
function loadBlockedRoomCache() {
  try {
    const cached = localStorage.getItem('blockedRoomsCache');
    if (cached) {
      const entries = JSON.parse(cached);
      blockedRoomsCache = new Map(entries);
      
    }
  } catch {
    
    blockedRoomsCache = new Map();
  }
}

// Carica la cache all'avvio
loadBlockedRoomCache();

/**
 * Recupera tutte le stanze (con cache blocchi)
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getAllRooms() {
  const requestId = generateRequestId('GET_ALL_ROOMS');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/rooms", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nel caricamento delle stanze"
    );
    
    // Post-elaborazione per normalizzare e arricchire con cache
    if (result.success && result.data) {
      let roomsArray = [];
      
      if (Array.isArray(result.data)) {
        roomsArray = result.data;
      } else if (Array.isArray(result.data.rooms)) {
        // Fallback per strutture legacy
        
        roomsArray = result.data.rooms;
      } else {
        
        roomsArray = [];
      }
      
      // Arricchimento con cache blocchi
      const enrichedRooms = roomsArray.map(room => {
        const cached = blockedRoomsCache.get(room.id);
        
        // Normalizzazione campi per compatibilità
        const normalizedRoom = {
          ...room,
          name: room.nome || room.name || `Stanza ${room.id}`,
          nome: room.nome || room.name || `Stanza ${room.id}`,
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
      
      result.data = enrichedRooms;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
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
      
      
      // Gestisci diversi formati di risposta
      let roomsArray = [];
      
      if (Array.isArray(data)) {
        roomsArray = data;
      } else if (data.data && data.data.rooms && Array.isArray(data.data.rooms)) {
        // Formato backend: {data: {rooms: [...], totalRooms: n}}
        roomsArray = data.data.rooms;
      } else if (data.rooms && Array.isArray(data.rooms)) {
        roomsArray = data.rooms;
      } else if (data.aule && Array.isArray(data.aule)) {
        roomsArray = data.aule;
      } else {
        
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
    
  } catch {
    
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
    
  } catch {
    
    return {
      success: false,
      error: "Errore di connessione al server",
      data: null
    };
  }
}

// ===== FUNZIONI PER STANZE FISICHE =====

/**
 * Recupera le stanze fisiche
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getPhysicalRooms() {
  const requestId = generateRequestId('GET_PHYSICAL_ROOMS');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/rooms/physical", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nel caricamento delle stanze fisiche"
    );
    
    // Post-elaborazione per normalizzare i dati delle stanze fisiche
    if (result.success && result.data) {
      let roomsArray = [];
      
      if (Array.isArray(result.data)) {
        roomsArray = result.data;
      } else if (Array.isArray(result.data.rooms)) {
        
        roomsArray = result.data.rooms;
      } else {
        
        roomsArray = [];
      }
      
      // Normalizzazione dati semplice
      const normalizedRooms = roomsArray.map(room => ({
        id: room.id,
        nome: room.nome || room.name || room.nomeAula || `Stanza ${room.id}`,
        name: room.name || room.nome || room.nomeAula || `Stanza ${room.id}`,
        capienza: room.capienza || room.capacity || 0,
        capacity: room.capacity || room.capienza || 0,
        piano: room.piano || room.location || '',
        location: room.location || room.piano || '',
        attiva: room.attiva !== undefined ? room.attiva : (room.active !== undefined ? room.active : true),
        active: room.active !== undefined ? room.active : (room.attiva !== undefined ? room.attiva : true),
        ...room
      }));
      
      
      
      result.data = normalizedRooms;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per recuperare solo le stanze fisiche con dettagli
/**
 * Recupera le stanze fisiche con dettagli
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getPhysicalRoomsDetailed() {
  const requestId = generateRequestId('GET_PHYSICAL_ROOMS_DETAILED');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/rooms/physical/detailed", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nel caricamento delle stanze fisiche"
    );
    
    // Post-elaborazione per normalizzare e arricchire stanze fisiche
    if (result.success && result.data) {
      let roomsArray = [];
      
      // Gestisci diversi formati di risposta dal backend
      if (Array.isArray(result.data)) {
        roomsArray = result.data;
      } else if (Array.isArray(result.data.rooms)) {
        
        roomsArray = result.data.rooms;
      } else if (Array.isArray(result.data.data)) {
        
        roomsArray = result.data.data;
      } else {
        
        roomsArray = [];
      }
      
      // Arricchisci le stanze con i dati di blocco dalla cache e normalizza
      const enrichedRooms = roomsArray.map(room => {
        const cached = blockedRoomsCache.get(room.id);
        
        // Normalizziamo i campi per compatibilità
        return {
          id: room.id,
          nome: room.nome || room.name || room.nomeAula || `Stanza ${room.id}`,
          name: room.name || room.nome || room.nomeAula || `Stanza ${room.id}`,
          nomeAula: room.nomeAula || room.nome || room.name || `Stanza ${room.id}`,
          
          // Capacità
          capienza: room.capienza || room.capacity || 0,
          capacity: room.capacity || room.capienza || 0,
          
          // Posizione
          posizione: room.posizione || room.location || room.piano || '',
          location: room.location || room.posizione || room.piano || '',
          piano: room.piano || room.posizione || room.location || '',
          
          // Attrezzature
          attrezzature: room.attrezzature || room.equipment || [],
          equipment: room.equipment || room.attrezzature || [],
          
          // Stato
          attiva: room.attiva !== undefined ? room.attiva : (room.active !== undefined ? room.active : true),
          active: room.active !== undefined ? room.active : (room.attiva !== undefined ? room.attiva : true),
          
          // Informazioni di blocco dalla cache
          isBlocked: cached ? cached.isBlocked : false,
          blockedUntil: cached ? cached.blockedUntil : null,
          blockReason: cached ? cached.blockReason : null,
          
          // Mantieni tutti gli altri campi originali
          ...room
        };
      });
      
      
      
      result.data = enrichedRooms;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per recuperare solo le stanze virtuali con dettagli
/**
 * Recupera le stanze virtuali con dettagli
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getVirtualRoomsDetailed() {
  const requestId = generateRequestId('GET_VIRTUAL_ROOMS_DETAILED');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/rooms/virtual/detailed", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nel caricamento delle stanze virtuali"
    );
    
    // Post-elaborazione per normalizzare e arricchire stanze virtuali
    if (result.success && result.data) {
      let roomsArray = [];
      
      // Gestisci diversi formati di risposta dal backend
      if (Array.isArray(result.data)) {
        roomsArray = result.data;
      } else if (Array.isArray(result.data.rooms)) {
        
        roomsArray = result.data.rooms;
      } else if (Array.isArray(result.data.data)) {
        
        roomsArray = result.data.data;
      } else {
        
        roomsArray = [];
      }
      
      // Arricchisci le stanze con i dati di blocco dalla cache e normalizza
      const enrichedRooms = roomsArray.map(room => {
        const cached = blockedRoomsCache.get(room.id);
        
        // Normalizziamo i campi per compatibilità
        return {
          id: room.id,
          nome: room.nome || room.name || room.nomeAula || `Stanza ${room.id}`,
          name: room.name || room.nome || room.nomeAula || `Stanza ${room.id}`,
          nomeAula: room.nomeAula || room.nome || room.name || `Stanza ${room.id}`,
          
          // Capacità
          capienza: room.capienza || room.capacity || 0,
          capacity: room.capacity || room.capienza || 0,
          
          // Posizione
          posizione: room.posizione || room.location || room.piano || '',
          location: room.location || room.posizione || room.piano || '',
          piano: room.piano || room.posizione || room.location || '',
          
          // Attrezzature
          attrezzature: room.attrezzature || room.equipment || [],
          equipment: room.equipment || room.attrezzature || [],
          
          // Stato
          attiva: room.attiva !== undefined ? room.attiva : (room.active !== undefined ? room.active : true),
          active: room.active !== undefined ? room.active : (room.attiva !== undefined ? room.attiva : true),
          
          // Informazioni di blocco dalla cache
          isBlocked: cached ? cached.isBlocked : false,
          blockedUntil: cached ? cached.blockedUntil : null,
          blockReason: cached ? cached.blockReason : null,
          
          // Mantieni tutti gli altri campi originali
          ...room
        };
      });
      
      
      
      result.data = enrichedRooms;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
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
    
  } catch  {
    
    return {
      success: false,
      error: "Errore di connessione al server",
      data: null
    };
  }
}

// ===== BOOKING DATA NORMALIZATION =====

/**
 * Normalizza i dati di una prenotazione per garantire consistenza
 * @param {object} bookingData - Dati grezzi della prenotazione dal backend
 * @returns {object|null} - Oggetto prenotazione normalizzato
 */
function normalizeBookingData(bookingData) {
  if (!bookingData) {
    
    return null;
  }

  try {
    const normalized = {
      // ID obbligatorio
      id: bookingData.id,
      
      // IDs delle entità collegate
      aulaId: bookingData.aulaId || bookingData.roomId || bookingData.stanzaId,
      roomId: bookingData.roomId || bookingData.aulaId || bookingData.stanzaId,
      corsoId: bookingData.corsoId || bookingData.courseId,
      courseId: bookingData.courseId || bookingData.corsoId,
      utenteId: bookingData.utenteId || bookingData.userId,
      userId: bookingData.userId || bookingData.utenteId,
      
      // Date e orari - con fallback multipli
      inizio: bookingData.inizio || bookingData.startTime || bookingData.dataInizio,
      fine: bookingData.fine || bookingData.endTime || bookingData.dataFine,
      startTime: bookingData.startTime || bookingData.inizio || bookingData.dataInizio,
      endTime: bookingData.endTime || bookingData.fine || bookingData.dataFine,
      
      // Data della prenotazione - estratta da inizio se non presente
      data: bookingData.data || bookingData.date || bookingData.dataPrenotazione || 
            (bookingData.inizio ? bookingData.inizio.split('T')[0] : null),
      date: bookingData.date || bookingData.data || bookingData.dataPrenotazione ||
            (bookingData.inizio ? bookingData.inizio.split('T')[0] : null),
      
      // Descrizione
      descrizione: bookingData.descrizione || bookingData.description || '',
      description: bookingData.description || bookingData.descrizione || '',
      
      // Status
      stato: bookingData.stato || bookingData.status || 'confermata',
      status: bookingData.status || bookingData.stato || 'confermata',
      
      // Informazioni aula
      nomeAula: bookingData.nomeAula || bookingData.roomName || bookingData.aulaName,
      roomName: bookingData.roomName || bookingData.nomeAula || bookingData.aulaName,
      
      // Informazioni corso
      nomeCorso: bookingData.nomeCorso || bookingData.courseName || bookingData.courseTitle,
      courseName: bookingData.courseName || bookingData.nomeCorso || bookingData.courseTitle,
      
      // Timestamp
      dataCreazione: bookingData.dataCreazione || bookingData.createdAt || new Date().toISOString(),
      createdAt: bookingData.createdAt || bookingData.dataCreazione || new Date().toISOString(),
      
      // Mantieni tutti gli altri campi originali
      ...bookingData
    };
    
    // Validazione finale
    if (!normalized.id) {
      
      return null;
    }
    
    return normalized;
    
  } catch  {
    
    return null;
  }
}

// ====== SERVIZI PRENOTAZIONI ======

// Funzione per recuperare le prenotazioni dell'utente corrente
/**
 * Recupera le prenotazioni dell'utente corrente
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getMyBookings() {
  const requestId = generateRequestId('GET_MY_BOOKINGS');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/prenotazioni/mie", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nel caricamento delle tue prenotazioni"
    );
    
    // Post-elaborazione per normalizzare prenotazioni
    if (result.success && result.data) {
      let bookingsArray = [];
      
      if (Array.isArray(result.data)) {
        bookingsArray = result.data;
      } else if (Array.isArray(result.data.prenotazioni)) {
        
        bookingsArray = result.data.prenotazioni;
      } else if (Array.isArray(result.data.bookings)) {
        
        bookingsArray = result.data.bookings;
      } else {
        
        bookingsArray = [];
      }
      
      // Normalizzazione e ordinamento per data
      const normalizedBookings = bookingsArray
        .map(booking => normalizeBookingData(booking))
        .filter(booking => booking !== null)
        .sort((a, b) => new Date(`${b.inizio}`) - new Date(`${a.inizio}`)); // Più recenti prima
      
      
      
      result.data = normalizedBookings;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}
// Funzione per creare una nuova prenotazione
/**
 * Crea una nuova prenotazione
 * @param {object} bookingData - Dati della prenotazione da creare
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function createBooking(bookingData) {
  const requestId = generateRequestId('CREATE_BOOKING');
    
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione dati prenotazione
  if (!bookingData || typeof bookingData !== 'object') {
    
    return {
      success: false,
      error: "Dati prenotazione non forniti o non validi.",
      data: null
    };
  }
  
  // Validazione campi obbligatori per formato frontend
  const requiredFields = ['aulaId', 'date', 'startTime', 'endTime'];
  const missingFields = requiredFields.filter(field => !bookingData[field]);
  
  if (missingFields.length > 0) {
    
    return {
      success: false,
      error: `Campi obbligatori mancanti: ${missingFields.join(', ')}`,
      data: null
    };
  }
  
  // Validazione e conversione formato date
  try {
    const startDateTime = `${bookingData.date}T${bookingData.startTime}:00`;
    const endDateTime = `${bookingData.date}T${bookingData.endTime}:00`;
    
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Date non valide');
    }
    
    if (startDate >= endDate) {
      
      return {
        success: false,
        error: "L'orario di fine deve essere successivo all'orario di inizio.",
        data: null
      };
    }
    
    if (startDate < new Date()) {
      
      return {
        success: false,
        error: "Non è possibile prenotare nel passato.",
        data: null
      };
    }
    
    // Prepara i dati nel formato richiesto dal backend
    const backendRequest = {
      aulaId: parseInt(bookingData.aulaId),
      corsoId: bookingData.corsoId || null,
      inizio: startDateTime,
      fine: endDateTime,
      descrizione: bookingData.purpose || ""
    };
    
    

    const response = await fetch("/api/prenotazioni/prenota", {
      method: "POST",
      headers: createBookingHeaders(requestId),
      body: JSON.stringify(backendRequest)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nella creazione della prenotazione"
    );
    
    // Normalizza i dati della prenotazione creata
    if (result.success && result.data) {
      // Il backend può restituire structure { message: "...", prenotazione: {...} }
      if (result.data.prenotazione) {
        result.data = normalizeBookingData(result.data.prenotazione);
      } else {
        result.data = normalizeBookingData(result.data);
      }
      
    }
    
    return result;
    
  } catch (err) {
    // Gestisce errori di validazione date, conversione, e errori di rete
    if (err.message === "Date non valide" || err.message?.includes("validazione")) {
      
      return {
        success: false,
        error: "Formato date non valido.",
        data: null
      };
    }
    
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per verificare la disponibilità di una stanza
/**
 * Verifica la disponibilità di una stanza per un determinato periodo
 * @param {number} roomId - ID della stanza
 * @param {string} date - Data nel formato YYYY-MM-DD
 * @param {string} startTime - Orario di inizio nel formato HH:MM
 * @param {string} endTime - Orario di fine nel formato HH:MM
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function checkAvailability(roomId, date, startTime, endTime) {
  const requestId = generateRequestId('CHECK_AVAILABILITY');
    
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!roomId || !date || !startTime || !endTime) {
    
    return {
      success: false,
      error: "Parametri richiesti mancanti (roomId, date, startTime, endTime).",
      data: null
    };
  }
  
  try {
    // Converti date e time nel formato LocalDateTime richiesto dal backend
    const startDateTime = `${date}T${startTime}:00`;
    const endDateTime = `${date}T${endTime}:00`;
    
    // Validazione formato date
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      
      return {
        success: false,
        error: "Formato date non valido.",
        data: null
      };
    }
    
    if (startDate >= endDate) {
      
      return {
        success: false,
        error: "L'orario di fine deve essere successivo all'orario di inizio.",
        data: null
      };
    }

    const params = new URLSearchParams({
      aulaId: roomId.toString(),
      inizio: startDateTime,
      fine: endDateTime
    });

    const apiUrl = `/api/prenotazioni/disponibilita?${params}`;
    

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nella verifica della disponibilità"
    );
    
    // Post-elaborazione per normalizzare la risposta di disponibilità
    if (result.success && result.data) {
      // Il backend può restituire { disponibile: true/false, aulaId: ..., periodo: ... }
      let normalizedData = {
        available: result.data.disponibile ?? result.data.available ?? true,
        roomId: result.data.aulaId || result.data.roomId || roomId,
        period: {
          start: startDateTime,
          end: endDateTime,
          date: date,
          startTime: startTime,
          endTime: endTime
        },
        message: undefined
      };
      
      // Aggiungi messaggio descrittivo
      if (normalizedData.available) {
        normalizedData.message = "Stanza disponibile per il periodo richiesto";
      } else {
        normalizedData.message = result.data.message || result.data.motivo || "Stanza non disponibile per il periodo richiesto";
      }
      
      
      
      result.data = normalizedData;
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per aggiornare una prenotazione esistente
/**
 * Aggiorna una prenotazione esistente
 * @param {number} bookingId - ID della prenotazione da aggiornare
 * @param {object} bookingData - Nuovi dati della prenotazione
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function updateBooking(bookingId, bookingData) {
  const requestId = generateRequestId('UPDATE_BOOKING');
    
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }
  
  if (!bookingData || typeof bookingData !== 'object') {
    
    return {
      success: false,
      error: "Dati prenotazione non forniti o non validi.",
      data: null
    };
  }

  try {
    // Prepara i dati nel formato richiesto dal backend
    let backendRequest;
    
    if (bookingData.date && bookingData.startTime && bookingData.endTime) {
      // Formato frontend standard
      const startDateTime = `${bookingData.date}T${bookingData.startTime}:00`;
      const endDateTime = `${bookingData.date}T${bookingData.endTime}:00`;
      
      backendRequest = {
        aulaId: parseInt(bookingData.aulaId || bookingData.roomId),
        corsoId: bookingData.corsoId || null,
        inizio: startDateTime,
        fine: endDateTime,
        descrizione: bookingData.purpose || bookingData.descrizione || ""
      };
    } else {
      // Formato backend diretto
      backendRequest = {
        aulaId: parseInt(bookingData.aulaId || bookingData.roomId),
        corsoId: bookingData.corsoId || null,
        inizio: bookingData.inizio,
        fine: bookingData.fine,
        descrizione: bookingData.descrizione || ""
      };
    }
    
    // Validazione campi obbligatori
    if (!backendRequest.aulaId || !backendRequest.inizio || !backendRequest.fine) {
      return {
        success: false,
        error: "Campi obbligatori mancanti (aulaId, inizio, fine).",
        data: null
      };
    }
    
    

    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "PUT",
      headers: createBookingHeaders(requestId),
      body: JSON.stringify(backendRequest)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nell'aggiornamento della prenotazione"
    );
    
    // Normalizza i dati della prenotazione aggiornata
    if (result.success && result.data) {
      // Il backend può restituire { message: "...", prenotazione: {...} }
      if (result.data.prenotazione) {
        result.data = normalizeBookingData(result.data.prenotazione);
      } else {
        result.data = normalizeBookingData(result.data);
      }
      
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per eliminare una prenotazione
/**
 * Elimina una prenotazione esistente
 * @param {number} bookingId - ID della prenotazione da eliminare
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function deleteBooking(bookingId) {
  const requestId = generateRequestId('DELETE_BOOKING');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: createBookingHeaders(requestId)
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nell'eliminazione della prenotazione"
    );
    
    // Per le operazioni di cancellazione, aggiungiamo informazioni aggiuntive
    if (result.success) {
      
      
      if (!result.data) {
        result.data = {};
      }
      
      result.data = {
        ...result.data,
        deletedId: bookingId,
        message: result.data.message || "Prenotazione eliminata con successo",
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
  }
}

// Funzione per eliminare una prenotazione come admin (può eliminare qualsiasi prenotazione)
/**
 * Elimina una prenotazione come amministratore
 * @param {number} bookingId - ID della prenotazione da eliminare
 * @param {string} reason - Motivo dell'eliminazione (opzionale)
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function deleteBookingAsAdmin(bookingId, reason = null) {
  const requestId = generateRequestId('DELETE_BOOKING_ADMIN');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }

  try {
    
    
    const requestBody = reason ? { reason } : {};
    
    const response = await fetch(`/api/admin/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: createBookingHeaders(requestId),
      body: reason ? JSON.stringify(requestBody) : undefined
    });
    
    
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nell'eliminazione amministrativa della prenotazione"
    );
    
    // Per le operazioni di cancellazione admin, aggiungiamo informazioni aggiuntive
    if (result.success) {
      
      
      if (!result.data) {
        result.data = {};
      }
      
      result.data = {
        ...result.data,
        deletedId: bookingId,
        deletedBy: 'admin',
        reason: reason,
        message: result.data.message || "Prenotazione eliminata con successo dall'amministratore",
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
    
  } catch (err) {
    return handleBookingNetworkError(err, requestId);
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
  } catch {
    
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
  } catch {
    
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
      
      return {
        success: false,
        error: "Impossibile ottenere i dati delle stanze",
        data: null
      };
    }
    
    const roomsText = await roomsResponse.text();
    
    
    let rooms;
    try {
      rooms = JSON.parse(roomsText);
      
      
      
      // Gestisce diverse strutture di risposta (simile a getAllRoomsAdmin)
      let roomsArray = [];
      
      if (Array.isArray(rooms)) {
        roomsArray = rooms;
        
      } else if (rooms.data && rooms.data.rooms && Array.isArray(rooms.data.rooms)) {
        // Formato backend: {data: {rooms: [...], totalRooms: n}}
        roomsArray = rooms.data.rooms;
        
      } else if (rooms.rooms && Array.isArray(rooms.rooms)) {
        roomsArray = rooms.rooms;
        
      } else if (rooms.aule && Array.isArray(rooms.aule)) {
        roomsArray = rooms.aule;
        
      } else {
        
        roomsArray = [];
      }
      
      rooms = roomsArray; // Assegna l'array estratto
      
    } catch {
      
      return {
        success: false,
        error: "Errore nel parsing dei dati delle stanze",
        data: null
      };
    }
    
    // Verifica finale che rooms sia un array
    if (!Array.isArray(rooms)) {
      
      return {
        success: false,
        error: "I dati delle stanze non sono nel formato array atteso",
        data: null
      };
    }
    
    // Trova la stanza specifica
    const targetRoom = rooms.find(room => room.id === parseInt(roomId));
    if (!targetRoom) {
      
      return {
        success: false,
        error: "Stanza non trovata",
        data: null
      };
    }
    
    
    
    // Gestisci i diversi formati di blockData (retrocompatibilità)
    let requestData;
    if (typeof blockData === 'boolean') {
      // Vecchio formato: solo booleano
      requestData = { isBlocked: blockData };
    } else if (blockData && typeof blockData === 'object') {
      // Nuovo formato: oggetto con isBlocked e blockReason
      requestData = blockData;
    } else {
      
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
    
    
    
    // Esegui l'update tramite PUT /api/admin/rooms/{id}
    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    
    if (response.ok) {
      // Gestione robusta della risposta
      let responseText = "";
      try {
        responseText = await response.text();
      } catch {
        return null;
      }
      
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          
        } catch  {
          
          data = { 
            message: "Operazione completata con successo",
            roomId: roomId,
            isBlocked: requestData.isBlocked
          };
        }
      } else {
        
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
        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            // Se non è JSON, usa il testo raw
            errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
          }
        }
      } catch {
        
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }

  } catch (error) {
    
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
            
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
          
        } catch {
          
          // Se non è JSON valido, assumiamo array vuoto
          data = [];
        }
      } else {
        // Risposta vuota
        
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
        
        bookingsArray = [];
      }
      
      // Ottieni informazioni sulle stanze per i nomi
      const roomsResponse = await getAllRooms();
      const rooms = roomsResponse.success ? roomsResponse.data : [];
      const roomsMap = {};
      
      // Crea una mappa ID -> nome stanza - proteggi contro rooms non array
      if (Array.isArray(rooms)) {
        rooms.forEach(room => {
          const roomId = room.id || room.aulaId;
          const roomName = room.name || room.nome || room.nomeAula || `Stanza ${roomId}`;
          roomsMap[roomId] = roomName;
        });
      } 
      
      // Normalizza i dati come in getMyBookings
      const normalizedBookings = bookingsArray.map(booking => {
        
        
        // Prova diverse proprietà per l'ID della stanza (stesso logic di getMyBookings)
        let aulaId;
        
        if (booking.aulaId) {
          aulaId = booking.aulaId;
        } else if (booking.roomId) {
          aulaId = booking.roomId;
        } else if (booking.aula && booking.aula.id) {
          // Il backend restituisce un oggetto aula con id
          aulaId = booking.aula.id;
          
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
                
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
    
  } catch {
    
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

    

    return {
      success: true,
      error: null,
      data: filteredBookings
    };

  } catch {
    
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