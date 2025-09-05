import React from 'react';

const FloorSelector = ({ selectedFloor, onFloorSelect }) => {
  const floors = [
    { id: 0, name: "Piano Terra", icon: "🏛️", shortName: "PT" },
    { id: 1, name: "Primo Piano", icon: "1️⃣", shortName: "1°P" },
    { id: 2, name: "Secondo Piano", icon: "2️⃣", shortName: "2°P" },
    { id: 3, name: "Terzo Piano", icon: "3️⃣", shortName: "3°P" },
    { id: 4, name: "Quarto Piano", icon: "4️⃣", shortName: "4°P" }
  ];

  const allFloors = { id: 'all', name: "Tutti i Piani", icon: "🏢", shortName: "Tutti" };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Opzione "Tutti i Piani" */}
      <button
        onClick={() => onFloorSelect('all')}
        className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
          selectedFloor === 'all'
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <span className="text-sm">{allFloors.icon}</span>
        <span className="text-sm font-medium">{allFloors.shortName}</span>
      </button>

      {/* Piani specifici */}
      {floors.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onFloorSelect(floor.id)}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
            selectedFloor === floor.id
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-sm">{floor.icon}</span>
          <span className="text-sm font-medium">{floor.shortName}</span>
        </button>
      ))}
    </div>
  );
};

export default FloorSelector;
