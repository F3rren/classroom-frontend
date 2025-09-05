// Mock data per le stanze - Struttura a 5 piani
export const initialRoomsData = [
  // PIANO TERRA (0) - Servizi e sale comuni
  { 
    id: 1, 
    name: "Atrio Principale", 
    floor: 0, 
    capacity: 50, 
    status: "libera", 
    booking: null, 
    blocked: null,
    bookings: []
  },
  { 
    id: 2, 
    name: "Sala Conferenze Magna", 
    floor: 0, 
    capacity: 200, 
    status: "prenotata", 
    booking: { user: "Rettore", date: "2025-09-04", time: "15:00-17:00", purpose: "Cerimonia Inaugurale" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "15:00", endTime: "17:00", user: "Rettore" },
      { date: "2025-09-05", startTime: "09:00", endTime: "12:00", user: "Conferenza Internazionale" }
    ]
  },
  { 
    id: 3, 
    name: "Auditorium", 
    floor: 0, 
    capacity: 300, 
    status: "libera", 
    booking: null, 
    blocked: null,
    bookings: [
      { date: "2025-09-06", startTime: "14:00", endTime: "18:00", user: "Concerto di Gala" }
    ]
  },
  { 
    id: 4, 
    name: "Sala Ricevimenti", 
    floor: 0, 
    capacity: 80, 
    status: "bloccata", 
    booking: null, 
    blocked: { reason: "Allestimento per evento speciale", blockedBy: "admin", blockedAt: "2025-09-03" },
    bookings: []
  },
  { 
    id: 5, 
    name: "Sala Stampa", 
    floor: 0, 
    capacity: 25, 
    status: "libera", 
    booking: null, 
    blocked: null,
    bookings: []
  },

  // PRIMO PIANO (1) - Aule standard e uffici amministrativi
  { 
    id: 6, 
    name: "Aula 101", 
    floor: 1, 
    capacity: 30, 
    status: "libera", 
    booking: null, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "09:00", endTime: "11:00", user: "Prof. Bianchi" },
      { date: "2025-09-05", startTime: "14:00", endTime: "16:00", user: "Team Marketing" }
    ]
  },
  { 
    id: 7, 
    name: "Aula 102", 
    floor: 1, 
    capacity: 35, 
    status: "prenotata", 
    booking: { user: "Mario Rossi", date: "2025-09-04", time: "14:00-16:00", purpose: "Riunione Team" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "14:00", endTime: "16:00", user: "Mario Rossi" }
    ]
  },
  { 
    id: 8, 
    name: "Aula 103", 
    floor: 1, 
    capacity: 40, 
    status: "in-uso", 
    booking: { user: "Anna Verde", date: "2025-09-04", time: "13:00-15:00", purpose: "Corso JavaScript" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "13:00", endTime: "15:00", user: "Anna Verde" },
      { date: "2025-09-04", startTime: "16:00", endTime: "18:00", user: "Workshop React" }
    ]
  },
  { 
    id: 9, 
    name: "Aula 104", 
    floor: 1, 
    capacity: 25, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 10, 
    name: "Aula 105", 
    floor: 1, 
    capacity: 45, 
    status: "prenotata", 
    booking: { user: "Luca Blu", date: "2025-09-05", time: "16:00-18:00", purpose: "Workshop Design" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-05", startTime: "16:00", endTime: "18:00", user: "Luca Blu" },
      { date: "2025-09-06", startTime: "10:00", endTime: "12:00", user: "Training UX" }
    ]
  },
  { 
    id: 11, 
    name: "Sala Riunioni 101", 
    floor: 1, 
    capacity: 12, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 12, 
    name: "Sala Riunioni 102", 
    floor: 1, 
    capacity: 8, 
    status: "prenotata", 
    booking: { user: "Direzione", date: "2025-09-04", time: "10:00-12:00", purpose: "Meeting Direzione" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "10:00", endTime: "12:00", user: "Direzione" }
    ]
  },

  // SECONDO PIANO (2) - Aule specializzate e laboratori
  { 
    id: 13, 
    name: "Aula 201", 
    floor: 2, 
    capacity: 50, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 14, 
    name: "Aula 202", 
    floor: 2, 
    capacity: 35, 
    status: "prenotata", 
    booking: { user: "Marco Nero", date: "2025-09-06", time: "15:00-17:00", purpose: "Lezione Python" }, 
    blocked: null, 
    bookings: [
      { date: "2025-09-06", startTime: "15:00", endTime: "17:00", user: "Marco Nero" }
    ] 
  },
  { 
    id: 15, 
    name: "Aula 203", 
    floor: 2, 
    capacity: 40, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 16, 
    name: "Laboratorio Informatica A", 
    floor: 2, 
    capacity: 30, 
    status: "in-uso", 
    booking: { user: "Elena Rosa", date: "2025-09-04", time: "15:00-17:00", purpose: "Workshop React" }, 
    blocked: null, 
    bookings: [
      { date: "2025-09-04", startTime: "15:00", endTime: "17:00", user: "Elena Rosa" }
    ] 
  },
  { 
    id: 17, 
    name: "Laboratorio Informatica B", 
    floor: 2, 
    capacity: 25, 
    status: "bloccata", 
    booking: null, 
    blocked: { reason: "Aggiornamento sistema operativo", blockedBy: "admin", blockedAt: "2025-09-04" }, 
    bookings: [] 
  },
  { 
    id: 18, 
    name: "Laboratorio Multimediale", 
    floor: 2, 
    capacity: 20, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 19, 
    name: "Sala Studio Gruppo", 
    floor: 2, 
    capacity: 15, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },

  // TERZO PIANO (3) - Aule magistrali e sale conferenze
  { 
    id: 20, 
    name: "Aula Magna 301", 
    floor: 3, 
    capacity: 120, 
    status: "prenotata", 
    booking: { user: "Prof. Giuliani", date: "2025-09-05", time: "09:00-12:00", purpose: "Lezione Magistrale" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-05", startTime: "09:00", endTime: "12:00", user: "Prof. Giuliani" },
      { date: "2025-09-05", startTime: "14:00", endTime: "17:00", user: "Seminario Internazionale" }
    ]
  },
  { 
    id: 21, 
    name: "Aula Magna 302", 
    floor: 3, 
    capacity: 100, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 22, 
    name: "Sala Conferenze A", 
    floor: 3, 
    capacity: 60, 
    status: "prenotata", 
    booking: { user: "Giulio Bianchi", date: "2025-09-05", time: "10:00-12:00", purpose: "Conferenza Stampa" }, 
    blocked: null, 
    bookings: [
      { date: "2025-09-05", startTime: "10:00", endTime: "12:00", user: "Giulio Bianchi" }
    ] 
  },
  { 
    id: 23, 
    name: "Sala Conferenze B", 
    floor: 3, 
    capacity: 45, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 24, 
    name: "Sala Videoconferenza", 
    floor: 3, 
    capacity: 25, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 25, 
    name: "Sala Consiglio", 
    floor: 3, 
    capacity: 20, 
    status: "bloccata", 
    booking: null, 
    blocked: { reason: "Installazione nuovi sistemi AV", blockedBy: "admin", blockedAt: "2025-09-02" }, 
    bookings: [] 
  },

  // QUARTO PIANO (4) - Dipartimenti e uffici docenti
  { 
    id: 26, 
    name: "Aula Seminari 401", 
    floor: 4, 
    capacity: 30, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 27, 
    name: "Aula Seminari 402", 
    floor: 4, 
    capacity: 25, 
    status: "prenotata", 
    booking: { user: "Dott.ssa Ferrari", date: "2025-09-04", time: "16:00-18:00", purpose: "Seminario Dottorato" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "16:00", endTime: "18:00", user: "Dott.ssa Ferrari" }
    ]
  },
  { 
    id: 28, 
    name: "Sala Dottorato", 
    floor: 4, 
    capacity: 15, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 29, 
    name: "Sala Ricerca A", 
    floor: 4, 
    capacity: 12, 
    status: "in-uso", 
    booking: { user: "Team Ricerca AI", date: "2025-09-04", time: "09:00-18:00", purpose: "Workshop Ricerca" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-04", startTime: "09:00", endTime: "18:00", user: "Team Ricerca AI" }
    ]
  },
  { 
    id: 30, 
    name: "Sala Ricerca B", 
    floor: 4, 
    capacity: 10, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  },
  { 
    id: 31, 
    name: "Sala Professori", 
    floor: 4, 
    capacity: 8, 
    status: "prenotata", 
    booking: { user: "Consiglio Docenti", date: "2025-09-05", time: "14:00-16:00", purpose: "Riunione Docenti" }, 
    blocked: null,
    bookings: [
      { date: "2025-09-05", startTime: "14:00", endTime: "16:00", user: "Consiglio Docenti" }
    ]
  },
  { 
    id: 32, 
    name: "Ufficio Colloqui", 
    floor: 4, 
    capacity: 6, 
    status: "libera", 
    booking: null, 
    blocked: null, 
    bookings: [] 
  }
];
