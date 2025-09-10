//Funzione per login
export async function handleLogin(email, password) {
    // Validazione input
    if (!email || !password) {
      return {
        success: false,
        error: "Email e password sono obbligatorie",
        data: null
      };
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log("Risposta login:", data);
      
      if (!response.ok) {
        // Gestione errori specifici basati sui codici di stato
        let errorMessage;
        switch (response.status) {
          case 400:
            errorMessage = data.error || "Dati di login non validi. Controlla email e password.";
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
            errorMessage = data.error || `Errore di login (codice ${response.status}). Riprova.`;
        }
        
        return {
          success: false,
          error: errorMessage,
          data: null
        };
      } else {
        // Verifica che il server abbia restituito il token
        if (!data.token) {
          return {
            success: false,
            error: "Login riuscito ma token mancante. Contatta l'amministratore.",
            data: null
          };
        }

        // Salva il token se presente
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; path=/;`;
        
        return {
          success: true,
          error: null,
          data: data
        };
      }
    } catch (networkError) {
      console.error("Errore di rete durante il login:", networkError);
      return {
        success: false,
        error: "Impossibile connettersi al server. Verifica la connessione internet e riprova.",
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
              // Prova a leggere l'errore specifico dal server
              try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || `Errore nel caricamento del profilo (codice ${response.status})`;
              } catch {
                errorMessage = `Errore nel caricamento del profilo (codice ${response.status})`;
              }
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
        // Verifica che i dati dell'utente siano presenti
        const userData = data.user || data;
        if (!userData || !userData.id) {
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
