import { useState } from "react";
import { getStatusColor, getStatusLabel, formatShortDate } from "../../utils/roomUtils";
import BlockRoomModal from "./BlockRoomModal";
import UnblockRoomModal from "./UnblockRoomModal";

export default function AdminRoomCard({ room, onUpdateRoom, currentUser }) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  
  const canManage = currentUser.role === "admin";

  const handleBlockRoom = (roomToBlock, blockData) => {
    // Solo gli admin possono bloccare stanze
    if (currentUser.role !== "admin") {
      alert("Solo gli amministratori possono bloccare le stanze");
      return;
    }
    
    const updatedRoom = {
      ...roomToBlock,
      blocked: blockData,
      status: 'bloccata'
    };
    onUpdateRoom(updatedRoom);
    setShowBlockModal(false);
  };

  const handleUnblockRoom = (roomToUnblock) => {
    // Solo gli admin possono sbloccare stanze
    if (currentUser.role !== "admin") {
      alert("Solo gli amministratori possono sbloccare le stanze");
      return;
    }
    
    const updatedRoom = {
      ...roomToUnblock,
      blocked: null,
      status: 'libera' // Torna libera di default
    };
    onUpdateRoom(updatedRoom);
    setShowUnblockModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{room.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(room.status).split(' ')[0]}`}>
                {getStatusLabel(room.status)}
              </span>
            </div>
            
            {room.status === "prenotata" && room.booking && (
              <div className="mb-2 text-sm text-gray-600">
                <p><strong>Prenotata da:</strong> {room.booking.user}</p>
                <p><strong>Data:</strong> {formatShortDate(room.booking.date)}</p>
                <p><strong>Orario:</strong> {room.booking.time}</p>
              </div>
            )}

            {room.status === "in-uso" && room.booking && (
              <div className="mb-2 text-sm text-gray-600">
                <p><strong>In uso da:</strong> {room.booking.user}</p>
                <p><strong>Orario:</strong> {room.booking.time}</p>
                <p><strong>Scopo:</strong> {room.booking.purpose}</p>
              </div>
            )}

            {room.status === "bloccata" && room.blocked && (
              <div className="mb-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800 mb-1">Motivo blocco:</p>
                  <p className="text-sm text-red-700">{room.blocked.reason}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Bloccata il {formatShortDate(room.blocked.blockedAt)} da {room.blocked.blockedBy}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {canManage && (
            <div className="flex gap-2 ml-4">
              {room.status === "bloccata" ? (
                <button
                  onClick={() => setShowUnblockModal(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  ✅ Sblocca
                </button>
              ) : (
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm"
                >
                  🚫 Blocca
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Piano:</strong> {room.floor}
            </div>
            <div>
              <strong>Capacità:</strong> {room.capienza} posti
            </div>
          </div>
        </div>
      </div>

      {showBlockModal && (
        <BlockRoomModal
          room={room}
          onClose={() => setShowBlockModal(false)}
          onBlock={handleBlockRoom}
        />
      )}

      {showUnblockModal && (
        <UnblockRoomModal
          room={room}
          onClose={() => setShowUnblockModal(false)}
          onUnblock={handleUnblockRoom}
        />
      )}
    </>
  );
}
