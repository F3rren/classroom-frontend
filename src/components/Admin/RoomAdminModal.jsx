import { useState } from "react";

export default function RoomAdminModal({ room, isEditing, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: room?.name || "",
    capacity: room?.capacity || "",
    floor: room?.floor || 0,
    type: room?.type || "standard",
    features: room?.features || []
  });
  
  const [errors, setErrors] = useState({});

  const roomTypes = [
    { value: "standard", label: "Standard" },
    { value: "conferenza", label: "Sala Conferenze" },
    { value: "laboratorio", label: "Laboratorio" },
    { value: "aula-magna", label: "Aula Magna" },
    { value: "studio", label: "Sala Studio" }
  ];

  const availableFeatures = [
    "Wi-Fi",
    "Proiettore",
    "Lavagna",
    "PC",
    "Audio",
    "Video",
    "Aria condizionata",
    "Microfono",
    "Webcam"
  ];

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome stanza obbligatorio";
    }
    
    if (!formData.capacity || formData.capacity < 1 || formData.capacity > 200) {
      newErrors.capacity = "Capacità deve essere tra 1 e 200";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const roomData = {
      id: room?.id,
      name: formData.name.trim(),
      capacity: parseInt(formData.capacity),
      floor: parseInt(formData.floor),
      type: formData.type,
      features: formData.features
    };
    
    onSave(roomData, isEditing);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            {isEditing ? "Modifica Stanza" : "Nuova Stanza"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nome Stanza *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="es. Aula A-101"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Capacità *
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Numero posti"
            />
            {errors.capacity && (
              <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Piano
            </label>
            <select
              value={formData.floor}
              onChange={(e) => setFormData({...formData, floor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Piano Terra</option>
              <option value={1}>Primo Piano</option>
              <option value={2}>Secondo Piano</option>
              <option value={3}>Terzo Piano</option>
              <option value={4}>Quarto Piano</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo Stanza
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Caratteristiche
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableFeatures.map(feature => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              {isEditing ? "Salva Modifiche" : "Crea Stanza"}
            </button>
          </div>
        </form>

        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
