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
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`/api/prenotazioni/${bookingId}`, {
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
