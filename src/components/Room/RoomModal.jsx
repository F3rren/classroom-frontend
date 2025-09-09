import { useState } from "react";
import { formatDate, validateTimes, getCapacityIcon, getCapacityLabel, getCapacityColor } from "../../utils/roomUtils";

export default function RoomModal({ room, user, users = [], onClose, onSave }) {
  const [bookingData, setBookingData] = useState({
    user: user && user.username ? user.username : "",
    date: new Date().toISOString().split('T')[0], // Data odierna come default
    startTime: "",
    endTime: "",
    purpose: ""
  });
  
  const [errors, setErrors] = useState({});
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Filtra gli utenti in base alla ricerca
  const filteredUsers = users.filter(u => 
    u.nome?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleUserSelect = (selectedUser) => {
    setBookingData({...bookingData, user: selectedUser.nome || selectedUser.nome});
    setShowUserDropdown(false);
    setUserSearch("");
  };

  const handleTimeChange = (field, value) => {
    const newData = { ...bookingData, [field]: value };
    setBookingData(newData);
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, time: null }));
    
    // Validate times if both are filled
    if (newData.startTime && newData.endTime) {
      if (!validateTimes(newData.startTime, newData.endTime)) {
        setErrors(prev => ({ 
          ...prev, 
          time: "L'ora di fine deve essere successiva all'ora di inizio" 
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Final validation before submit
    if (!validateTimes(bookingData.startTime, bookingData.endTime)) {
      setErrors({ time: "L'ora di fine deve essere successiva all'ora di inizio" });
      return;
    }
    
    const updatedRoom = {
      ...room,
      status: "prenotata",
      booking: {
        user: bookingData.user,
        date: bookingData.date,
        time: `${bookingData.startTime}-${bookingData.endTime}`,
        purpose: bookingData.purpose
      }
    };
    onSave(updatedRoom);
  };

  const handleDelete = () => {
    const updatedRoom = {
      ...room,
      status: "libera",
      booking: null
    };
    onSave(updatedRoom);
  };

  // Non permettere prenotazioni su stanze bloccate
  if (room.stato === "bloccata") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{room.name}</h3>
              {room.capienza && (
                <div className={`px-3 py-1 rounded-full text-sm ${getCapacityColor(room.capienza)}`}>
                  <span className="mr-1">{getCapacityIcon(room.capienza)}</span>
                  {room.capienza} posti
                </div>
              )}
            </div>
            <p className="text-sm text-red-600 font-semibold">🚫 Stanza Bloccata</p>
            {room.capienza && (
              <p className="text-xs text-gray-500 mt-1">{getCapacityLabel(room.capienza)}</p>
            )}
          </div>

          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">Motivo del blocco:</h4>
              <p className="text-red-700">{room.blocked?.notePrenotazione || "Motivo non specificato"}</p>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Bloccata da:</strong> {room.blocked?.blockedBy || "N/A"}</p>
              <p><strong>Data blocco:</strong> {formatDate(room.blocked?.blockedAt || new Date().toISOString().split('T')[0])}</p>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Questa stanza non è disponibile per le prenotazioni. 
                Contatta un amministratore per maggiori informazioni.
              </p>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se la stanza non è libera e manca la prenotazione, mostra messaggio di errore
  if (room.stato !== "libera" && !room.stato) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
          <div className="p-6 border-b">
            <h3 className="text-xl font-bold text-gray-800">{room.nome}</h3>
            <p className="text-red-600 mt-2">Dati prenotazione non disponibili per questa stanza.</p>
          </div>
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">{room.nome}</h3>
            {room.capienza && (
              <div className={`px-3 py-1 rounded-full text-sm ${getCapacityColor(room.capienza)}`}>
                <span className="mr-1">{getCapacityIcon(room.capienza)}</span>
                {room.capienza} posti
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 capitalize">Stato: {room.stato.replace("-", " ")}</p>
            {room.capienza && (
              <p className="text-xs text-gray-500">{getCapacityLabel(room.capienza)}</p>
            )}
          </div>
        </div>

        <div className="p-6">
          {room.stato !== "libera" && room.booking ? (
            // Mostra dettagli prenotazione esistente
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Prenotato da:</label>
                <p className="text-gray-800">{room.booking.utenteNome}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Data:</label>
                <p className="text-gray-800">{formatDate(room.booking.dataCreazione)}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Orario:</label>
                <p className="text-gray-800">{room.booking.time}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Scopo:</label>
                <p className="text-gray-800">{room.booking.purpose}</p>
              </div>
              {/* Mostra il pulsante cancella solo se user è definito e ha ruolo admin o è il proprietario */}
              {user && (user.ruolo === "admin" || room.booking.utenteNome === user.username) && (
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                  >
                    Cancella Prenotazione
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Form per nuova prenotazione
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Prenotato da:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={showUserDropdown ? userSearch : bookingData.user}
                    onChange={(e) => {
                      if (showUserDropdown) {
                        setUserSearch(e.target.value);
                      } else {
                        setBookingData({...bookingData, user: e.target.value});
                      }
                    }}
                    onFocus={() => {
                      if (users.length > 0) {
                        setShowUserDropdown(true);
                        setUserSearch(bookingData.user);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={users.length > 0 ? "Cerca utente o scrivi nome..." : "Nome utente"}
                    required
                  />
                  
                  {/* Dropdown lista utenti */}
                  {showUserDropdown && users.length > 0 && (
                    <>
                      {/* Overlay per chiudere dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => {
                          setShowUserDropdown(false);
                          setUserSearch("");
                        }}
                      />
                      
                      {/* Lista utenti */}
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((usr) => (
                            <div
                              key={usr.id || usr.nome}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleUserSelect(usr)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {usr.nome || usr.nome}
                                  </div>
                                  {usr.email && (
                                    <div className="text-sm text-gray-500">
                                      {usr.email}
                                    </div>
                                  )}
                                </div>
                                {usr.ruolo && (
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    usr.ruolo === 'admin' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {usr.ruolo}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            Nessun utente trovato
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Data:
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ora Inizio:
                  </label>
                  <input
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ora Fine:
                  </label>
                  <input
                    type="time"
                    value={bookingData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              {/* Messaggio di errore per la validazione degli orari */}
              {errors.time && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{errors.time}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Scopo dell'utilizzo:
                </label>
                <textarea
                  value={bookingData.purpose}
                  onChange={(e) => setBookingData({...bookingData, purpose: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                  placeholder="Es. Riunione team, corso, presentazione..."
                  required
                />
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  disabled={errors.time}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                    errors.time 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                  }`}
                >
                  Prenota
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
