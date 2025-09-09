import { useState } from "react";
import { getCapacityIcon, getCapacityLabel, getCapacityColor } from "../../utils/roomUtils";

export default function AdvancedSearch({ rooms, onSearchResults, onClose, initialCriteria }) {
  const [searchCriteria, setSearchCriteria] = useState({
    minCapacity: initialCriteria?.minCapacity || "",
    maxCapacity: initialCriteria?.maxCapacity || "",
    date: initialCriteria?.date || new Date().toISOString().split('T')[0],
    startTime: initialCriteria?.startTime || "",
    endTime: initialCriteria?.endTime || "",
    floor: initialCriteria?.floor || "all",
    status: initialCriteria?.status || "all",
    roomType: initialCriteria?.roomType || "all"
  });

  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errors, setErrors] = useState({});

  const validateSearch = () => {
    const newErrors = {};

    if (searchCriteria.minCapacity && searchCriteria.maxCapacity) {
      if (parseInt(searchCriteria.minCapacity) > parseInt(searchCriteria.maxCapacity)) {
        newErrors.capacity = "La capacità minima non può essere maggiore di quella massima";
      }
    }

    if (searchCriteria.startTime && searchCriteria.endTime) {
      const startMinutes = timeToMinutes(searchCriteria.startTime);
      const endMinutes = timeToMinutes(searchCriteria.endTime);
      if (startMinutes >= endMinutes) {
        newErrors.time = "L'orario di fine deve essere successivo a quello di inizio";
      }
    }

    const selectedDate = new Date(searchCriteria.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = "Non puoi cercare stanze per date passate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isRoomAvailable = (room, date, startTime, endTime) => {
    if (!room.bookings || !startTime || !endTime) return true;

    const searchStart = timeToMinutes(startTime);
    const searchEnd = timeToMinutes(endTime);

    return !room.bookings.some(booking => {
      if (booking.date !== date) return false;
      
      const bookingStart = timeToMinutes(booking.startTime);
      const bookingEnd = timeToMinutes(booking.endTime);
      
      return searchStart < bookingEnd && searchEnd > bookingStart;
    });
  };

  const handleSearch = () => {
    if (!validateSearch()) return;

    const results = rooms.filter(room => {
      // Filtro capacità
      if (searchCriteria.minCapacity && room.capacity < parseInt(searchCriteria.minCapacity)) return false;
      if (searchCriteria.maxCapacity && room.capacity > parseInt(searchCriteria.maxCapacity)) return false;

      // Filtro piano
      if (searchCriteria.floor !== "all" && room.floor !== parseInt(searchCriteria.floor)) return false;

      // Filtro stato
      if (searchCriteria.status !== "all" && room.status !== searchCriteria.status) return false;

      // Filtro tipo stanza
      if (searchCriteria.roomType !== "all") {
        const roomName = room.name.toLowerCase();
        switch (searchCriteria.roomType) {
          case "aula":
            if (!roomName.includes("aula")) return false;
            break;
          case "sala":
            if (!roomName.includes("sala")) return false;
            break;
          case "laboratorio":
            if (!roomName.includes("laboratorio")) return false;
            break;
        }
      }

      // Filtro disponibilità orario
      if (searchCriteria.startTime && searchCriteria.endTime) {
        if (!isRoomAvailable(room, searchCriteria.date, searchCriteria.startTime, searchCriteria.endTime)) return false;
      }

      // Escludi stanze bloccate a meno che non sia esplicitamente richiesto
      if (searchCriteria.status !== "bloccata" && room.status === "bloccata") return false;

      return true;
    });

    setSearchResults(results);
    setHasSearched(true);
    onSearchResults(results);
  };

  const resetSearch = () => {
    setSearchCriteria({
      minCapacity: "",
      maxCapacity: "",
      date: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
      floor: "all",
      status: "all",
      roomType: "all"
    });
    setSearchResults([]);
    setHasSearched(false);
    setErrors({});
    onSearchResults(rooms); // Mostra tutte le stanze
  };

  const floors = [...new Set(rooms.map(room => room.piano))].sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🔍 Ricerca Avanzata Stanze</h2>
              <p className="text-blue-100 mt-1">Trova la stanza perfetta per le tue esigenze</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Colonna Sinistra - Criteri Base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                📋 Criteri di Base
              </h3>

              {/* Capacità */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    👥 Capacità Minima
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Es. 10"
                    value={searchCriteria.minCapacity}
                    onChange={(e) => setSearchCriteria({...searchCriteria, minCapacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    👥 Capacità Massima
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Es. 50"
                    value={searchCriteria.maxCapacity}
                    onChange={(e) => setSearchCriteria({...searchCriteria, maxCapacity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {errors.capacity && <p className="text-red-600 text-sm">{errors.capacity}</p>}

              {/* Piano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏢 Piano
                </label>
                <select
                  value={searchCriteria.piano}
                  onChange={(e) => setSearchCriteria({...searchCriteria, floor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tutti i piani</option>
                  {floors.map(floor => (
                    <option key={floor} value={floor}>Piano {floor}</option>
                  ))}
                </select>
              </div>

              {/* Tipo Stanza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🏛️ Tipo Stanza
                </label>
                <select
                  value={searchCriteria.roomType}
                  onChange={(e) => setSearchCriteria({...searchCriteria, roomType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="aula">🎓 Aule</option>
                  <option value="sala">🏢 Sale</option>
                  <option value="laboratorio">🔬 Laboratori</option>
                </select>
              </div>
            </div>

            {/* Colonna Destra - Disponibilità */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                ⏰ Disponibilità
              </h3>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Data
                </label>
                <input
                  type="date"
                  value={searchCriteria.date}
                  onChange={(e) => setSearchCriteria({...searchCriteria, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.date && <p className="text-red-600 text-sm">{errors.date}</p>}
              </div>

              {/* Orari */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🕐 Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={searchCriteria.startTime}
                    onChange={(e) => setSearchCriteria({...searchCriteria, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🕐 Ora Fine
                  </label>
                  <input
                    type="time"
                    value={searchCriteria.endTime}
                    onChange={(e) => setSearchCriteria({...searchCriteria, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {errors.time && <p className="text-red-600 text-sm">{errors.time}</p>}

              {/* Stato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📊 Stato Desiderato
                </label>
                <select
                  value={searchCriteria.status}
                  onChange={(e) => setSearchCriteria({...searchCriteria, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Qualsiasi stato</option>
                  <option value="libera">🟢 Solo libere</option>
                  <option value="prenotata">🟡 Prenotate</option>
                  <option value="in-uso">🔵 In uso</option>
                  <option value="bloccata">🔴 Bloccate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pulsanti Azione */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleSearch}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              🔍 Cerca Stanze
            </button>
            <button
              onClick={resetSearch}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              🔄 Reset
            </button>
          </div>

          {/* Risultati */}
          {hasSearched && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Risultati Ricerca ({searchResults.length} stanze trovate)
              </h3>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">😕</div>
                  <p className="text-lg font-medium">Nessuna stanza trovata</p>
                  <p className="text-sm">Prova a modificare i criteri di ricerca</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {searchResults.map(room => (
                    <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{room.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs ${getCapacityColor(room.capacity)}`}>
                          {getCapacityIcon(room.capacity)} {room.capacity}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 Piano {room.floor} • {getCapacityLabel(room.capacity)}</p>
                        <p>📊 Stato: <span className="capitalize">{room.status.replace('-', ' ')}</span></p>
                        {room.status === "bloccata" && room.blocked && (
                          <p className="text-red-600">🚫 {room.blocked.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
