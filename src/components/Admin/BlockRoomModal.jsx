import { useState } from "react";

export default function BlockRoomModal({ room, onClose, onBlock }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const commonReasons = [
    "Manutenzione impianti",
    "Problemi tecnici",
    "Ristrutturazione",
    "Pulizia straordinaria",
    "Problemi di sicurezza",
    "Evento speciale"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError("Inserisci il motivo del blocco");
      return;
    }

    const blockData = {
      reason: reason.trim(),
      blockedBy: "admin", // In un'app reale sarebbe l'utente corrente
      blockedAt: new Date().toISOString().split('T')[0]
    };

    // Procedi con il blocco - la verifica admin è già fatta nel componente padre
    onBlock(room, blockData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">🚫 Blocca Stanza</h3>
          <p className="text-gray-600 mt-1">
            Stai per bloccare <strong>{room.name}</strong>
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
            <p className="text-red-800 text-xs">
              🛡️ <strong>Operazione riservata agli amministratori</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Motivo del blocco *
            </label>
            <textarea
              value={reason}
              onChange={(e) => {setReason(e.target.value); setError("");}}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Inserisci il motivo del blocco..."
              required
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Motivi comuni:</p>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((commonReason) => (
                <button
                  key={commonReason}
                  type="button"
                  onClick={() => setReason(commonReason)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md border transition"
                >
                  {commonReason}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Attenzione:</strong> La stanza bloccata non sarà disponibile per nuove prenotazioni. 
              Le prenotazioni esistenti potrebbero essere annullate.
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
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
            >
              🚫 Blocca Stanza
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
