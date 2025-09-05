import { useState } from "react";
import { initialRoomsData } from "../../data/roomsData";
import AdminRoomCard from "./AdminRoomCard";
import AdvancedFiltersModal from "../Room/AdvancedFiltersModal";
import FloorHeader from "../Room/FloorHeader";

export default function RoomManagement({ currentUser }) {
  const [rooms, setRooms] = useState(initialRoomsData);
  const [selectedCapacity, setSelectedCapacity] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Verifica che solo gli admin possano accedere
  if (currentUser.ruolo !== "admin") {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">🚫 Accesso Negato</h3>
          <p className="text-red-600">Solo gli amministratori possono gestire le stanze.</p>
        </div>
      </div>
    );
  }

  const handleUpdateRoom = (updatedRoom) => {
    // Doppia verifica: solo admin possono modificare stanze
    if (currentUser.ruolo !== "admin") {
      alert("Solo gli amministratori possono modificare le stanze");
      return;
    }
    
    setRooms(rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
  };

  const handleQuickFilter = (criteria) => {
    if (criteria.capacity) {
      setSelectedCapacity(criteria.capacity);
    }
    if (criteria.floor !== undefined) {
      setSelectedFloor(criteria.floor);
    }
  };

  const filteredRooms = rooms.filter(room => {
    // Filtro per ricerca testuale
    let matchesSearch = true;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = room.name?.toLowerCase().includes(searchLower) || false;
      const matchesFloor = room.floor?.toString().includes(searchTerm) || false;
      const matchesCapacity = room.capacity?.toString().includes(searchTerm) || false;
      matchesSearch = matchesName || matchesFloor || matchesCapacity;
    }
    
    // Filtro per stato
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    
    // Filtro per capacità (nuovo sistema)
    let matchesCapacityFilter = true;
    if (selectedCapacity !== "all") {
      const capacityRanges = {
        "1-5": { min: 1, max: 5 },
        "6-10": { min: 6, max: 10 },
        "11-20": { min: 11, max: 20 },
        "21-30": { min: 21, max: 30 },
        "31-50": { min: 31, max: 50 },
        "50+": { min: 51, max: Infinity }
      };
      
      const range = capacityRanges[selectedCapacity];
      if (range) {
        matchesCapacityFilter = room.capacity >= range.min && room.capacity <= range.max;
      }
    }
    
    // Filtro per piano
    const matchesFloor = selectedFloor === "all" || room.floor === selectedFloor;
    
    return matchesSearch && matchesStatus && matchesCapacityFilter && matchesFloor;
  });

  // Raggruppa le stanze per piano
  const groupRoomsByFloor = (rooms) => {
    const grouped = {};
    rooms.forEach(room => {
      if (!grouped[room.floor]) {
        grouped[room.floor] = [];
      }
      grouped[room.floor].push(room);
    });
    
    // Ordina i piani in ordine crescente
    const sortedFloors = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
    const result = {};
    sortedFloors.forEach(floor => {
      result[floor] = grouped[floor];
    });
    
    return result;
  };

  const roomsByFloor = groupRoomsByFloor(filteredRooms);

  const statusCounts = {
    all: rooms.length,
    libera: rooms.filter(r => r.status === "libera").length,
    prenotata: rooms.filter(r => r.status === "prenotata").length,
    "in-uso": rooms.filter(r => r.status === "in-uso").length,
    bloccata: rooms.filter(r => r.status === "bloccata").length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🏢 Gestione Stanze Admin</h2>
          <div className="text-sm text-gray-600">
            {filteredRooms.length} stanze trovate
          </div>
        </div>
        
        {/* Interfaccia Filtri Unificata */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Ricerca Rapida
              </label>
              <input
                type="text"
                placeholder="Cerca per nome, piano o capacità..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Stato
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px]"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="libera">✅ Libere</option>
                  <option value="prenotata">📅 Prenotate</option>
                  <option value="in-uso">🔴 In uso</option>
                  <option value="bloccata">🚫 Bloccate</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Filtro Avanzato
                </label>
                <button
                  onClick={() => setShowFiltersModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
                >
                  🔍 Filtri Avanzati
                </button>
              </div>
            </div>
          </div>

          {/* Filtri attivi */}
          {(selectedCapacity !== "all" || selectedFloor !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCapacity !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Capacità: {selectedCapacity}
                  <button 
                    onClick={() => setSelectedCapacity("all")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedFloor !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Piano: {selectedFloor === 0 ? 'Terra' : selectedFloor}
                  <button 
                    onClick={() => setSelectedFloor("all")}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Statistiche rapide */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.libera}</div>
            <div className="text-sm text-green-800">Libere</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.prenotata}</div>
            <div className="text-sm text-yellow-800">Prenotate</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts["in-uso"]}</div>
            <div className="text-sm text-blue-800">In uso</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.bloccata}</div>
            <div className="text-sm text-red-800">Bloccate</div>
          </div>
        </div>
      </div>

      {/* Stanze raggruppate per piano */}
      <div className="space-y-6">
        {Object.keys(roomsByFloor).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">
              Nessuna stanza trovata per i filtri selezionati
            </p>
            <button
              onClick={() => { 
                setSelectedCapacity("all"); 
                setSelectedFloor("all"); 
                setStatusFilter("all");
                setSearchTerm("");
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Filtri
            </button>
          </div>
        ) : (
          Object.entries(roomsByFloor).map(([floor, roomsOnFloor]) => (
            <div key={floor} className="space-y-4">
              <FloorHeader 
                floor={parseInt(floor)} 
                roomCount={roomsOnFloor.length}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {roomsOnFloor.map((room) => (
                  <AdminRoomCard
                    key={room.id}
                    room={room}
                    onUpdateRoom={handleUpdateRoom}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Filtri Avanzati */}
      <AdvancedFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        selectedCapacity={selectedCapacity}
        onCapacityChange={setSelectedCapacity}
        selectedFloor={selectedFloor}
        onFloorSelect={setSelectedFloor}
        rooms={rooms}
        onQuickFilter={handleQuickFilter}
      />
    </div>
  );
}
