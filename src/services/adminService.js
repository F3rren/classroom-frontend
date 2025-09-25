// ===== UTILITY FUNCTIONS =====

/**
 * Genera un ID di richiesta univoco per il tracking
 * @param {string} operation - Nome dell'operazione (es: 'GET_USERS', 'CREATE_USER')
 * @returns {string} - ID univoco
 */
function generateRequestId(operation = 'ADMIN') {
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
 * Crea headers standardizzati per le richieste admin
 * @param {string} requestId - ID della richiesta
 * @returns {object} - Headers object
 */
function createAdminHeaders(requestId) {
  const token = getValidToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "X-Request-ID": requestId
  };
}

/**
 * Gestisce la risposta standardizzata del backend
 * @param {Response} response - Risposta fetch
 * @param {string} requestId - ID della richiesta
 * @param {string} successMessage - Messaggio di successo default
 * @param {string} errorMessage - Messaggio di errore default
 * @returns {Promise<{success: boolean, error: string|null, data: any|null}>}
 */
async function handleStandardResponse(response, requestId, successMessage, errorMessage) {
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
  } catch {
    
    return {
      success: false,
      error: "Errore nella comunicazione con il server",
      data: null
    };
  }
}

/**
 * Gestisce errori di rete
 * @param {Error} error - Errore di rete
 * @param {string} requestId - ID della richiesta
 * @returns {{success: boolean, error: string, data: null}}
 */
function handleNetworkError(error) {
  
  
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

// ===== ADMIN SERVICE FUNCTIONS =====

/**
 * Recupera tutti gli utenti (solo per amministratori)
 * @returns {Promise<{success: boolean, error: string|null, data: array|null}>}
 */
export async function getUsersList() {
  const requestId = generateRequestId('GET_USERS');
  
  
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
    
    
    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: createAdminHeaders(requestId)
    });
    
    
    
    const result = await handleStandardResponse(
      response, 
      requestId, 
      "Lista utenti recuperata con successo",
      "Errore nel caricamento degli utenti"
    );
    
    // Post-elaborazione per normalizzare i dati degli utenti
    if (result.success && result.data) {
      let usersArray = [];
      
      if (Array.isArray(result.data)) {
        // Struttura diretta array
        usersArray = result.data;
      } else if (Array.isArray(result.data.users)) {
        // Struttura backend standard: {users: [], totalUsers: n}
        
        usersArray = result.data.users;
      } else {
        
        usersArray = [];
      }
      
      
      result.data = usersArray;
    }
    
    return result;
    
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}

