# Prenotazioni Aule - Frontend

Sistema di prenotazione aule universitarie sviluppato in React con Vite.

## Caratteristiche

- ✅ **Integrazione Database**: Sistema completamente integrato con il database backend
- ✅ **API /api/rooms/detailed**: Recupero completo delle stanze con prenotazioni
- ✅ **Gestione Errori**: Messaggi chiari quando il database non è raggiungibile
- ✅ **Gestione Utenti**: Sistema di autenticazione e autorizzazione
- ✅ **Dashboard Admin**: Pannello amministrativo per gestione stanze e utenti
- ✅ **Sistema di Filtri**: Ricerca avanzata per capacità, piano, disponibilità
- ✅ **Responsive Design**: Interfaccia ottimizzata per desktop e mobile

## Struttura del Progetto

```
src/
├── components/          # Componenti React
│   ├── Admin/          # Componenti amministrativi
│   ├── Auth/           # Autenticazione
│   ├── Common/         # Componenti comuni
│   ├── Layout/         # Layout e navigazione
│   └── Room/           # Gestione stanze
├── hooks/              # Hook personalizzati
├── services/           # Servizi API
├── utils/              # Utilità
└── pages/              # Pagine principali
```

## Installazione e Avvio

```bash
# Installa le dipendenze
npm install

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## API Integration

Il sistema è completamente integrato con il backend su `http://localhost:8080`:

- `GET /api/rooms/detailed` - **Endpoint principale**: Recupera tutte le stanze con dettagli completi e prenotazioni
- `GET /api/rooms` - **Endpoint di fallback**: Recupera dati base delle stanze se il principale non è disponibile
- `GET /api/rooms/:id/details` - Dettagli di una singola stanza

**⚠️ Requisiti Database:**
- Il backend deve essere avviato e raggiungibile su localhost:8080
- Il database deve contenere almeno una stanza per visualizzare i dati
- L'endpoint `/api/rooms/detailed` deve essere implementato e funzionante

**🚨 Gestione Errori:**
- Se il backend non è raggiungibile, viene mostrato un messaggio di errore chiaro
- Se il database è vuoto, viene suggerito di aggiungere stanze tramite il pannello admin
- Nessun dato mock viene utilizzato - il sistema funziona esclusivamente con dati reali

## Tecnologie

- React 18
- Vite
- Tailwind CSS
- React Router DOM

## Stato del Progetto

Il progetto è stato ottimizzato per utilizzare **esclusivamente dati dal database**:

✅ **Rimosso:**
- Tutti i dati mock e di fallback
- Modalità demo
- File duplicati e obsoleti
- Componenti di test
- File di documentazione ridondanti

✅ **Implementato:**
- Sistema di connessione diretta al database
- Gestione errori migliorata per problemi di connessione
- Messaggi informativi chiari quando il database è vuoto
- Sistema robusto che funziona solo con dati reali

Il sistema ora richiede obbligatoriamente una connessione funzionante al backend con endpoint `/api/rooms/detailed` implementato.
