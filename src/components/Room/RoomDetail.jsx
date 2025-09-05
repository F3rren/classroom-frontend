import React from "react";

export default function RoomDetail({ room }) {
  if (!room) return <div>Stanza non trovata.</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Stanza {room.id}</h2>
      <div className="mb-2">Nome: {room.name}</div>
      <div className="mb-2">Capacità: {room.capacity}</div>
      <div className="mb-2">Piano: {room.floor}</div>
      <div className="mb-2">Stato: {room.status}</div>
      {/* Aggiungi altri dettagli se necessario */}
    </div>
  );
}
