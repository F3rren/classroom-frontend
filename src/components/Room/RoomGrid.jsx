import { useState, useEffect } from "react";
import { getRoomsWithBookings } from "../../services/adminService";
import { useRooms } from "../../hooks/useRooms";
import RoomCard from "./RoomCard";
import RoomModal from "./RoomModal";
import FloorHeader from "./FloorHeader";
import SearchAndFilters from "./SearchAndFilters";
import ApiStatusIndicator from "../Common/ApiStatusIndicator";
import ApiDebugger from "../Common/ApiDebugger";
import ProxyTest from "../test/ProxyTest";

export default function RoomGrid({ user }) {
  // Usa il hook personalizzato per le stanze
  const { 
    rooms: allRooms, 
    loading: roomsLoading, 
    error: roomsError, 
    refreshRooms
  } = useRooms();
  
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

  // Effetto per gestire i dati delle stanze dal hook
  useEffect(() => {
    if (roomsLoading) {
      setLoading(true);
      return;
    }

    if (roomsError) {
      setError(roomsError);
      setRooms([]);
      setHasBookingSupport(false);
      setLoading(false);
      return;
    }

    // Se l'utente è admin, prova a ottenere dati più dettagliati
    const loadRoomsForUser = async () => {
      if (user?.role === "admin" || user?.ruolo === "admin") {
        try {
          console.log("🔄 Caricamento dati admin con prenotazioni...");
          const result = await getRoomsWithBookings();
          
          if (result.success && result.data?.length > 0) {
            setRooms(result.data);
            setHasBookingSupport(result.hasBookingSupport || false);
            console.log("✅ Dati admin caricati:", {
              count: result.data.length,
              hasBookingSupport: result.hasBookingSupport
            });
          } else {
            // Fallback ai dati base dall'hook
            setRooms(allRooms);
            setHasBookingSupport(allRooms.some(room => 
              room.bookings && room.bookings.length > 0
            ));
          }
        } catch (err) {
          console.warn("⚠️ Errore caricamento dati admin, uso dati base:", err);
          setRooms(allRooms);
          setHasBookingSupport(false);
        }
      } else {
        // Per utenti normali, usa i dati dal hook
        setRooms(allRooms);
        setHasBookingSupport(allRooms.some(room => 
          room.bookings && room.bookings.length > 0
        ));
      }
      
      setError(null);
      setLoading(false);
    };

    loadRoomsForUser();
  }, [allRooms, roomsLoading, roomsError, user?.role, user?.ruolo]);

  // Carica gli utenti per il dropdown (solo per admin)
  useEffect(() => {
    if (user?.role !== "admin" && user?.ruolo !== "admin") return;
    
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
  }, [user?.role, user?.ruolo]);

  // Funzione per ricaricare le stanze
  const handleRefreshRooms = async () => {
    refreshRooms(); // Ricarica tramite hook
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
      
      {/* Debug temporaneo - rimuovere in produzione */}
      {import.meta.env.DEV && (
        <>
          <ProxyTest />
          <ApiDebugger />
        </>
      )}
      
      {/* Stato del sistema e errori */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Errore di connessione:</span> {error}
                    <span className="block mt-1 text-xs">
                      Verifica che il backend sia avviato su <code className="bg-red-200 px-1 rounded">localhost:8080</code> e che l'endpoint <code className="bg-red-200 px-1 rounded">/api/rooms/detailed</code> sia implementato.
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleRefreshRooms}
                  disabled={loading}
                  className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
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
          <ApiStatusIndicator />
          {error ? (
            <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              � Errore Database
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
            <div className="bg-gray-100 w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-gray-400">---</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error ? 'Impossibile caricare le stanze' : 'Nessuna stanza trovata'}
            </h3>
            <p className="text-gray-600">
              {error 
                ? 'Verifica la connessione al database e riprova.' 
                : rooms.length === 0 
                ? 'Non ci sono stanze nel database. Aggiungile tramite il pannello admin.'
                : 'Prova a modificare i filtri di ricerca per vedere più risultati.'
              }
            </p>
            {!error && rooms.length > 0 && (
              <button
                onClick={() => { setSelectedCapacity("all"); setSelectedFloor("all"); setAvailability("all"); }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Mostra tutte le stanze
              </button>
            )}
            {error && (
              <button
                onClick={handleRefreshRooms}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                🔄 Riprova connessione
              </button>
            )}
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
