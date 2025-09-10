// ====== FUNZIONI ADMIN STANZE ======

// Funzione per bloccare/sbloccare una stanza (solo admin)
export async function toggleRoomBlock(roomId, blockData) {
  try {
    const token = localStorage.getItem('token');
    
    console.log('🔒 toggleRoomBlock - Metodo aggiornato:');
    console.log('  - Room ID:', roomId);
    console.log('  - Block Data:', blockData);
    
    if (!token) {
      return {
        success: false,
        error: 'Token mancante. Effettua il login.',
        data: null
      };
    }

    // Strategia: usa l'endpoint di update della stanza
    // Prima ottieni i dati correnti di tutte le stanze
    const roomsResponse = await fetch(`/api/admin/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!roomsResponse.ok) {
      console.error('🔒 Errore nel recupero stanze:', roomsResponse.status);
      return {
        success: false,
        error: 'Impossibile ottenere i dati delle stanze',
        data: null
      };
    }
    
    const roomsText = await roomsResponse.text();
    let rooms;
    try {
      rooms = JSON.parse(roomsText);
    } catch (e) {
      console.error('🔒 Errore parsing stanze:', e);
      return {
        success: false,
        error: 'Errore nel parsing dei dati delle stanze',
        data: null
      };
    }
    
    // Trova la stanza specifica
    const targetRoom = rooms.find(room => room.id === parseInt(roomId));
    if (!targetRoom) {
      console.error('🔒 Stanza non trovata nella lista');
      return {
        success: false,
        error: 'Stanza non trovata',
        data: null
      };
    }
    
    console.log('🔒 Stanza corrente:', targetRoom);
    
    // Prepara i dati per l'update
    const requestData = typeof blockData === 'boolean' 
      ? { isBlocked: blockData }
      : blockData;

    // Crea i dati completi per l'update
    const updateData = {
      nome: targetRoom.nome,
      capienza: targetRoom.capienza, 
      piano: targetRoom.piano,
      isBlocked: requestData.isBlocked,
      blockReason: requestData.blockReason || (requestData.isBlocked ? 'Stanza bloccata' : null)
    };
    
    console.log('🔒 Dati update completi:', updateData);
    
    // Esegui l'update tramite PUT /api/admin/rooms/{id}
    const response = await fetch(`/api/admin/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    console.log('🔒 Risposta update stanza:', {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      let responseText = '';
      try {
        responseText = await response.text();
      } catch (e) {
        console.log('🔒 Risposta vuota ma successo HTTP');
      }
      
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
          console.log('✅ Risposta JSON:', data);
        } catch {
          data = { 
            message: 'Operazione completata con successo',
            roomId: roomId,
            isBlocked: requestData.isBlocked
          };
        }
      } else {
        data = { 
          message: 'Operazione completata con successo',
          roomId: roomId,
          isBlocked: requestData.isBlocked
        };
      }
      
      return {
        success: true,
        error: null,
        data: data
      };
      
    } else {
      // Gestione errori
      let errorMessage = 'Errore nell\'aggiornamento della stanza';
      
      try {
        const text = await response.text();
        console.error('❌ Errore update stanza:', {
          status: response.status,
          statusText: response.statusText,
          content: text
        });
        
        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = text.length > 100 ? text.substring(0, 100) + '...' : text;
          }
        }
      } catch {
        errorMessage = `Errore HTTP ${response.status}: ${response.statusText}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: null
      };
    }

  } catch (error) {
    console.error('❌ Errore rete toggleRoomBlock:', error);
    return {
      success: false,
      error: `Errore di connessione: ${error.message}`,
      data: null
    };
  }
}
