import React from 'react';
import CapacityFilter from './CapacityFilter';
import FloorSelector from './FloorSelector';
import SearchSuggestions from './SearchSuggestions';

const FiltersModal = ({ 
  isOpen,
  onClose,
  selectedCapacity, 
  onCapacityChange, 
  selectedFloor, 
  onFloorSelect, 
  rooms, 
  onQuickFilter
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Filtri e Ricerca</h2>
                <p className="text-blue-100 text-sm">Personalizza la tua ricerca</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center hover:bg-opacity-30 transition"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Contenuto del Modal */}
        <div className="p-6 space-y-8">
          {/* Ricerca Rapida */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                ⚡
              </span>
              Ricerca Rapida
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Seleziona uno scenario predefinito per trovare rapidamente la stanza ideale
            </p>
            <SearchSuggestions onQuickFilter={(criteria) => {
              onQuickFilter(criteria);
              onClose();
            }} />
          </div>

          {/* Divisore */}
          <div className="border-t border-gray-200"></div>

          {/* Selettore Piano */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                🏢
              </span>
              Seleziona Piano
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Filtra le stanze per piano specifico o visualizza tutti i piani
            </p>
            <FloorSelector 
              selectedFloor={selectedFloor}
              onFloorSelect={onFloorSelect}
            />
          </div>

          {/* Divisore */}
          <div className="border-t border-gray-200"></div>

          {/* Filtro Capacità */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                👥
              </span>
              Filtra per Capacità
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Trova stanze in base al numero di persone che devono ospitare
            </p>
            <CapacityFilter 
              selectedCapacity={selectedCapacity}
              onCapacityChange={onCapacityChange}
              rooms={rooms}
            />
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Usa i filtri per personalizzare la ricerca delle stanze
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  onCapacityChange("all");
                  onFloorSelect("all");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                🗑️ Reset Filtri
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Applica Filtri
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;
