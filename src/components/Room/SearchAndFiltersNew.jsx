import React, { useState } from 'react';
import FiltersModal from './FiltersModal';

const SearchAndFilters = ({ 
  selectedCapacity, 
  onCapacityChange, 
  selectedFloor, 
  onFloorSelect, 
  rooms, 
  onQuickFilter,
  onAdvancedSearch,
  isAdvancedSearchActive,
  onResetToBasicView,
  filteredRoomsCount,
  totalRoomsCount
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                🎯 Filtri
              </button>
              <button
                onClick={onAdvancedSearch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                🔍 Ricerca Avanzata
              </button>
            </div>
          </div>
          
          {/* Indicatore ricerca avanzata attiva */}
          {isAdvancedSearchActive && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">⚡</span>
                <p className="text-blue-800 text-sm font-medium">
                  Ricerca avanzata attiva
                </p>
              </div>
              <button
                onClick={onResetToBasicView}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Annulla
              </button>
            </div>
          )}

          {/* Filtri attivi */}
          {!isAdvancedSearchActive && (selectedCapacity !== "all" || selectedFloor !== "all") && (
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

      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        selectedCapacity={selectedCapacity}
        onCapacityChange={onCapacityChange}
        selectedFloor={selectedFloor}
        onFloorSelect={onFloorSelect}
        rooms={rooms}
        onQuickFilter={onQuickFilter}
      />
    </>
  );
};

export default SearchAndFilters;
