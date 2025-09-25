// ===== UTILITY FUNCTIONS =====

/**
 * Genera un ID di richiesta univoco per il tracking
 * @param {string} operation - Nome dell'operazione (es: 'GET_ROOMS', 'GET_ROOM_DETAILS')
 * @returns {string} - ID univoco
 */
function generateRequestId(operation = 'ROOM') {
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
 * Crea headers standardizzati per le richieste rooms
 * @param {string} requestId - ID della richiesta
 * @returns {object} - Headers object
 */
function createRoomHeaders(requestId) {
  const token = getValidToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Request-ID": requestId
  };
}

/**
 * Gestisce la risposta standardizzata del backend per rooms
 * @param {Response} response - Risposta fetch
 * @param {string} requestId - ID della richiesta
 * @param {string} errorMessage - Messaggio di errore default
 * @returns {Promise<{success: boolean, error: string|null, data: any|null}>}
 */
async function handleRoomResponse(response, requestId, errorMessage) {
  try {
    const data = await response.json();
    console.log(`🔍 [${requestId}] Risposta ricevuta:`, {
      status: response.status,
      success: data.success,
      sessionId: data.sessionId,
      hasData: !!data.data
    });
    
    if (response.ok) {
      // Gestione successo con struttura standardizzata
      const resultData = data.success && data.data ? data.data : data;
      
      console.log(`✅ [${requestId}] Operazione rooms completata con successo`);
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
      
      console.error(`❌ [${requestId}] Errore rooms - Status: ${response.status}, Messaggio:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
        data: null
      };
    }
  } catch (parseError) {
    console.error(`❌ [${requestId}] Errore parsing risposta rooms:`, parseError);
    return {
      success: false,
      error: "Errore nella comunicazione con il server",
      data: null
    };
  }
}

/**
 * Gestisce errori di rete per rooms
 * @param {Error} error - Errore di rete
 * @param {string} requestId - ID della richiesta
 * @returns {{success: boolean, error: string, data: null}}
 */
function handleRoomNetworkError(error, requestId) {
  console.error(`🌐 [${requestId}] Errore di rete rooms:`, error);
  
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

// ===== ROOM SERVICE FUNCTIONS =====

/**
 * Recupera tutte le stanze (versione semplice)
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getRoomList() {
  const requestId = generateRequestId('GET_ROOMS');
  console.log(`🏠 [${requestId}] Avvio recupero lista stanze...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getRoomList`);
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
      headers: createRoomHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}`);
    
    const result = await handleRoomResponse(
      response, 
      requestId, 
      "Errore nel caricamento delle stanze"
    );
    
    // Post-elaborazione per normalizzare i dati delle stanze
    if (result.success && result.data) {
      console.log(`🔍 [${requestId}] Struttura result.data:`, result.data);
      console.log(`🔍 [${requestId}] Tipo di result.data:`, typeof result.data, Array.isArray(result.data));
      
      let roomsArray = [];
      
      if (Array.isArray(result.data)) {
        roomsArray = result.data;
      } else if (Array.isArray(result.data.rooms)) {
        // Fallback per strutture legacy
        console.warn(`⚠️ [${requestId}] Usando struttura rooms legacy`);
        roomsArray = result.data.rooms;
      } else {
        console.warn(`⚠️ [${requestId}] Struttura rooms non riconosciuta, usando array vuoto`);
        console.log(`🔍 [${requestId}] Keys in result.data:`, Object.keys(result.data));
        roomsArray = [];
      }
      
      // Normalizzazione dati
      const normalizedRooms = roomsArray.map(room => normalizeRoomData(room));
      console.log(`📊 [${requestId}] Normalizzate ${normalizedRooms.length} stanze`);
      
      result.data = normalizedRooms;
    }
    
    return result;
    
  } catch (err) {
    return handleRoomNetworkError(err, requestId);
  }
}

/**
 * Recupera tutte le stanze con dettagli completi (incluse prenotazioni)
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getDetailedRooms() {
  const requestId = generateRequestId('GET_DETAILED_ROOMS');
  console.log(`🏠📋 [${requestId}] Avvio recupero stanze dettagliate...`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getDetailedRooms`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }

  try {
    console.log(`� [${requestId}] Tentativo connessione a /api/rooms/detailed`);
    
    const response = await fetch("/api/rooms/detailed", {
      method: "GET",
      headers: createRoomHeaders(requestId)
    });
    
    console.log(`📡 [${requestId}] Risposta ricevuta - Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      // Verifica che la risposta sia JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`⚠️ [${requestId}] Endpoint detailed non implementato (content-type: ${contentType})`);
        throw new Error("Endpoint /api/rooms/detailed non implementato");
      }
      
      const result = await handleRoomResponse(
        response,
        requestId,
        "Errore nel caricamento delle stanze dettagliate"
      );
      
      // Normalizzazione dati dettagliati
      if (result.success && result.data) {
        let roomsArray = Array.isArray(result.data) ? result.data : (result.data.rooms || []);
        
        const normalizedRooms = roomsArray.map((room, index) => {
          console.log(`🔧 [${requestId}] Normalizzando stanza ${index + 1}/${roomsArray.length}:`, {
            id: room.id,
            name: room.name || room.nome,
            bookingsCount: room.bookings ? room.bookings.length : 0
          });
          return normalizeRoomData(room);
        });
        
        console.log(`✅ [${requestId}] Normalizzate ${normalizedRooms.length} stanze dettagliate`);
        result.data = normalizedRooms;
      }
      
      return result;
      
    } else if (response.status === 404) {
      // Fallback all'endpoint base se detailed non esiste
      console.log(`🔄 [${requestId}] Endpoint detailed non disponibile, fallback a /api/rooms`);
      
      const fallbackResult = await getRoomList();
      if (fallbackResult.success) {
        console.log(`✅ [${requestId}] Fallback riuscito con ${fallbackResult.data.length} stanze`);
        return {
          success: true,
          error: "Endpoint dettagliato non disponibile, utilizzando dati base",
          data: fallbackResult.data.map(room => normalizeRoomData(room))
        };
      } else {
        throw new Error("Anche l'endpoint di fallback /api/rooms ha fallito: " + fallbackResult.error);
      }
    } else {
      // Altri errori HTTP
      return await handleRoomResponse(
        response,
        requestId,
        "Errore nel caricamento delle stanze dettagliate"
      );
    }
    
  } catch (err) {
    console.error(`❌ [${requestId}] Errore in getDetailedRooms:`, err);
    
    // Tentativo di fallback in caso di errore di rete
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.log(`🔄 [${requestId}] Errore di rete, tentativo fallback`);
      try {
        const fallbackResult = await getRoomList();
        if (fallbackResult.success) {
          console.log(`✅ [${requestId}] Fallback di rete riuscito`);
          return {
            success: true,
            error: "Server non raggiungibile per dati dettagliati, utilizzando dati base",
            data: fallbackResult.data.map(room => normalizeRoomData(room))
          };
        }
      } catch (fallbackError) {
        console.error(`❌ [${requestId}] Fallback di rete fallito:`, fallbackError);
      }
    }
    
    return handleRoomNetworkError(err, requestId);
  }
}

/**
 * Recupera i dettagli di una stanza specifica
 * @param {number|string} roomId - ID della stanza
 * @returns {Promise<{success: boolean, error: string|null, data: object|null, hasBookings?: boolean}>}
 */
export async function getRoomDetails(roomId) {
  const requestId = generateRequestId('GET_ROOM_DETAILS');
  console.log(`🏠🔍 [${requestId}] Recupero dettagli stanza ID: ${roomId}`);
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    console.warn(`⚠️ [${requestId}] Token mancante per getRoomDetails`);
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione roomId
  if (!roomId) {
    console.warn(`⚠️ [${requestId}] ID stanza non fornito`);
    return {
      success: false,
      error: "ID stanza non fornito.",
      data: null
    };
  }

  try {
    // Prima prova con l'endpoint details
    console.log(`📡 [${requestId}] Tentativo endpoint dettagliato: /api/rooms/${roomId}/details`);
    
    const detailsResponse = await fetch(`/api/rooms/${roomId}/details`, {
      method: "GET",
      headers: createRoomHeaders(requestId)
    });

    if (detailsResponse.ok) {
      console.log(`✅ [${requestId}] Endpoint dettagliato disponibile`);
      
      const result = await handleRoomResponse(
        detailsResponse,
        requestId,
        "Errore nel caricamento dei dettagli stanza"
      );
      
      if (result.success) {
        // Normalizza e analizza i dati dettagliati
        const normalizedData = normalizeRoomData(result.data);
        const hasBookingInfo = !!(normalizedData.bookings?.length || 
                                 normalizedData.currentBooking || 
                                 normalizedData.nextBooking);
        
        console.log(`📊 [${requestId}] Dettagli stanza processati - Prenotazioni: ${hasBookingInfo}`);
        
        return {
          success: true,
          error: null,
          data: normalizedData,
          hasBookings: hasBookingInfo
        };
      }
      
      return result;
    }

    // Fallback all'endpoint base se details fallisce
    console.log(`🔄 [${requestId}] Endpoint details fallito (${detailsResponse.status}), provo endpoint base`);
    
    const baseResponse = await fetch(`/api/rooms/${roomId}`, {
      method: "GET",
      headers: createRoomHeaders(requestId)
    });

    if (baseResponse.ok) {
      console.log(`✅ [${requestId}] Endpoint base disponibile`);
      
      const result = await handleRoomResponse(
        baseResponse,
        requestId,
        "Errore nel caricamento della stanza"
      );
      
      if (result.success) {
        // Normalizza dati base e aggiungi campi mancanti
        const normalizedData = {
          ...normalizeRoomData(result.data),
          bookings: [], // Array vuoto per stanze senza prenotazioni
          currentBooking: null,
          nextBooking: null,
          isAvailable: true
        };
        
        console.log(`📊 [${requestId}] Dati base stanza processati (senza prenotazioni)`);
        
        return {
          success: true,
          error: null,
          data: normalizedData,
          hasBookings: false
        };
      }
      
      return result;
    }

    // Se entrambi gli endpoint falliscono
    console.error(`❌ [${requestId}] Entrambi gli endpoint falliti per stanza ${roomId}`);
    
    return await handleRoomResponse(
      baseResponse,
      requestId,
      "Stanza non trovata o non accessibile"
    );
      
  } catch (err) {
    return handleRoomNetworkError(err, requestId);
  }
}

// ===== DATA NORMALIZATION FUNCTIONS =====

/**
 * Normalizza i dati della stanza per garantire consistenza
 * @param {object} roomData - Dati grezzi della stanza dal backend
 * @returns {object|null} - Oggetto stanza normalizzato
 */
export function normalizeRoomData(roomData) {
  if (!roomData) {
    console.warn('⚠️ normalizeRoomData: roomData è null o undefined');
    return null;
  }

  try {
    // Estrazione e normalizzazione campi base
    const normalized = {
      // ID - obbligatorio
      id: roomData.id || roomData.roomId,
      
      // Nome - con fallback intelligente
      name: roomData.name || roomData.roomName || roomData.nome || roomData.nomeAula || `Stanza ${roomData.id || roomData.roomId || 'Senza Nome'}`,
      nome: roomData.nome || roomData.nomeAula || roomData.name || roomData.roomName || `Stanza ${roomData.id || roomData.roomId || 'Senza Nome'}`,
      
      // Piano - con controlli
      floor: roomData.floor !== undefined ? roomData.floor : 
             (roomData.piano !== undefined ? roomData.piano : 0),
      piano: roomData.piano !== undefined ? roomData.piano : 
             (roomData.floor !== undefined ? roomData.floor : 0),
      
      // Capacità - con fallback multipli
      capacity: roomData.capacity !== undefined ? roomData.capacity :
                (roomData.capienza !== undefined ? roomData.capienza :
                (roomData.posti !== undefined ? roomData.posti : 0)),
      capienza: roomData.capienza !== undefined ? roomData.capienza :
                (roomData.capacity !== undefined ? roomData.capacity :
                (roomData.posti !== undefined ? roomData.posti : 0)),
      
      // Stato/Status
      status: roomData.status || roomData.stato || "libera",
      stato: roomData.stato || roomData.status || "libera",
      
      // Descrizione
      description: roomData.description || roomData.descrizione || "",
      descrizione: roomData.descrizione || roomData.description || "",
      
      // Attrezzature
      equipment: Array.isArray(roomData.equipment) ? roomData.equipment : 
                 (Array.isArray(roomData.attrezzature) ? roomData.attrezzature : []),
      attrezzature: Array.isArray(roomData.attrezzature) ? roomData.attrezzature :
                    (Array.isArray(roomData.equipment) ? roomData.equipment : []),
      
      // Dati prenotazioni - con validazione
      bookings: Array.isArray(roomData.bookings) ? roomData.bookings :
                (Array.isArray(roomData.prenotazioni) ? roomData.prenotazioni : []),
      prenotazioni: Array.isArray(roomData.prenotazioni) ? roomData.prenotazioni :
                    (Array.isArray(roomData.bookings) ? roomData.bookings : []),
      
      // Prenotazione corrente
      currentBooking: roomData.currentBooking || roomData.prenotazioneCorrente || null,
      prenotazioneCorrente: roomData.prenotazioneCorrente || roomData.currentBooking || null,
      
      // Prossima prenotazione
      nextBooking: roomData.nextBooking || roomData.prossimaPrenotazione || null,
      prossimaPrenotazione: roomData.prossimaPrenotazione || roomData.nextBooking || null,
      
      // Disponibilità
      isAvailable: roomData.isAvailable !== undefined ? roomData.isAvailable : true,
      
      // Timestamp di ultimo aggiornamento
      lastUpdated: roomData.lastUpdated || new Date().toISOString(),
      
      // Mantieni tutti gli altri dati originali che potrebbero essere utili
      ...roomData
    };
    
    // Validazione finale
    if (!normalized.id) {
      console.warn('⚠️ normalizeRoomData: Stanza senza ID valido:', roomData);
      return null;
    }
    
    return normalized;
    
  } catch (error) {
    console.error('❌ Errore durante normalizzazione dati stanza:', error, roomData);
    return null;
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Determina se una stanza è attualmente occupata
 * @param {object} room - Oggetto stanza normalizzato
 * @returns {boolean} - True se la stanza è occupata
 */
export function isRoomCurrentlyOccupied(room) {
  if (!room) {
    console.warn('⚠️ isRoomCurrentlyOccupied: room è null o undefined');
    return false;
  }

  try {
    const now = new Date();
    
    // Controlla prenotazione corrente esplicita
    if (room.currentBooking) {
      try {
        const endTime = new Date(`${room.currentBooking.date}T${room.currentBooking.endTime}`);
        const isOccupied = endTime > now;
        console.log(`🔍 Stanza ${room.id} - Prenotazione corrente: ${isOccupied}`, {
          currentBooking: room.currentBooking,
          endTime: endTime.toISOString(),
          now: now.toISOString()
        });
        return isOccupied;
      } catch (dateError) {
        console.warn(`⚠️ Errore parsing data prenotazione corrente per stanza ${room.id}:`, dateError);
      }
    }

    // Controlla nell'array delle prenotazioni
    if (room.bookings && Array.isArray(room.bookings) && room.bookings.length > 0) {
      const currentBooking = room.bookings.find(booking => {
        try {
          const start = new Date(`${booking.date}T${booking.startTime}`);
          const end = new Date(`${booking.date}T${booking.endTime}`);
          return start <= now && now <= end;
        } catch (dateError) {
          console.warn(`⚠️ Errore parsing date prenotazione per stanza ${room.id}:`, dateError, booking);
          return false;
        }
      });
      
      const isOccupied = !!currentBooking;
      if (isOccupied) {
        console.log(`🔍 Stanza ${room.id} - Occupata da prenotazione:`, currentBooking);
      }
      return isOccupied;
    }

    // Default: stanza libera
    return false;
    
  } catch (error) {
    console.error(`❌ Errore controllo occupazione stanza ${room?.id}:`, error);
    return false;
  }
}

/**
 * Ottiene la prossima prenotazione per una stanza
 * @param {object} room - Oggetto stanza normalizzato
 * @returns {object|null} - Prossima prenotazione o null
 */
export function getNextBooking(room) {
  if (!room) {
    console.warn('⚠️ getNextBooking: room è null o undefined');
    return null;
  }
  
  // Controlla se c'è una prossima prenotazione esplicita
  if (room.nextBooking) {
    console.log(`🔍 Stanza ${room.id} - Prossima prenotazione esplicita:`, room.nextBooking);
    return room.nextBooking;
  }

  // Cerca nell'array delle prenotazioni
  if (!room.bookings || !Array.isArray(room.bookings) || room.bookings.length === 0) {
    return null;
  }

  try {
    const now = new Date();
    
    // Filtra e ordina le prenotazioni future
    const futureBookings = room.bookings
      .filter(booking => {
        try {
          const startTime = new Date(`${booking.date}T${booking.startTime}`);
          return startTime > now;
        } catch (dateError) {
          console.warn(`⚠️ Errore parsing data per stanza ${room.id}:`, dateError, booking);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          const dateA = new Date(`${a.date}T${a.startTime}`);
          const dateB = new Date(`${b.date}T${b.startTime}`);
          return dateA - dateB;
        } catch (dateError) {
          console.warn(`⚠️ Errore ordinamento prenotazioni per stanza ${room.id}:`, dateError);
          return 0;
        }
      });

    const nextBooking = futureBookings[0] || null;
    
    if (nextBooking) {
      console.log(`🔍 Stanza ${room.id} - Prossima prenotazione trovata:`, nextBooking);
    }
    
    return nextBooking;
    
  } catch (error) {
    console.error(`❌ Errore ricerca prossima prenotazione per stanza ${room?.id}:`, error);
    return null;
  }
}

/**
 * Calcola lo stato attuale di una stanza
 * @param {object} room - Oggetto stanza normalizzato  
 * @returns {object} - Stato della stanza con dettagli
 */
export function getRoomStatus(room) {
  if (!room) {
    return {
      isOccupied: false,
      isAvailable: false,
      currentBooking: null,
      nextBooking: null,
      status: 'unknown'
    };
  }
  
  const isOccupied = isRoomCurrentlyOccupied(room);
  const nextBooking = getNextBooking(room);
  const currentBooking = room.currentBooking;
  
  return {
    isOccupied,
    isAvailable: !isOccupied && room.isAvailable !== false,
    currentBooking,
    nextBooking,
    status: isOccupied ? 'occupata' : 'libera'
  };
}

// ===== ADDITIONAL ROOM FUNCTIONS =====

/**
 * Filtra le stanze per piano
 * @param {array} rooms - Array di stanze
 * @param {number} floor - Numero del piano
 * @returns {array} - Stanze filtrate per piano
 */
export function filterRoomsByFloor(rooms, floor) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ filterRoomsByFloor: rooms non è un array');
    return [];
  }
  
  return rooms.filter(room => {
    const roomFloor = room.floor !== undefined ? room.floor : room.piano;
    return roomFloor === floor;
  });
}

/**
 * Filtra le stanze per capacità minima
 * @param {array} rooms - Array di stanze
 * @param {number} minCapacity - Capacità minima richiesta
 * @returns {array} - Stanze filtrate per capacità
 */
export function filterRoomsByCapacity(rooms, minCapacity) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ filterRoomsByCapacity: rooms non è un array');
    return [];
  }
  
  return rooms.filter(room => {
    const roomCapacity = room.capacity !== undefined ? room.capacity : room.capienza;
    return roomCapacity >= minCapacity;
  });
}

