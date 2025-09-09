import { useState, useEffect } from "react";
import { initialRoomsData } from "../../data/roomsData";
import { getRoomList } from "../../services/roomService";
import { getRoomsWithBookings } from "../../services/adminService";
import RoomCard from "./RoomCard";
import RoomModal from "./RoomModal";
import FloorHeader from "./FloorHeader";
import SearchAndFilters from "./SearchAndFilters";

export default function RoomGrid({ user }) {
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasBookingSupport, setHasBookingSupport] = useState(false);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [availability, setAvailability] = useState("all");

  // Carica le stanze con possibili prenotazioni
  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("🔄 Caricamento stanze per utenti...");
        
        // Per utenti admin, prova prima con prenotazioni
        if (user?.role === "admin" || user?.ruolo === "admin") {
          const result = await getRoomsWithBookings();
          
          if (result.success) {
            setRooms(result.data || []);
            setHasBookingSupport(result.hasBookingSupport || false);
            
            console.log("✅ Stanze admin caricate:", {
              count: result.data?.length || 0,
              hasBookingSupport: result.hasBookingSupport
            });
          } else {
            // Fallback per admin
            console.warn("⚠️ Fallback a getRoomList per admin");
            const basicResult = await getRoomList();
            if (basicResult.success) {
              setRooms(basicResult.data || []);
              setHasBookingSupport(false);
            } else {
              throw new Error(basicResult.error);
            }
          }
        } else {
          // Per utenti normali, usa getRoomList
          const result = await getRoomList();
          
          if (result.success) {
            setRooms(result.data || []);
            setHasBookingSupport(false);
            
            console.log("✅ Stanze utente caricate:", {
              count: result.data?.length || 0
            });
          } else {
            throw new Error(result.error);
          }
        }
        
      } catch (err) {
        console.error("❌ Errore caricamento stanze:", err);
        setError(err.message || "Errore di connessione al server");
        setRooms(initialRoomsData); // Fallback ai dati mock
        setHasBookingSupport(true); // I dati mock includono le prenotazioni!
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [user?.role, user?.ruolo]);

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

  // Funzione per ricaricare le stanze
  const refreshRooms = async () => {
    setLoading(true);
    try {
      let result;
      if (user?.role === "admin" || user?.ruolo === "admin") {
        result = await getRoomsWithBookings();
        if (!result.success) {
          result = await getRoomList();
        }
      } else {
        result = await getRoomList();
      }
      
      if (result.success) {
        setRooms(result.data || []);
        setHasBookingSupport(result.hasBookingSupport || false);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Errore di connessione al server");
      setRooms(initialRoomsData); // Fallback ai dati mock
      setHasBookingSupport(true); // I dati mock includono le prenotazioni!
    } finally {
      setLoading(false);
    }
  };



  // Filtra le stanze per capacità, piano e disponibilità
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
    // Filtra per disponibilità
    if (availability !== "all") {
      // Mappa i valori del filtro su quelli reali dei dati
      if (availability === "available" && room.status !== "libera") return false;
      if (availability === "occupied" && room.status !== "prenotata" && room.status !== "in-uso") return false;
      if (availability === "blocked" && room.status !== "bloccata") return false;
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


  // Mostra RoomModal al click sulla card
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
    <div className="w-full space-y-4">
      
      {/* Stato del sistema e errori */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Attenzione:</span> {error}
                    {!hasBookingSupport && " - Dati base disponibili."}
                  </p>
                </div>
                <button
                  onClick={refreshRooms}
                  disabled={loading}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium disabled:opacity-50"
                >
                  🔄 Riprova
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header con stato sistema */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Stanze Disponibili</h1>
          {error && hasBookingSupport ? (
            <div className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              🟪 Dati dimostrativi
            </div>
          ) : hasBookingSupport ? (
            <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              📋 Con prenotazioni
            </div>
          ) : (
            <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
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
        <div className="text-sm text-gray-600">
          {filteredRooms.length} stanze trovate su {rooms.length} totali
        </div>
      </div>

      {/* Loading state */}
      {loading && rooms.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Caricamento stanze...</p>
          </div>
        </div>
      )}

      {/* Filtro Avanzato Unificato */}
      {!loading && (
        <SearchAndFilters 
          selectedCapacity={selectedCapacity}
          onCapacityChange={setSelectedCapacity}
          selectedFloor={selectedFloor}
          onFloorSelect={setSelectedFloor}
          availability={availability}
          onAvailabilityChange={setAvailability}
          rooms={rooms}
          onQuickFilter={handleQuickFilter}
          hasBookingSupport={hasBookingSupport}
        />
      )}

      {/* Stanze raggruppate per piano */}
      <div className="space-y-6">
        {filteredRooms.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna stanza trovata</h3>
            <p className="text-gray-600">
              Prova a modificare i filtri di ricerca per vedere più risultati.
            </p>
            <button
              onClick={() => { setSelectedCapacity("all"); setSelectedFloor("all"); setAvailability("all"); }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
              <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                {roomsOnFloor.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    onRoomClick={openModal}
                    showBookingInfo={hasBookingSupport}
                    layoutStyle="extended"
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
