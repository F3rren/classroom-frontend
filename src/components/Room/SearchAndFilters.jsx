import React, { useState } from 'react';
import AdvancedFiltersModal from './AdvancedFiltersModal';

const SearchAndFilters = ({ 
  selectedCapacity, 
  onCapacityChange, 
  selectedFloor, 
  onFloorSelect, 
  rooms, 
  onQuickFilter,
  filteredRoomsCount,
  availability,
  onAvailabilityChange
}) => {
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">🏢 Prenotazione Aule</h2>
                <p className="text-sm text-gray-600">
                  {filteredRoomsCount} stanze disponibili
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFiltersModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition text-sm font-medium flex items-center gap-2"
              >
                🔍 Filtro Avanzato
              </button>
            </div>
          </div>
          
          {(selectedCapacity !== "all" || selectedFloor !== "all") && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCapacity !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Capacità: {selectedCapacity}
                  <button 
                    onClick={() => onCapacityChange("all")}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedFloor !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Piano: {selectedFloor === 0 ? 'Terra' : selectedFloor}
                  <button 
                    onClick={() => onFloorSelect("all")}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <AdvancedFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        selectedCapacity={selectedCapacity}
        onCapacityChange={onCapacityChange}
        selectedFloor={selectedFloor}
        onFloorSelect={onFloorSelect}
        rooms={rooms}
        onQuickFilter={onQuickFilter}
        availability={availability}
        onAvailabilityChange={onAvailabilityChange}
      />
    </>
  );
};

export default SearchAndFilters;
