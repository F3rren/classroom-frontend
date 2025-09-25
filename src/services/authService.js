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
    
    
    // Validazione input avanzata
    if (!email || !password) {
      
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
      
      return {
        success: false,
        error: "Il formato dell'email non è valido",
        data: null
      };
    }
    
    // Validazione lunghezza password
    if (password.length < 1) {
      
      return {
        success: false,
        error: "La password non può essere vuota",
        data: null
      };
    }

    try {
      
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": requestId // Header per il tracking
        },
        body: JSON.stringify({ email, password }),
      });
      
      
      
      const data = await response.json();
            
      if (!response.ok) {
        
        
        // Gestione errori con struttura standardizzata del backend
        let errorMessage;
        
        // CORREZIONE: Usa sempre la struttura standardizzata del backend
        if (data.userMessage) {
          errorMessage = data.userMessage; // ✅ Messaggio user-friendly dal backend
          
        } else if (data.message) {
          errorMessage = data.message;     // Messaggio tecnico come fallback
          
        } else {
          errorMessage = "Errore di login sconosciuto";
          
        }

        // Fallback per errori senza struttura (solo se non abbiamo messaggi dal backend)
        if (!errorMessage) {
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
        
        
        return {
          success: false,
          error: errorMessage,
          data: null
        };
      } else {
        
        
        // Gestione successo con la struttura standardizzata del backend
        let token = null;
        let userData = null;
        
        // CORREZIONE: Backend usa sempre struttura {success: true, data: {...}, message, sessionId, timestamp}
        if (data.success && data.data && data.data.token) {
          
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
            
          }
        } 
        // Fallback per strutture legacy (mantenere compatibilità)
        else if (data.token) {
          
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
          
        } catch {
          return {
            success: false,
            error: "Impossibile salvare le credenziali. Verifica lo spazio disponibile.",
            data: null
          };
        }
        
        
        return {
          success: true,
          error: null,
          data: userData
        };
      }
    } catch (networkError) {
      
      
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
            
          } catch {
            // Fallback se non riusciamo a parsare la risposta di errore
            
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
            
          }
          
          return {
            success: false,
            error: errorMessage,
            data: null
          };
        }
        
        const data = await response.json();
        
        
        // CORREZIONE: Backend usa sempre struttura standardizzata {success, data, message, etc}
        // I dati utente sono sempre in data.data secondo i controller backend
        const userData = data.success && data.data ? data.data : null;
        
        
        // Validazione più flessibile - controlla multiple proprietà che indicano un utente valido
        const hasValidUserData = userData && (
          userData.id || 
          userData.username || 
          userData.email || 
          userData.nome
        );
        
        if (!hasValidUserData) {

          return {
            success: false,
            error: "Dati utente incompleti ricevuti dal server. Riprova o contatta l'amministratore.",
            data: null
          };
        }
        
        
        
        return {
          success: true,
          error: null,
          data: userData
        };

      } catch (networkError) {
        
        
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
export const handleLogout = () => {
    try {
      // Rimuovi dati di autenticazione
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId"); // Rimuovi anche il sessionId
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
 
      window.location.href = "/login";
      
    } catch {
      
      // Anche se c'è un errore, forza comunque il redirect
      window.location.href = "/login";
    }
  };

// Funzione di utilità per verificare se l'utente corrente è admin
export const isCurrentUserAdmin = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      
      return false;
    }
    
    
    
    // Estraiamo i dati utente dalla risposta
    const userData = user.data || user;
    
    
    // Dai test sappiamo che il ruolo è in userData.ruolo come stringa "admin"
    const isAdmin = userData.ruolo === "admin" || 
                   userData.ruolo === "ADMIN" || 
                   userData.role === "admin" || 
                   userData.role === "ADMIN";
    return isAdmin;
  } catch {
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
