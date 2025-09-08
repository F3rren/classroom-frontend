import { useState, useEffect } from "react";
import { initialRoomsData } from "../../data/roomsData";
import RoomCard from "./RoomCard";
import RoomModal from "./RoomModal";
import FloorHeader from "./FloorHeader";
import SearchAndFilters from "./SearchAndFilters";

export default function RoomGrid({ user }) {
  const [rooms, setRooms] = useState(initialRoomsData);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");

  // Carica gli utenti per il dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:8080/api/admin/users", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || data);
        }
      } catch (err) {
        console.error("Errore nel caricamento degli utenti:", err);
      }
    };

    fetchUsers();
  }, []);

  // Filtra le stanze per capacità e piano
  const filteredRooms = rooms.filter(room => {
    // Filtra per capacità
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
      if (range && !(room.capacity >= range.min && room.capacity <= range.max)) {
        return false;
      }
    }
    
    // Filtra per piano
    if (selectedFloor !== "all" && room.floor !== selectedFloor) {
      return false;
    }
    
    return true;
  });

  const handleQuickFilter = (criteria) => {
    // Implementa il filtro rapido
    if (criteria.capacity) {
      setSelectedCapacity(criteria.capacity);
    }
    if (criteria.floor !== undefined) {
      setSelectedFloor(criteria.floor);
    }
  };

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

  const openModal = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleRoomSave = (updatedRoom) => {
    setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    closeModal();
  };

  return (
    <div className="w-full">
      {/* Filtro Avanzato Unificato */}
      <SearchAndFilters 
        selectedCapacity={selectedCapacity}
        onCapacityChange={setSelectedCapacity}
        selectedFloor={selectedFloor}
        onFloorSelect={setSelectedFloor}
        rooms={rooms}
        onQuickFilter={handleQuickFilter}
        filteredRoomsCount={filteredRooms.length}
      />

      {/* Stanze raggruppate per piano */}
      <div className="space-y-6">
        {Object.keys(roomsByFloor).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">
              Nessuna stanza trovata per i filtri selezionati
            </p>
            <button
              onClick={() => { setSelectedCapacity("all"); setSelectedFloor("all"); }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Mostra tutte le stanze
            </button>
          </div>
        ) : (
          Object.entries(roomsByFloor).map(([floor, roomsOnFloor]) => (
            <div key={floor} className="space-y-4">
              <FloorHeader 
                floor={parseInt(floor)} 
                roomCount={roomsOnFloor.length}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roomsOnFloor.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    onClick={() => openModal(room)}
                    user={user}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale per prenotazione/dettagli */}
      {showModal && selectedRoom && (
        <RoomModal 
          room={selectedRoom} 
          user={user}
          users={users}
          onClose={closeModal}
          onSave={handleRoomSave}
        />
      )}
    </div>
  );
}
