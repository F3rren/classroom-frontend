// ===== UTILITY FUNCTIONS =====

/**
 * Valida il formato email
 * @param {string} email - Email da validare
 * @returns {boolean} - True se email è valida
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Genera un ID di richiesta univoco per il tracking
 * @returns {string} - ID univoco
 */
function generateRequestId() {
  return 'LOGIN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== AUTH FUNCTIONS =====

/**
 * Funzione per il login dell'utente
 * @param {string} email - Email dell'utente
 * @param {string} password - Password dell'utente
 * @returns {Promise<{success: boolean, error: string|null, data: any|null}>}
 */
export async function handleLogin(email, password) {
    const requestId = generateRequestId();
    console.log(`🔐 [${requestId}] Avvio processo di login per:`, email);
    
    // Validazione input avanzata
    if (!email || !password) {
      console.warn(`⚠️ [${requestId}] Login fallito: campi mancanti`);
      return {
        success: false,
        error: "Email e password sono obbligatorie",
        data: null
      };
    }
    
    // Trim e normalizzazione
    email = email.trim().toLowerCase();
    password = password.trim();
    
    // Validazione formato email
    if (!isValidEmail(email)) {
      console.warn(`⚠️ [${requestId}] Login fallito: formato email non valido`);
      return {
        success: false,
        error: "Il formato dell'email non è valido",
        data: null
      };
    }
    
    // Validazione lunghezza password
    if (password.length < 1) {
      console.warn(`⚠️ [${requestId}] Login fallito: password vuota`);
      return {
        success: false,
        error: "La password non può essere vuota",
        data: null
      };
    }

    try {
      console.log(`📡 [${requestId}] Invio richiesta di login al server...`);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": requestId // Header per il tracking
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log(`📡 [${requestId}] Risposta ricevuta - Status:`, response.status);
      
      const data = await response.json();
      console.log(`🔍 [${requestId}] Dati ricevuti:`, {
        success: data.success,
        hasToken: !!(data.data?.token),
        sessionId: data.sessionId,
        message: data.message,
        error: data.error
      });
      
      if (!response.ok) {
        console.error(`❌ [${requestId}] Login fallito - Status: ${response.status}`);
        
        // Gestione errori con struttura standardizzata del backend
        let errorMessage;
        
        // CORREZIONE: Usa sempre la struttura standardizzata del backend
        if (data.userMessage) {
          errorMessage = data.userMessage; // ✅ Messaggio user-friendly dal backend
          console.log(`📝 [${requestId}] Usando userMessage dal backend`);
        } else if (data.message) {
          errorMessage = data.message;     // Messaggio tecnico come fallback
          console.log(`📝 [${requestId}] Usando message dal backend`);
        } else {
          errorMessage = "Errore di login sconosciuto";
          console.warn(`⚠️ [${requestId}] Nessun messaggio dal backend, usando fallback`);
        }
        
        // Log sessionId se presente per debugging
        if (data.sessionId) {
          console.log(`🔍 [${requestId}] SessionId errore:`, data.sessionId);
        }
        
        // Fallback per errori senza struttura (solo se non abbiamo messaggi dal backend)
        if (!errorMessage) {
          console.warn(`⚠️ [${requestId}] Usando fallback per status ${response.status}`);
          switch (response.status) {
            case 400:
              errorMessage = "Dati di login non validi. Controlla email e password.";
              break;
            case 401:
              errorMessage = "Email o password non corretti. Riprova.";
              break;
            case 403:
              errorMessage = "Account bloccato o non autorizzato. Contatta l'amministratore.";
              break;
            case 404:
              errorMessage = "Servizio di autenticazione non disponibile.";
              break;
            case 429:
              errorMessage = "Troppi tentativi di login. Riprova tra qualche minuto.";
              break;
            case 500:
              errorMessage = "Errore interno del server. Riprova più tardi.";
              break;
            default:
              errorMessage = `Errore di login (codice ${response.status}). Riprova.`;
          }
        }
        
        console.error(`❌ [${requestId}] Login definitivamente fallito:`, errorMessage);
        return {
          success: false,
          error: errorMessage,
          data: null
        };
      } else {
        console.log(`✅ [${requestId}] Login riuscito, elaborazione risposta...`);
        
        // Gestione successo con la struttura standardizzata del backend
        let token = null;
        let userData = null;
        
        // CORREZIONE: Backend usa sempre struttura {success: true, data: {...}, message, sessionId, timestamp}
        if (data.success && data.data && data.data.token) {
          console.log(`✅ [${requestId}] Struttura risposta corretta dal backend`);
          token = data.data.token;
          userData = {
            user: data.data.user,
            loginTime: data.data.loginTime,
            tokenType: data.data.tokenType || 'Bearer',
            sessionId: data.sessionId,     // SessionId a livello principale
            timestamp: data.timestamp,     // Timestamp a livello principale  
            message: data.message          // Messaggio di successo dal server
          };
          
          // Salva il sessionId per eventuali operazioni future
          if (data.sessionId) {
            localStorage.setItem("sessionId", data.sessionId);
            console.log(`🔍 [${requestId}] SessionId salvato:`, data.sessionId);
          }
        } 
        // Fallback per strutture legacy (mantenere compatibilità)
        else if (data.token) {
          console.warn(`⚠️ [${requestId}] Usando struttura login legacy - considera di aggiornare il backend`);
          token = data.token;
          userData = {
            ...data,
            sessionId: null,
            tokenType: 'Bearer',
            message: 'Login effettuato (struttura legacy)'
          };
        }
        
        // Validazione token
        if (!token || token.trim().length === 0) {
          console.error(`❌ [${requestId}] Token mancante o vuoto nella risposta`);
          return {
            success: false,
            error: "Login riuscito ma token mancante. Contatta l'amministratore.",
            data: null
          };
        }

        // Salvataggio sicuro del token
        try {
          localStorage.setItem("token", token);
          document.cookie = `token=${token}; path=/; secure; samesite=strict`;
          console.log(`💾 [${requestId}] Token salvato correttamente`);
        } catch (storageError) {
          console.error(`❌ [${requestId}] Errore salvataggio token:`, storageError);
          return {
            success: false,
            error: "Impossibile salvare le credenziali. Verifica lo spazio disponibile.",
            data: null
          };
        }
        
        console.log(`🎉 [${requestId}] Login completato con successo`);
        return {
          success: true,
          error: null,
          data: userData
        };
      }
    } catch (networkError) {
      console.error(`🌐 [${requestId}] Errore di rete durante il login:`, networkError);
      
      // Analisi dettagliata dell'errore di rete
      let errorMessage = "Impossibile connettersi al server.";
      
      if (networkError.name === "TypeError" && networkError.message.includes("fetch")) {
        errorMessage = "Impossibile connettersi al server. Verifica la connessione internet.";
      } else if (networkError.name === "AbortError") {
        errorMessage = "Richiesta di login annullata. Riprova.";
      } else if (networkError.message.includes("timeout")) {
        errorMessage = "Timeout di connessione. Il server potrebbe essere sovraccarico.";
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }
}

//Funzione per recupero informazioni singolo utente
export async function getCurrentUser(){
      // Se non c'è token, restituisci null (utente non loggato)
      if (!localStorage.getItem("token")) {
        return null;
      }
      
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });

        if (!response.ok) {
          // Gestione errori specifici per getCurrentUser
          let errorMessage;
          let shouldRemoveToken = false;
          
          try {
            const errorData = await response.json();
            // CORREZIONE: Usa la struttura standardizzata del backend
            // Backend usa sempre: userMessage per utenti, message per dettagli tecnici
            errorMessage = errorData.userMessage || errorData.message || "Errore nel caricamento del profilo";
            
            // Log del sessionId se presente per debugging
            if (errorData.sessionId) {
              console.log("🔍 SessionId errore:", errorData.sessionId);
            }
          } catch (parseError) {
            // Fallback se non riusciamo a parsare la risposta di errore
            console.warn("⚠️ Impossibile parsare risposta di errore:", parseError);
          }
          
          
          // Fallback per codici di stato specifici solo se non abbiamo messaggi dal backend
          if (!errorMessage) {
            switch (response.status) {
              case 400:
                errorMessage = "Richiesta non valida. Token malformato.";
                shouldRemoveToken = true;
                break;
              case 401:
                errorMessage = "Sessione scaduta. Effettua nuovamente il login.";
                shouldRemoveToken = true;
                break;
              case 403:
                errorMessage = "Account sospeso o permessi insufficienti. Contatta l'amministratore.";
                break;
              case 404:
                errorMessage = "Profilo utente non trovato. Contatta l'amministratore.";
                shouldRemoveToken = true;
                break;
              case 500:
                errorMessage = "Errore interno del server durante il caricamento del profilo.";
                break;
              case 503:
                errorMessage = "Servizio temporaneamente non disponibile. Riprova tra poco.";
                break;
              default:
                errorMessage = `Errore nel caricamento del profilo (codice ${response.status})`;
            }
          }
          
          // Rimuovi token se necessario (solo per errori di autenticazione)
          if (response.status === 401 || response.status === 400 || response.status === 404) {
            shouldRemoveToken = true;
          }
          
          // Rimuovi token se necessario
          if (shouldRemoveToken) {
            localStorage.removeItem("token");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            console.warn("Token rimosso a causa di errore:", response.status);
          }
          
          return {
            success: false,
            error: errorMessage,
            data: null
          };
        }
        
        const data = await response.json();
        console.log("🔍 Risposta completa da /api/me:", data);
        
        // CORREZIONE: Backend usa sempre struttura standardizzata {success, data, message, etc}
        // I dati utente sono sempre in data.data secondo i controller backend
        const userData = data.success && data.data ? data.data : null;
        console.log("🔍 Dati utente estratti:", userData);
        
        // Validazione più flessibile - controlla multiple proprietà che indicano un utente valido
        const hasValidUserData = userData && (
          userData.id || 
          userData.username || 
          userData.email || 
          userData.nome
        );
        
        if (!hasValidUserData) {
          console.error("🔍 Validazione fallita. Struttura ricevuta:", {
            userData,
            hasId: !!userData?.id,
            hasUsername: !!userData?.username,
            hasEmail: !!userData?.email,
            hasNome: !!userData?.nome
          });
          
          return {
            success: false,
            error: "Dati utente incompleti ricevuti dal server. Riprova o contatta l'amministratore.",
            data: null
          };
        }
        
        console.log("✅ Validazione utente riuscita:", userData);
        
        return {
          success: true,
          error: null,
          data: userData
        };

      } catch (networkError) {
        console.error("Errore di rete in getCurrentUser:", networkError);
        
        // Analizza il tipo di errore di rete per dare un messaggio più specifico
        let errorMessage = "Errore di connessione sconosciuto";
        
        if (networkError.name === "TypeError" && networkError.message.includes("fetch")) {
          errorMessage = "Impossibile connettersi al server. Verifica la connessione internet.";
        } else if (networkError.name === "AbortError") {
          errorMessage = "Richiesta annullata. Riprova.";
        } else if (networkError.message.includes("timeout")) {
          errorMessage = "Timeout di connessione. Il server potrebbe essere sovraccarico.";
        } else {
          errorMessage = "Problema di rete durante il caricamento del profilo. Riprova.";
        }
        
        return {
          success: false,
          error: errorMessage,
          data: null
        };
      }
}

