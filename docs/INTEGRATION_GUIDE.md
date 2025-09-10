# 🚀 Integrazione Sistema Prenotazioni - Guida d'Uso

## ✅ **Componenti Aggiornati**

### 1. **RoomManagement.jsx** (Admin Panel)
```jsx
// Ora carica automaticamente stanze con prenotazioni
// Mostra badge di stato sistema (📋 Prenotazioni attive / 📝 Solo dati base)
// Gestione errori con fallback ai dati mock
// Bottone refresh per ricaricare i dati
```

### 2. **RoomGrid.jsx** (Dashboard Utenti)  
```jsx
// Caricamento intelligente:
// - Admin: getRoomsWithBookings() + fallback getRoomList()  
// - Utenti: getRoomList() diretto
// Indicatori di stato e caricamento
// Supporto per filtri con prenotazioni
```

### 3. **RoomCard.jsx** (Carte Stanze)
```jsx
// Nuovo prop: showBookingInfo={hasBookingSupport}
// Stati visivi basati su prenotazioni:
// 🟢 Verde: Disponibile
// 🔴 Rosso: Occupata (fino alle XX:XX)  
// 🟡 Giallo: Presto occupata (alle XX:XX)
// Badge numerico con totale prenotazioni
```

## 🔧 **Come Usare**

### Sostituzione Componenti Esistenti

```jsx
// PRIMA (RoomGrid vecchio)
import { RoomGrid } from './components/Room';
<RoomGrid user={user} />

// ADESSO (RoomGrid aggiornato)
// Il componente è lo stesso, ma ora gestisce automaticamente le prenotazioni!
<RoomGrid user={user} />
```

### Utilizzare SmartRoomDetail per Pagine Dettagli

```jsx
// Per creare una pagina di dettaglio stanza intelligente
import SmartRoomDetail from './components/Room/SmartRoomDetail';

function RoomDetailRoute({ user, roomId }) {
  return (
    <SmartRoomDetail 
      roomId={roomId}
      isAdmin={user?.role === 'admin'}
      onClose={() => navigate('/rooms')}
    />
  );
}
```

### Hook per Componenti Personalizzati

```jsx
import { useRoomDetails } from './hooks/useRoomDetails';

function CustomRoomComponent({ roomId }) {
  const { 
    room, 
    loading, 
    hasBookings, 
    getRoomStatus,
    refreshRoom 
  } = useRoomDetails(roomId);

  const status = getRoomStatus();
  // status.status: 'available' | 'occupied' | 'soon' | 'maintenance'
  // status.currentBooking: prenotazione attuale
  // status.nextBooking: prossima prenotazione
}
```

## 📊 **Indicatori UI**

### Badge di Sistema
- **📋 Prenotazioni attive** = Endpoint `/with-bookings` funzionante
- **📝 Solo dati base** = Fallback a endpoint standard `/rooms`  
- **⚠️ Dati limitati** = Errore, usando dati mock

### Stati Stanza (se prenotazioni disponibili)
- **🟢 Disponibile**: Nessuna prenotazione corrente
- **🔴 Occupata**: C'è una prenotazione attiva ora  
- **🟡 Presto Occupata**: Libera ora, ma prenotata entro 2 ore

### Messaggi di Errore
- Avvisi gialli per problemi di connessione
- Bottoni "Riprova" per reload manual
- Fallback automatico a dati mock se tutto fallisce

## 🛠️ **Endpoint Richiesti dal Backend**

### Priorità Alta (Per funzionamento base)
1. `GET /api/rooms` - Lista stanze base ✅ (già esistente)
2. `GET /api/rooms/{id}` - Dettagli stanza base ✅ (già esistente)

### Priorità Media (Per prenotazioni)
1. `GET /api/rooms/with-bookings` - Lista stanze con prenotazioni
2. `GET /api/rooms/{id}/details` - Dettagli stanza con prenotazioni

### Struttura Dati Attesa

```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Aula Magna", 
      "floor": 1,
      "capacity": 50,
      "status": "libera",
      "description": "Aula principale",
      "equipment": ["Proiettore", "Audio"],
      
      // Se endpoint con prenotazioni
      "bookings": [
        {
          "id": 1,
          "userId": 123,
          "userName": "Mario Rossi",
          "date": "2025-09-09", 
          "startTime": "09:00",
          "endTime": "11:00",
          "description": "Lezione matematica"
        }
      ],
      "currentBooking": null,
      "nextBooking": null
    }
  ],
  "hasBookingSupport": true // Indica se i dati includono prenotazioni
}
```

## 🔄 **Comportamento Automatico**

### Strategia di Caricamento
1. **Tentativo Primario**: Endpoint con prenotazioni
2. **Fallback 1**: Endpoint base se primo fallisce  
3. **Fallback 2**: Dati mock se tutto fallisce

### Gestione Errori
- Errori di rete → Retry con bottone
- Endpoint mancanti → Fallback automatico silenzioso
- Dati malformati → Normalizzazione automatica

### Performance
- Una sola chiamata API per la maggior parte dei casi
- Caricamento lazy dei dettagli stanze
- Stati di caricamento non bloccanti

## 📱 **Esperienza Utente**

### Stati di Caricamento
- Spinner durante caricamento iniziale
- Indicatori inline per refresh
- Loading states per singole operazioni

### Feedback Visivo
- Badge colorati per tipo di dati disponibili
- Messaggi informativi per problemi temporanei
- Bottoni di azione sempre disponibili (refresh, reset filtri)

### Accessibilità
- Colori semantici coerenti
- Testi alternativi per stati
- Supporto tastiera per tutte le azioni

## 🚦 **Stati del Sistema**

| Scenario | Badge | Comportamento | UX |
|----------|-------|---------------|-----|
| ✅ API prenotazioni OK | 📋 Prenotazioni attive | Mostra stati real-time | Ottimale |
| ⚠️ API prenotazioni KO | 📝 Solo dati base | Mostra stanze senza prenotazioni | Buona |
| ❌ Tutte API KO | 🟪 Dati limitati | Usa mock data | Limitata ma funzionale |

Il sistema è progettato per essere **resiliente** e **adattivo**, garantendo sempre un'esperienza utente accettabile anche quando alcune funzionalità non sono disponibili.

## 🔄 **Prossimi Passi**

1. **Implementare endpoint backend** per prenotazioni
2. **Testare integrazione** con dati reali  
3. **Aggiungere notifiche real-time** per cambio stati
4. **Implementare sistema prenotazioni completo** con form e validazioni

La base è solida e pronta per essere estesa! 🎉
