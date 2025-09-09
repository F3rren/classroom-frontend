import { useState, useEffect } from "react";
import { initialRoomsData } from "../../data/roomsData";
import { getRoomsWithBookings } from "../../services/adminService";
import AdminRoomCard from "./AdminRoomCard";
import AdvancedFiltersModal from "../Room/AdvancedFiltersModal";
import FloorHeader from "../Room/FloorHeader";
import RoomAdminModal from "./RoomAdminModal";

export default function RoomManagement({ currentUser }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasBookingSupport, setHasBookingSupport] = useState(false);
  const [selectedCapacity, setSelectedCapacity] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Carica le stanze con possibili prenotazioni
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("🔄 [Admin] Caricamento stanze con prenotazioni...");
        
        const result = await getRoomsWithBookings();
        
        if (result.success) {
          setRooms(result.data || []);
          setHasBookingSupport(result.hasBookingSupport || false);
          
          console.log("✅ [Admin] Stanze caricate:", {
            count: result.data?.length || 0,
            hasBookingSupport: result.hasBookingSupport
          });
        } else {
          console.warn("⚠️ [Admin] Errore API, uso dati fallback:", result.error);
          setError(result.error);
          setRooms(initialRoomsData); // Fallback ai dati mock
          setHasBookingSupport(false);
        }
      } catch (err) {
        console.error("❌ [Admin] Errore di rete:", err);
        setError("Errore di connessione al server");
        setRooms(initialRoomsData); // Fallback ai dati mock
        setHasBookingSupport(false);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser.ruolo === "admin") {
      loadRooms();
    }
  }, [currentUser.ruolo]);

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

  // Funzione per ricaricare i dati
  const refreshRooms = async () => {
    setLoading(true);
    try {
      const result = await getRoomsWithBookings();
      if (result.success) {
        setRooms(result.data || []);
        setHasBookingSupport(result.hasBookingSupport || false);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Errore di connessione al server");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsEditing(false);
    setShowRoomModal(true);
  };

  const handleSaveRoom = (roomData, editing) => {
    if (editing) {
      // Modifica stanza esistente
      setRooms(rooms.map(room => 
        room.id === roomData.id ? roomData : room
      ));
    } else {
      // Aggiungi nuova stanza
      const newRoom = {
        ...roomData,
        id: Date.now(), // ID temporaneo per il mock
        status: "libera"
      };
      setRooms([...rooms, newRoom]);
    }
    setShowRoomModal(false);
    setSelectedRoom(null);
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setSelectedRoom(null);
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
      const matchesName = room.nome?.toLowerCase().includes(searchLower) || false;
      const matchesFloor = room.piano?.toString().includes(searchTerm) || false;
      const matchesCapacity = room.capienza?.toString().includes(searchTerm) || false;
      matchesSearch = matchesName || matchesFloor || matchesCapacity;
    }
    
    // Filtro per stato
    const matchesStatus = statusFilter === "all" || room.stato === statusFilter;
    
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
        matchesCapacityFilter = room.capienza >= range.min && room.capienza <= range.max;
      }
    }
    
    // Filtro per piano
    const matchesFloor = selectedFloor === "all" || room.piano === selectedFloor;
    
    return matchesSearch && matchesStatus && matchesCapacityFilter && matchesFloor;
  });

  // Raggruppa le stanze per piano
  const groupRoomsByFloor = (rooms) => {
    const grouped = {};
    rooms.forEach(room => {
      if (!grouped[room.piano]) {
        grouped[room.piano] = [];
      }
      grouped[room.piano].push(room);
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
      
      {/* Stato del sistema */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Attenzione:</span> {error}
                {!hasBookingSupport && " - Sistema prenotazioni non disponibile."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🏢 Gestione Stanze Admin</h2>
            <div className="flex items-center space-x-4 mt-2">
              <div className="text-sm text-gray-600">
                {filteredRooms.length} stanze trovate su {rooms.length} totali
              </div>
              {hasBookingSupport ? (
                <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  📋 Prenotazioni attive
                </div>
              ) : (
                <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  📝 Solo dati base
                </div>
              )}
              {loading && (
                <div className="inline-flex items-center text-blue-600 text-xs">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                  Caricamento...
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshRooms}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              🔄 Aggiorna
            </button>
            <button
              onClick={handleAddRoom}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Nuova Stanza
            </button>
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

      {/* Modal Gestione Stanza */}
      {showRoomModal && (
        <RoomAdminModal
          room={selectedRoom}
          isEditing={isEditing}
          onClose={closeRoomModal}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}
