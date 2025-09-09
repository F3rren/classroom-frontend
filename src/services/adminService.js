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