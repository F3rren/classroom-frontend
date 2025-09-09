  // Funzione per recuperare tutti gli utenti
export async function getUsersList() {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      const response = await fetch("http://localhost:8080/api/admin/users", {
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
          data: data.users || data
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Errore nel caricamento degli utenti",
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
  };

// Funzione per creare un nuovo utente
export async function createUser(userData) {
  try {
    if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }
    const response = await fetch("http://localhost:8080/api/admin/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Errore nella creazione dell'utente",
        data: null
      };
    } else {
      return {
        success: true,
        error: null,
        data: data.user || data
      };
    }
  } catch {
    return {
      success: false,
      error: "Errore di rete",
      data: null
    };
  }
}

// Funzione per aggiornare un utente esistente
export async function updateUser(id, userData) {
  try {
    if (!localStorage.getItem("token")) {
      return {
        success: false,
        error: "Token mancante. Effettua il login.",
        data: null
      };
    }

    const response = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Errore nell'aggiornamento dell'utente",
        data: null
      };
    } else {
      return {
        success: true,
        error: null,
        data: data.user || data
      };
    }
  } catch {
    return {
      success: false,
      error: "Errore di rete",
      data: null
    };
  }
}

export async function deleteUser(id) {
    try {
        if (!localStorage.getItem("token")) {
          return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
          };
        }

        const response = await fetch(`http://localhost:8080/api/admin/delete/${id}`, {
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });

        if (response.ok) {
          console.log(`Utente con ID ${id} eliminato con successo`);
          return {
            success: true,
            error: null,
            data: null
          };
        } else {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.message || "Errore nell'eliminazione dell'utente",
            data: null
          };
        }
      } catch (err) {
        console.error("Errore nell'eliminazione:", err);
        return {
            success: false,
            error: "Errore di connessione durante l'eliminazione",
            data: null
          };
      }
    }

// Funzione per recuperare tutte le stanze con possibili prenotazioni
export async function getRoomsWithBookings() {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      // Prima prova con l'endpoint che include le prenotazioni
      let response = await fetch("http://localhost:8080/api/rooms", {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      // Se l'endpoint with-bookings non esiste, usa quello base
      if (!response.ok && response.status === 404) {
        console.warn("Endpoint /with-bookings non disponibile, uso endpoint base");
        response = await fetch("http://localhost:8080/api/rooms", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });
      }

      if (response.ok) {
        const data = await response.json();
        console.log("Dati stanze ricevuti:", data);
        
        // Normalizza i dati per garantire struttura consistente
        const normalizedRooms = (data.rooms || data).map(room => ({
          id: room.id || room.roomId,
          name: room.name || room.roomName || room.nome || `Stanza ${room.id}`,
          floor: room.floor !== undefined ? room.floor : (room.piano !== undefined ? room.piano : 0),
          capacity: room.capacity !== undefined ? room.capacity : (room.capienza !== undefined ? room.capienza : (room.posti !== undefined ? room.posti : 0)),
          status: room.status || room.stato || "libera",
          description: room.description || room.descrizione || "",
          equipment: room.equipment || room.attrezzature || [],
          
          // Dati prenotazioni (potrebbero essere presenti o meno)
          bookings: room.bookings || room.prenotazioni || [],
          currentBooking: room.currentBooking || room.prenotazioneCorrente || null,
          nextBooking: room.nextBooking || room.prossimaPrenotazione || null,
          isAvailable: room.isAvailable !== undefined ? room.isAvailable : true,
          hasBookings: Boolean(room.bookings || room.prenotazioni),
          
          // Mantieni i dati originali
          ...room
        }));

        return {
          success: true,
          error: null,
          data: normalizedRooms,
          hasBookingSupport: Boolean(data.rooms?.[0]?.bookings || data[0]?.bookings)
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

// Funzione per ottenere dettagli di una singola stanza
export async function getRoomDetails(roomId) {
    try {      
      if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
      }

      // Prima prova con l'endpoint details
      let response = await fetch(`http://localhost:8080/api/rooms/${roomId}/details`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      let roomData = null;
      let hasDetailedBookings = false;

      if (response.ok) {
        roomData = await response.json();
        
        // Verifica se i dati contengono informazioni dettagliate di prenotazione
        hasDetailedBookings = Boolean(
          roomData.bookings || 
          roomData.prenotazioni || 
          roomData.currentBooking || 
          roomData.nextBooking
        );
        
        console.log(`Dettagli stanza ${roomId}:`, roomData, `Con prenotazioni: ${hasDetailedBookings}`);
      } else {
        // Se l'endpoint details non funziona, prova con quello base
        console.warn(`Endpoint details fallito per stanza ${roomId}, provo con endpoint base`);
        
        response = await fetch(`http://localhost:8080/api/rooms/${roomId}`, {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        });

        if (response.ok) {
          roomData = await response.json();
          hasDetailedBookings = false;
          console.log(`Dati base stanza ${roomId}:`, roomData);
        }
      }

      if (roomData) {
        // Normalizza i dati indipendentemente da quale endpoint li ha forniti
        const normalizedRoom = {
          id: roomData.id || roomData.roomId,
          name: roomData.name || roomData.roomName || roomData.nome || `Stanza ${roomData.id}`,
          floor: roomData.floor !== undefined ? roomData.floor : (roomData.piano !== undefined ? roomData.piano : 0),
          capacity: roomData.capacity !== undefined ? roomData.capacity : (roomData.capienza !== undefined ? roomData.capienza : (roomData.posti !== undefined ? roomData.posti : 0)),
          status: roomData.status || roomData.stato || "libera",
          description: roomData.description || roomData.descrizione || "",
          equipment: roomData.equipment || roomData.attrezzature || [],
          
          // Dati prenotazioni
          bookings: roomData.bookings || roomData.prenotazioni || [],
          currentBooking: roomData.currentBooking || roomData.prenotazioneCorrente || null,
          nextBooking: roomData.nextBooking || roomData.prossimaPrenotazione || null,
          isAvailable: hasDetailedBookings ? roomData.isAvailable !== undefined ? roomData.isAvailable : true : true,
          
          // Metadati
          hasDetailedBookings,
          dataSource: hasDetailedBookings ? 'details' : 'basic',
          
          // Mantieni i dati originali
          ...roomData
        };

        return {
          success: true,
          error: null,
          data: normalizedRoom,
          hasBookings: hasDetailedBookings
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || "Errore nel caricamento dei dettagli stanza",
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