/**
 * Filtra le stanze disponibili (non occupate)
 * @param {array} rooms - Array di stanze
 * @returns {array} - Stanze disponibili
 */
export function filterAvailableRooms(rooms) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ filterAvailableRooms: rooms non è un array');
    return [];
  }
  
  return rooms.filter(room => {
    return !isRoomCurrentlyOccupied(room) && room.isAvailable !== false;
  });
}

/**
 * Cerca stanze per nome o descrizione
 * @param {array} rooms - Array di stanze
 * @param {string} searchTerm - Termine di ricerca
 * @returns {array} - Stanze che corrispondono alla ricerca
 */
export function searchRooms(rooms, searchTerm) {
  if (!Array.isArray(rooms) || !searchTerm) {
    return rooms || [];
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return rooms.filter(room => {
    const name = (room.name || room.nome || '').toLowerCase();
    const description = (room.description || room.descrizione || '').toLowerCase();
    const id = String(room.id || '');
    
    return name.includes(term) || 
           description.includes(term) || 
           id.includes(term);
  });
}

/**
 * Ordina le stanze per diversi criteri
 * @param {array} rooms - Array di stanze
 * @param {string} sortBy - Criterio di ordinamento ('name', 'floor', 'capacity', 'availability')
 * @param {string} direction - Direzione ('asc' o 'desc')
 * @returns {array} - Stanze ordinate
 */
export function sortRooms(rooms, sortBy = 'name', direction = 'asc') {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ sortRooms: rooms non è un array');
    return [];
  }
  
  const sorted = [...rooms].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'name':
        valueA = (a.name || a.nome || '').toLowerCase();
        valueB = (b.name || b.nome || '').toLowerCase();
        break;
      case 'floor':
        valueA = a.floor !== undefined ? a.floor : a.piano;
        valueB = b.floor !== undefined ? b.floor : b.piano;
        break;
      case 'capacity':
        valueA = a.capacity !== undefined ? a.capacity : a.capienza;
        valueB = b.capacity !== undefined ? b.capacity : b.capienza;
        break;
      case 'availability':
        valueA = isRoomCurrentlyOccupied(a) ? 1 : 0; // Occupate in fondo
        valueB = isRoomCurrentlyOccupied(b) ? 1 : 0;
        break;
      default:
        valueA = a.id;
        valueB = b.id;
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Ottiene statistiche sulle stanze
 * @param {array} rooms - Array di stanze
 * @returns {object} - Oggetto con statistiche
 */
export function getRoomStatistics(rooms) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ getRoomStatistics: rooms non è un array');
    return null;
  }
  
  const total = rooms.length;
  const occupied = rooms.filter(room => isRoomCurrentlyOccupied(room)).length;
  const available = total - occupied;
  
  const floors = [...new Set(rooms.map(room => 
    room.floor !== undefined ? room.floor : room.piano
  ))].sort();
  
  const totalCapacity = rooms.reduce((sum, room) => {
    const capacity = room.capacity !== undefined ? room.capacity : room.capienza;
    return sum + (capacity || 0);
  }, 0);
  
  const averageCapacity = total > 0 ? Math.round(totalCapacity / total) : 0;
  
  return {
    total,
    occupied,
    available,
    occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
    floors: floors.length,
    floorList: floors,
    totalCapacity,
    averageCapacity,
    timestamp: new Date().toISOString()
  };
}

