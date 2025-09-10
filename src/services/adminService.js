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

      const response = await fetch("/api/admin/users", {
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

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(userData)
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
        error: errorData.message || "Errore nella creazione dell'utente",
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

// Funzione per aggiornare un utente
export async function updateUser(userId, userData) {
  try {
    if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(userData)
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
        error: errorData.message || "Errore nell'aggiornamento dell'utente",
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

// Funzione per eliminare un utente
export async function deleteUser(userId) {
  try {
    if (!localStorage.getItem("token")) {
        return {
            success: false,
            error: "Token mancante. Effettua il login.",
            data: null
        };
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
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
        data: { message: "Utente eliminato con successo" }
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
    console.error("Errore di rete:", err);
    return {
      success: false,
      error: "Errore di connessione al server",
      data: null
    };
  }
}
