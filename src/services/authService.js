//Funzione per login
export async function handleLogin(email, password) {

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log(data)
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Credenziali non valide",
          data: null
        };
      } else {
        // Salva il token se presente
        if (data.token) {
          localStorage.setItem("token", data.token);
          document.cookie = `token=${data.token}; path=/;`;
        }
        
        return {
          success: true,
          error: null,
          data: data
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

//Funzione per recupero informazioni singolo utente
export async function getCurrentUser(){
    const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch("http://localhost:8080/api/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.user || data; // adattare al backend

      } catch {
        return null;
      }
}

//Funzione per logout
export const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };