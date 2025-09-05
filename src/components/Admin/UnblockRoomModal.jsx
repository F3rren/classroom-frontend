import { useState } from "react";

export default function UnblockRoomModal({ room, onClose, onUnblock }) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  
  const requiredText = "SBLOCCA";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (confirmText !== requiredText) {
      setError(`Scrivi "${requiredText}" per confermare`);
      return;
    }

    // Verifica aggiuntiva per sicurezza - solo admin possono sbloccare
    onUnblock(room);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">🔓 Sblocca Stanza</h3>
          <p className="text-gray-600 mt-1">
            Stai per sbloccare <strong>{room.name}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
            <p className="text-blue-800 text-xs">
              🛡️ <strong>Operazione riservata agli amministratori</strong>
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              <strong>Stanza attualmente bloccata per:</strong><br/>
              {room.blocked?.reason || "Motivo non specificato"}
            </p>
            <p className="text-blue-600 text-xs mt-1">
              Bloccata il {room.blocked?.blockedAt} da {room.blocked?.blockedBy}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Per confermare lo sblocco, scrivi <strong>"{requiredText}"</strong>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {setConfirmText(e.target.value); setError("");}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={`Scrivi ${requiredText} per confermare`}
                required
              />
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                ✅ La stanza tornerà disponibile per le prenotazioni.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                ✅ Sblocca Stanza
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
