// ====== SERVIZI STANZE ======

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
      return {
        success: true,
        error: null,
        data: data.rooms || data
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
      return {
        success: true,
        error: null,
        data: data.rooms || data
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
      return {
        success: true,
        error: null,
        data: data.bookings || data
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
      aulaId: parseInt(bookingData.roomId),  // Converte roomId in aulaId
      corsoId: bookingData.corsoId || 1,    // Usa corsoId se fornito, altrimenti default a 1
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

// Funzione per eliminare una prenotazione
export async function deleteBooking(bookingId) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (response.ok) {
      return {
        success: true,
        error: null,
        data: { message: "Prenotazione eliminata con successo" }
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Errore nell'eliminazione della prenotazione",
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

// Funzione per bloccare/sbloccare una stanza (solo admin)
export async function toggleRoomBlock(roomId, isBlocked) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/admin/rooms/${roomId}/block`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ isBlocked })
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
        error: errorData.message || "Errore nel blocco/sblocco della stanza",
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

    const response = await fetch("/api/admin/bookings", {
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
        data: data.bookings || data
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