// ===== FUNZIONI SPECIFICHE PER TIPO DI STANZA =====

/**
 * Filtra le stanze per tipo (fisiche o virtuali)
 * @param {array} rooms - Array di stanze
 * @param {string} type - "physical" o "virtual"
 * @returns {array} - Array filtrato
 */
export function filterRoomsByType(rooms, type) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ filterRoomsByType: rooms non è un array');
    return [];
  }

  return rooms.filter(room => {
    const isVirtual = room.isVirtual || room.virtuale || false;
    
    if (type === 'virtual') {
      return isVirtual;
    } else if (type === 'physical') {
      return !isVirtual;
    }
    
    return true; // Se type non è riconosciuto, restituisce tutte
  });
}

/**
 * Separa le stanze in fisiche e virtuali
 * @param {array} rooms - Array di stanze
 * @returns {object} - {physical: [], virtual: []}
 */
export function separateRoomsByType(rooms) {
  if (!Array.isArray(rooms)) {
    console.warn('⚠️ separateRoomsByType: rooms non è un array');
    return { physical: [], virtual: [] };
  }

  const physical = [];
  const virtual = [];

  rooms.forEach(room => {
    const isVirtual = room.isVirtual || room.virtuale || false;
    
    if (isVirtual) {
      virtual.push(room);
    } else {
      physical.push(room);
    }
  });

  return { physical, virtual };
}

