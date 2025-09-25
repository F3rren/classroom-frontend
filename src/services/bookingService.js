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
    console.log(`🔍 [${requestId}] Risposta booking ricevuta:`, {
      status: response.status,
      success: data.success,
      sessionId: data.sessionId,
      hasData: !!data.data
    });
    
    if (response.ok) {
      // Gestione successo con struttura standardizzata
      const resultData = data.success && data.data ? data.data : data;
      
      console.log(`✅ [${requestId}] Operazione booking completata con successo`);
      return {
        success: true,
        error: null,
        data: resultData
      };
    } else {
      // Gestione errori con struttura standardizzata
      const errorMsg = data.userMessage || data.message || errorMessage;
      
      // Log sessionId se presente per debugging
      if (data.sessionId) {
        console.log(`🔍 [${requestId}] SessionId errore:`, data.sessionId);
      }
      
      console.error(`❌ [${requestId}] Errore booking - Status: ${response.status}, Messaggio:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        data: null
      };
    }
  } catch (parseError) {
    console.error(`❌ [${requestId}] Errore parsing risposta booking:`, parseError);
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
function handleBookingNetworkError(error, requestId) {
  console.error(`🌐 [${requestId}] Errore di rete booking:`, error);
  
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
    console.log('🔒 Cache: stanza bloccata aggiunta:', roomId, blockReason);
  } else {
    blockedRoomsCache.delete(parseInt(roomId));
    console.log('🔒 Cache: stanza sbloccata rimossa:', roomId);
  }
  
  // Salva in localStorage per persistenza
  try {
    localStorage.setItem('blockedRoomsCache', JSON.stringify(Array.from(blockedRoomsCache.entries())));
  } catch {
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
  } catch {
    console.warn('⚠️ Errore caricamento cache da localStorage');
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
  console.log(`🏠 [${requestId}] Avvio recupero tutte le stanze...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getAllRooms`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta a /api/rooms`);
    
    const response = await fetch("/api/rooms", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
        console.warn(`⚠️ [${requestId}] Usando struttura rooms legacy`);
        roomsArray = result.data.rooms;
      } else {
        console.warn(`⚠️ [${requestId}] Formato risposta inaspettato, usando array vuoto`);
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
      
      const blockedCount = enrichedRooms.filter(r => r.isBlocked).length;
      console.log(`🔒 [${requestId}] Stanze arricchite con cache: ${enrichedRooms.length} totali, ${blockedCount} bloccate`);
      
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
      console.log("🏠 Risposta getAllRoomsAdmin:", data);
      
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

// ===== FUNZIONI PER STANZE FISICHE =====

/**
 * Recupera le stanze fisiche
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getPhysicalRooms() {
  const requestId = generateRequestId('GET_PHYSICAL_ROOMS');
  console.log(`🏠 [${requestId}] Avvio recupero stanze fisiche...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getPhysicalRooms`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta a /api/rooms/physical`);
    
    const response = await fetch("/api/rooms/physical", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
        console.log(`📊 [${requestId}] Usando struttura backend standard`);
        roomsArray = result.data.rooms;
      } else {
        console.warn(`⚠️ [${requestId}] Struttura rooms non riconosciuta, usando array vuoto`);
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
      
      console.log(`📊 [${requestId}] Normalizzate ${normalizedRooms.length} stanze fisiche`);
      
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
  console.log(`🏠 [${requestId}] Avvio recupero stanze fisiche dettagliate...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getPhysicalRoomsDetailed`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta a /api/rooms/physical/detailed`);
    
    const response = await fetch("/api/rooms/physical/detailed", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
        console.log(`📊 [${requestId}] Usando struttura backend standard`);
        roomsArray = result.data.rooms;
      } else if (Array.isArray(result.data.data)) {
        console.warn(`⚠️ [${requestId}] Usando struttura data legacy`);
        roomsArray = result.data.data;
      } else {
        console.warn(`⚠️ [${requestId}] Formato stanze non riconosciuto, usando array vuoto`);
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
      
      console.log(`📊 [${requestId}] Trovate ${enrichedRooms.length} stanze fisiche`);
      
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
  console.log(`🏠 [${requestId}] Avvio recupero stanze virtuali dettagliate...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getVirtualRoomsDetailed`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta a /api/rooms/virtual/detailed`);
    
    const response = await fetch("/api/rooms/virtual/detailed", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
        console.warn(`⚠️ [${requestId}] Usando struttura rooms legacy`);
        roomsArray = result.data.rooms;
      } else if (Array.isArray(result.data.data)) {
        console.warn(`⚠️ [${requestId}] Usando struttura data legacy`);
        roomsArray = result.data.data;
      } else {
        console.warn(`⚠️ [${requestId}] Formato stanze non riconosciuto, usando array vuoto`);
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
      
      console.log(`📊 [${requestId}] Trovate ${enrichedRooms.length} stanze virtuali`);
      
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
    
  } catch (err) {
    console.error("Errore di rete:", err);
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
    console.warn('⚠️ normalizeBookingData: bookingData è null o undefined');
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
      console.warn('⚠️ normalizeBookingData: Prenotazione senza ID valido:', bookingData);
      return null;
    }
    
    return normalized;
    
  } catch (error) {
    console.error('❌ Errore durante normalizzazione dati prenotazione:', error, bookingData);
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
  console.log(`📅 [${requestId}] Avvio recupero mie prenotazioni...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getMyBookings`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta a /api/prenotazioni/mie`);
    
    const response = await fetch("/api/prenotazioni/mie", {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
        console.warn(`⚠️ [${requestId}] Usando struttura prenotazioni legacy`);
        bookingsArray = result.data.prenotazioni;
      } else if (Array.isArray(result.data.bookings)) {
        console.warn(`⚠️ [${requestId}] Usando struttura bookings legacy`);
        bookingsArray = result.data.bookings;
      } else {
        console.warn(`⚠️ [${requestId}] Formato prenotazioni non riconosciuto, usando array vuoto`);
        bookingsArray = [];
      }
      
      // Normalizzazione e ordinamento per data
      const normalizedBookings = bookingsArray
        .map(booking => normalizeBookingData(booking))
        .filter(booking => booking !== null)
        .sort((a, b) => new Date(`${b.inizio}`) - new Date(`${a.inizio}`)); // Più recenti prima
      
      console.log(`� [${requestId}] Trovate ${normalizedBookings.length} prenotazioni`);
      
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
  console.log(`➕ [${requestId}] Avvio creazione prenotazione:`, {
    aulaId: bookingData?.aulaId,
    date: bookingData?.date,
    startTime: bookingData?.startTime,
    endTime: bookingData?.endTime,
    purpose: bookingData?.purpose?.substring(0, 50) + '...'
  });
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per createBooking`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione dati prenotazione
  if (!bookingData || typeof bookingData !== 'object') {
    console.warn(`⚠️ [${requestId}] Dati prenotazione non validi`);
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
    console.warn(`⚠️ [${requestId}] Campi obbligatori mancanti:`, missingFields);
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
      console.warn(`⚠️ [${requestId}] Data fine precedente a data inizio`);
      return {
        success: false,
        error: "L'orario di fine deve essere successivo all'orario di inizio.",
        data: null
      };
    }
    
    if (startDate < new Date()) {
      console.warn(`⚠️ [${requestId}] Tentativo prenotazione nel passato`);
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
    
    console.log(`📝 [${requestId}] Dati convertiti per backend:`, backendRequest);

    const response = await fetch("/api/prenotazioni/prenota", {
      method: "POST",
      headers: createBookingHeaders(requestId),
      body: JSON.stringify(backendRequest)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
      console.log(`✅ [${requestId}] Prenotazione creata con ID: ${result.data?.id}`);
    }
    
    return result;
    
  } catch (err) {
    // Gestisce errori di validazione date, conversione, e errori di rete
    if (err.message === "Date non valide" || err.message?.includes("validazione")) {
      console.warn(`⚠️ [${requestId}] Errore validazione:`, err);
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
  console.log(`🔍 [${requestId}] Verifica disponibilità stanza:`, {
    roomId,
    date,
    startTime,
    endTime
  });
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per checkAvailability`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!roomId || !date || !startTime || !endTime) {
    console.warn(`⚠️ [${requestId}] Parametri mancanti:`, { roomId, date, startTime, endTime });
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
      console.warn(`⚠️ [${requestId}] Date non valide:`, { startDateTime, endDateTime });
      return {
        success: false,
        error: "Formato date non valido.",
        data: null
      };
    }
    
    if (startDate >= endDate) {
      console.warn(`⚠️ [${requestId}] Orario fine precedente a orario inizio`);
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
    console.log(`📡 [${requestId}] Invio richiesta verifica disponibilità: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
      
      console.log(`✅ [${requestId}] Disponibilità verificata: ${normalizedData.available ? 'DISPONIBILE' : 'NON DISPONIBILE'}`);
      
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
  console.log(`✏️ [${requestId}] Avvio aggiornamento prenotazione ${bookingId}:`, {
    aulaId: bookingData?.aulaId || bookingData?.roomId,
    date: bookingData?.date,
    startTime: bookingData?.startTime,
    endTime: bookingData?.endTime
  });
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per updateBooking`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    console.warn(`⚠️ [${requestId}] ID prenotazione mancante`);
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }
  
  if (!bookingData || typeof bookingData !== 'object') {
    console.warn(`⚠️ [${requestId}] Dati prenotazione non validi`);
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
      console.warn(`⚠️ [${requestId}] Campi obbligatori mancanti:`, {
        aulaId: backendRequest.aulaId,
        inizio: backendRequest.inizio,
        fine: backendRequest.fine
      });
      return {
        success: false,
        error: "Campi obbligatori mancanti (aulaId, inizio, fine).",
        data: null
      };
    }
    
    console.log(`📝 [${requestId}] Dati convertiti per backend:`, backendRequest);

    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "PUT",
      headers: createBookingHeaders(requestId),
      body: JSON.stringify(backendRequest)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
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
      console.log(`✅ [${requestId}] Prenotazione aggiornata con ID: ${result.data?.id}`);
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
  console.log(`🗑️ [${requestId}] Avvio eliminazione prenotazione ${bookingId}`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per deleteBooking`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    console.warn(`⚠️ [${requestId}] ID prenotazione mancante`);
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta DELETE a /api/prenotazioni/${bookingId}`);
    
    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: createBookingHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nell'eliminazione della prenotazione"
    );
    
    // Per le operazioni di cancellazione, aggiungiamo informazioni aggiuntive
    if (result.success) {
      console.log(`✅ [${requestId}] Prenotazione ${bookingId} eliminata con successo`);
      
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
  console.log(`🗑️👨‍💼 [${requestId}] Avvio eliminazione admin prenotazione ${bookingId}:`, { reason });
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per deleteBookingAsAdmin`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione parametri
  if (!bookingId) {
    console.warn(`⚠️ [${requestId}] ID prenotazione mancante`);
    return {
      success: false,
      error: "ID prenotazione richiesto.",
      data: null
    };
  }

  try {
    console.log(`📡 [${requestId}] Invio richiesta DELETE admin a /api/admin/prenotazioni/${bookingId}`);
    
    const requestBody = reason ? { reason } : {};
    
    const response = await fetch(`/api/admin/prenotazioni/${bookingId}`, {
      method: "DELETE",
      headers: createBookingHeaders(requestId),
      body: reason ? JSON.stringify(requestBody) : undefined
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
    const result = await handleBookingResponse(
      response,
      requestId,
      "Errore nell'eliminazione amministrativa della prenotazione"
    );
    
    // Per le operazioni di cancellazione admin, aggiungiamo informazioni aggiuntive
    if (result.success) {
      console.log(`✅ [${requestId}] Prenotazione ${bookingId} eliminata con successo (admin)`);
      
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
      
      // Gestisce diverse strutture di risposta (simile a getAllRoomsAdmin)
      let roomsArray = [];
      
      if (Array.isArray(rooms)) {
        roomsArray = rooms;
        console.log("🔒 toggleRoomBlock - Rooms è un array diretto:", roomsArray.length, "elementi");
      } else if (rooms.data && rooms.data.rooms && Array.isArray(rooms.data.rooms)) {
        // Formato backend: {data: {rooms: [...], totalRooms: n}}
        roomsArray = rooms.data.rooms;
        console.log("🔒 toggleRoomBlock - Trovato data.data.rooms array:", roomsArray.length, "elementi");
      } else if (rooms.rooms && Array.isArray(rooms.rooms)) {
        roomsArray = rooms.rooms;
        console.log("🔒 toggleRoomBlock - Trovato data.rooms array:", roomsArray.length, "elementi");
      } else if (rooms.aule && Array.isArray(rooms.aule)) {
        roomsArray = rooms.aule;
        console.log("🔒 toggleRoomBlock - Trovato data.aule array:", roomsArray.length, "elementi");
      } else {
        console.warn("⚠️ toggleRoomBlock - Formato risposta inaspettato:", rooms);
        console.log("🔍 toggleRoomBlock - Chiavi in rooms:", Object.keys(rooms));
        if (rooms.data) {
          console.log("🔍 toggleRoomBlock - Chiavi in rooms.data:", Object.keys(rooms.data));
        }
        roomsArray = [];
      }
      
      rooms = roomsArray; // Assegna l'array estratto
      
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
      } catch {
        console.log('🔒 Risposta vuota ma successo HTTP');
      }
      
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('✅ Risposta JSON parsata:', data);
        } catch  {
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
          } catch {
            // Se non è JSON, usa il testo raw
            errorMessage = text.length > 100 ? text.substring(0, 100) + "..." : text;
          }
        }
      } catch (error){
        console.error('🔒 Errore nella lettura della risposta di errore:', error.message);
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
      
      // Crea una mappa ID -> nome stanza - proteggi contro rooms non array
      if (Array.isArray(rooms)) {
        rooms.forEach(room => {
          const roomId = room.id || room.aulaId;
          const roomName = room.name || room.nome || room.nomeAula || `Stanza ${roomId}`;
          roomsMap[roomId] = roomName;
        });
      } else {
        console.warn('⚠️ getAllBookings: rooms non è un array:', rooms);
      }
      
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