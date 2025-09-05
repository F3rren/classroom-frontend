// Utilità per le stanze
export const getStatusColor = (status) => {
  switch (status) {
    case "libera":
      return "bg-green-400 hover:bg-green-500 border-green-600";
    case "prenotata":
      return "bg-yellow-400 hover:bg-yellow-500 border-yellow-600";
    case "in-uso":
      return "bg-red-500 hover:bg-red-600 border-red-700 animate-pulse";
    case "bloccata":
      return "bg-gray-500 hover:bg-gray-600 border-gray-700";
    default:
      return "bg-gray-400";
  }
};

export const getStatusLabel = (status) => {
  switch (status) {
    case "libera":
      return "Libera";
    case "prenotata":
      return "Prenotata";
    case "in-uso":
      return "In Uso";
    case "bloccata":
      return "Bloccata";
    default:
      return "Sconosciuto";
  }
};

// Formattazione date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Formatta una data in formato breve
export const formatShortDate = (dateString) => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Validazione orari
export const validateTimes = (startTime, endTime) => {
  if (!startTime || !endTime) return true; // Skip validation if either time is empty
  
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  return end > start;
};

// Categorizza le stanze per capacità
export function getCapacityCategory(capacity) {
  if (capacity <= 5) return "extra-small";
  if (capacity <= 10) return "small";
  if (capacity <= 20) return "medium";
  if (capacity <= 30) return "large";
  if (capacity <= 50) return "extra-large";
  return "conference";
}

// Ottiene l'etichetta per la categoria di capacità
export function getCapacityLabel(capacity) {
  if (capacity <= 5) return "1-5 persone";
  if (capacity <= 10) return "6-10 persone";
  if (capacity <= 20) return "11-20 persone";
  if (capacity <= 30) return "21-30 persone";
  if (capacity <= 50) return "31-50 persone";
  return "50+ persone";
}

// Ottiene l'icona per la categoria di capacità
export function getCapacityIcon(capacity) {
  if (capacity <= 5) return "👤";
  if (capacity <= 10) return "👥";
  if (capacity <= 20) return "👥👥";
  if (capacity <= 30) return "🏢";
  if (capacity <= 50) return "🏛️";
  return "🏟️";
}

// Ottiene il colore per la categoria di capacità
export function getCapacityColor(capacity) {
  if (capacity <= 5) return "bg-purple-100 text-purple-800";
  if (capacity <= 10) return "bg-blue-100 text-blue-800";
  if (capacity <= 20) return "bg-green-100 text-green-800";
  if (capacity <= 30) return "bg-yellow-100 text-yellow-800";
  if (capacity <= 50) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}
