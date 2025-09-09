# Gestione Stanze con e senza Prenotazioni

## Problema Risolto

Quando l'endpoint `/{id}/details` mostra informazioni varie ma per stanze non prenotate si comporta come `/{id}`, il frontend ora gestisce intelligentemente questa situazione.

## Soluzioni Implementate

### 1. Servizi Migliorati (`roomService.js` & `adminService.js`)

#### Funzioni Aggiunte:
- `getRoomDetails(roomId)` - Prova prima `/details`, poi fallback a `/{id}`
- `normalizeRoomData()` - Normalizza dati da entrambi gli endpoint
- `isRoomCurrentlyOccupied()` - Controlla occupazione corrente
- `getNextBooking()` - Trova prossima prenotazione

```javascript
// Esempio di utilizzo
import { getRoomDetails, normalizeRoomData } from './services/roomService';

const result = await getRoomDetails(101);
if (result.success) {
  const room = normalizeRoomData(result.data);
  console.log(`Stanza ${room.name}:`, {
    hasBookings: result.hasBookings,
    dataSource: result.data?.dataSource // 'details' o 'basic'
  });
}
```

### 2. Hook Personalizzato (`useRoomDetails.js`)

#### Funzionalità:
- Caricamento automatico con fallback intelligente
- Gestione stati di caricamento e errore
- Calcolo automatico stato stanza (libera/occupata/presto occupata)
- Statistiche prenotazioni
- Refresh dati

```javascript
// Esempio di utilizzo
import { useRoomDetails } from './hooks/useRoomDetails';

function RoomComponent({ roomId }) {
  const { 
    room, 
    loading, 
    hasBookings, 
    dataSource,
    getRoomStatus 
  } = useRoomDetails(roomId);

  const status = getRoomStatus();
  // status.status: 'available', 'occupied', 'soon', 'maintenance'
  // status.text: testo user-friendly
  // status.currentBooking: prenotazione corrente se presente
}
```

### 3. Componente SmartRoomDetail

#### Caratteristiche:
- Visualizzazione adattiva basata sui dati disponibili
- Indicatori visivi per tipo di dati (completi vs. base)
- Stati colorati per disponibilità
- Lista prenotazioni se disponibili
- Gestione errori elegante

```javascript
// Esempio di utilizzo
import SmartRoomDetail from './components/Room/SmartRoomDetail';

function RoomDetailPage({ roomId }) {
  return (
    <SmartRoomDetail 
      roomId={roomId} 
      isAdmin={false}
      onClose={() => navigate('/rooms')}
    />
  );
}
```

## Logica di Gestione Endpoint

### Strategia di Fallback Automatico:

1. **Prima Chiamata**: `GET /api/rooms/{id}/details`
   - Se successo e contiene dati prenotazioni → `dataSource: 'details'`
   - Se successo senza prenotazioni → `dataSource: 'basic'` + `hasBookings: false`

2. **Fallback**: `GET /api/rooms/{id}` (se details fallisce)
   - Sempre `dataSource: 'basic'` + `hasBookings: false`
   - Aggiunge campi mancanti: `bookings: []`, `currentBooking: null`

3. **Normalizzazione**: Indipendentemente dalla fonte
   - Struttura dati consistente
   - Campi rinominati/mappati se necessario
   - Valori di default per campi mancanti

### Struttura Dati Normalizzata:

```javascript
{
  // Dati base (sempre presenti)
  id: 101,
  name: "Aula Magna",
  floor: 1,
  capacity: 50,
  status: "libera",
  description: "...",
  equipment: ["Proiettore", "Audio"],
  
  // Dati prenotazioni (se disponibili)
  bookings: [
    {
      id: 1,
      userId: 123,
      userName: "Mario Rossi",
      date: "2025-09-09",
      startTime: "09:00",
      endTime: "11:00",
      description: "Lezione matematica"
    }
  ],
  currentBooking: null, // o oggetto prenotazione corrente
  nextBooking: null,    // o prossima prenotazione
  isAvailable: true,
  
  // Metadati
  hasDetailedBookings: true, // true se dati da /details
  dataSource: "details"      // 'details', 'basic', 'error'
}
```

## Indicatori UI per l'Utente

### Badge Tipo Dati:
- 🟦 **"Dati completi con prenotazioni"** → endpoint `/details` con prenotazioni
- 🟨 **"Dati base (prenotazioni non disponibili)"** → endpoint base o `/details` senza prenotazioni  
- 🟪 **"Dati limitati"** → errore, dati parziali

### Stati Stanza:
- 🟢 **Verde**: Disponibile
- 🔴 **Rosso**: Attualmente occupata
- 🟡 **Giallo**: Libera ma presto occupata (prossime 2 ore)
- ⚪ **Grigio**: In manutenzione/sconosciuto

## Esempi di Integrazione

### In una Lista Stanze:
```javascript
import { useRoomsDetails } from './hooks/useRoomDetails';

function RoomsList({ roomIds }) {
  const { rooms, loading, hasAnyBookings } = useRoomsDetails(roomIds);
  
  return (
    <div>
      {hasAnyBookings && <p>✅ Alcune stanze hanno dati prenotazioni</p>}
      {Object.values(rooms).map(room => (
        <RoomCard key={room.id} room={room} showBookings={room.hasBookings} />
      ))}
    </div>
  );
}
```

### In Admin Panel:
```javascript
import { useRoomDetails } from './hooks/useRoomDetails';

function AdminRoomDetail({ roomId }) {
  const { room, hasBookings, dataSource } = useRoomDetails(roomId, true); // useAdminService=true
  
  return (
    <div>
      <h1>{room?.name}</h1>
      {hasBookings ? (
        <BookingsList bookings={room.bookings} />
      ) : (
        <p>⚠️ Prenotazioni non disponibili per questa stanza</p>
      )}
    </div>
  );
}
```

## Vantaggi della Soluzione

1. **Robustezza**: Funziona con endpoint diversi o mancanti
2. **UX Consistente**: Sempre feedback visivo chiaro all'utente
3. **Performance**: Una sola chiamata per la maggior parte dei casi
4. **Flessibilità**: Facilmente adattabile a nuovi endpoint
5. **Debugging**: Indicatori chiari del tipo di dati caricati
6. **Futuro-compatibile**: Supporto prenotazioni facilmente attivabile

La soluzione garantisce che l'applicazione funzioni correttamente sia con stanze che hanno prenotazioni che con quelle che non ne hanno, fornendo sempre un'esperienza utente coerente e informativa.