/**
 * Crea un nuovo utente (solo per amministratori)
 * @param {object} userData - Dati dell'utente da creare
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function createUser(userData) {
  const requestId = generateRequestId('CREATE_USER');

  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione dati utente
  if (!userData || typeof userData !== 'object') {
    
    return {
      success: false,
      error: "Dati utente non forniti o non validi.",
      data: null
    };
  }
  
  // Validazioni specifiche
  const requiredFields = ['email', 'username', 'password'];
  const missingFields = requiredFields.filter(field => !userData[field] || userData[field].trim().length === 0);
  
  if (missingFields.length > 0) {
    
    return {
      success: false,
      error: `Campi obbligatori mancanti: ${missingFields.join(', ')}`,
      data: null
    };
  }
  
  // Validazione email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    
    return {
      success: false,
      error: "Il formato dell'email non è valido.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch("/api/admin/register", {
      method: "POST",
      headers: createAdminHeaders(requestId),
      body: JSON.stringify(userData)
    });
    
    
    
    return await handleStandardResponse(
      response,
      requestId,
      "Utente creato con successo",
      "Errore nella creazione dell'utente"
    );
    
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}

/**
 * Aggiorna un utente esistente (solo per amministratori)
 * @param {number|string} userId - ID dell'utente da aggiornare
 * @param {object} userData - Nuovi dati dell'utente
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function updateUser(userId, userData) {
  const requestId = generateRequestId('UPDATE_USER');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione userId
  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    
    return {
      success: false,
      error: "ID utente non fornito o non valido.",
      data: null
    };
  }
  
  // Validazione userData
  if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
    
    return {
      success: false,
      error: "Dati di aggiornamento non forniti o non validi.",
      data: null
    };
  }
  
  // Validazione email se presente
  if (userData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      
      return {
        success: false,
        error: "Il formato dell'email non è valido.",
        data: null
      };
    }
  }

  try {
    
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: createAdminHeaders(requestId),
      body: JSON.stringify(userData)
    });
    
    
    
    return await handleStandardResponse(
      response,
      requestId,
      "Utente aggiornato con successo",
      "Errore nell'aggiornamento dell'utente"
    );
    
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}

/**
 * Elimina un utente (solo per amministratori)
 * @param {number|string} userId - ID dell'utente da eliminare
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function deleteUser(userId) {
  const requestId = generateRequestId('DELETE_USER');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione userId
  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    
    return {
      success: false,
      error: "ID utente non fornito o non valido.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch(`/api/admin/delete/${userId}`, {
      method: "DELETE",
      headers: createAdminHeaders(requestId)
    });
    
    
    
    const result = await handleStandardResponse(
      response,
      requestId,
      "Utente eliminato con successo",
      "Errore nell'eliminazione dell'utente"
    );
    
    // Per le eliminazioni, se non ci sono dati specifici dal backend,
    // ritorniamo un messaggio di conferma
    if (result.success && !result.data) {
      result.data = { 
        message: "Utente eliminato con successo",
        userId: userId,
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
    
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}

// ===== FUNZIONI AGGIUNTIVE PER AMMINISTRAZIONE =====

/**
 * Recupera un singolo utente per ID (solo per amministratori)
 */
export async function getUserById(userId) {
  const requestId = generateRequestId('GET_USER');
  
  
  const token = getValidToken();
  if (!token) {
    return { success: false, error: "Token mancante. Effettua il login.", data: null };
  }
  
  if (!userId) {
    return { success: false, error: "ID utente non fornito.", data: null };
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "GET", 
      headers: createAdminHeaders(requestId)
    });
    
    return await handleStandardResponse(response, requestId, "Utente recuperato", "Errore nel recupero");
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}

/**
 * Cambia il ruolo di un utente (solo per amministratori)
 */
export async function changeUserRole(userId, newRole) {
  const validRoles = ['USER', 'ADMIN', 'user', 'admin'];
  if (!validRoles.includes(newRole)) {
    return { success: false, error: `Ruolo non valido. Consentiti: ${validRoles.join(', ')}`, data: null };
  }
  return await updateUser(userId, { ruolo: newRole.toUpperCase() });
}

/**
 * Attiva o disattiva un utente (solo per amministratori)
 */
export async function toggleUserStatus(userId, isActive) {
  return await updateUser(userId, { attivo: isActive });
}

// ===== FUNZIONI PER GESTIONE STANZE =====

/**
 * Elimina una stanza (solo per amministratori)
 * @param {number} roomId - ID della stanza da eliminare
 * @returns {Promise<{success: boolean, error: string|null, data: object|null}>}
 */
export async function deleteRoom(roomId) {
  const requestId = generateRequestId('DELETE_ROOM');
  
  
  // Validazione token
  const token = getValidToken();
  if (!token) {
    
    return {
      success: false,
      error: "Token mancante. Effettua il login.",
      data: null
    };
  }
  
  // Validazione roomId
  if (!roomId || (typeof roomId !== 'number' && typeof roomId !== 'string')) {
    
    return {
      success: false,
      error: "ID stanza non fornito o non valido.",
      data: null
    };
  }

  try {
    
    
    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: "DELETE",
      headers: createAdminHeaders(requestId)
    });
    
    
    
    const result = await handleStandardResponse(
      response,
      requestId,
      "Stanza eliminata con successo",
      "Errore nell'eliminazione della stanza"
    );
    
    // Per le eliminazioni, se non ci sono dati specifici dal backend,
    // ritorniamo un messaggio di conferma
    if (result.success && !result.data) {
      result.data = { 
        message: "Stanza eliminata con successo",
        roomId: roomId,
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
    
  } catch (err) {
    return handleNetworkError(err, requestId);
  }
}