//Funzione per logout
export const handleLogout = (reason = null) => {
    try {
      // Rimuovi dati di autenticazione
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId"); // Rimuovi anche il sessionId
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Log del motivo del logout per debugging
      if (reason) {
        console.log("Logout eseguito per:", reason);
      }
      
      window.location.href = "/login";
      
    } catch (error) {
      console.error("Errore durante il logout:", error);
      // Anche se c'è un errore, forza comunque il redirect
      window.location.href = "/login";
    }
  };

// Funzione di utilità per verificare se l'utente corrente è admin
export const isCurrentUserAdmin = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log("🔐 Nessun utente trovato");
      return false;
    }
    
    console.log("🔐 Struttura completa utente:", user);
    
    // Estraiamo i dati utente dalla risposta
    const userData = user.data || user;
    console.log("🔐 Dati utente estratti:", userData);
    
    // Dai test sappiamo che il ruolo è in userData.ruolo come stringa "admin"
    const isAdmin = userData.ruolo === "admin" || 
                   userData.ruolo === "ADMIN" || 
                   userData.role === "admin" || 
                   userData.role === "ADMIN";
    
    console.log("🔐 Controllo ruolo:", userData.ruolo || userData.role);
    console.log("🔐 Utente è admin:", isAdmin);
    
    return isAdmin;
  } catch (error) {
    console.error("🔐 Errore verifica admin:", error);
    return false;
  }
};

// Funzione di utilità per ottenere il sessionId corrente
export const getCurrentSessionId = () => {
  return localStorage.getItem("sessionId");
};

// Funzione di utilità per ottenere informazioni complete sulla sessione
export const getSessionInfo = () => {
  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("sessionId");
  
  return {
    hasActiveSession: !!token,
    token: token,
    sessionId: sessionId
  };
};