/**
 * Ottiene statistiche specifiche per stanze fisiche
 * @param {array} physicalRooms - Array di stanze fisiche
 * @returns {object} - Statistiche delle stanze fisiche
 */
export function getPhysicalRoomStatistics(physicalRooms) {
  if (!Array.isArray(physicalRooms)) {
    console.warn('⚠️ getPhysicalRoomStatistics: physicalRooms non è un array');
    return {
      total: 0,
      byFloor: {},
      totalCapacity: 0,
      averageCapacity: 0,
      floors: 0
    };
  }

  const byFloor = {};
  let totalCapacity = 0;

  physicalRooms.forEach(room => {
    const floor = room.piano || room.floor || 'Sconosciuto';
    const capacity = room.capienza || room.capacity || 0;

    if (!byFloor[floor]) {
      byFloor[floor] = {
        count: 0,
        totalCapacity: 0,
        rooms: []
      };
    }

    byFloor[floor].count++;
    byFloor[floor].totalCapacity += capacity;
    byFloor[floor].rooms.push(room);
    totalCapacity += capacity;
  });

  return {
    total: physicalRooms.length,
    byFloor,
    totalCapacity,
    averageCapacity: physicalRooms.length > 0 ? Math.round(totalCapacity / physicalRooms.length) : 0,
    floors: Object.keys(byFloor).length
  };
}