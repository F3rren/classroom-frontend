import React, { useState } from 'react';
import CapacityFilter from './CapacityFilter';
import FloorSelector from './FloorSelector';
import SearchSuggestions from './SearchSuggestions';

const AdvancedFiltersModal = ({ 
  isOpen,
  onClose,
  selectedCapacity, 
  onCapacityChange, 
  selectedFloor, 
  onFloorSelect, 
  rooms, 
  onQuickFilter,
  availability,
  onAvailabilityChange
}) => {
  const [localFilters, setLocalFilters] = useState({
    capacity: selectedCapacity,
    floor: selectedFloor,
    availability: availability || 'all',
    timeRange: 'all',
    features: []
  });

  const [activeTab, setActiveTab] = useState('quick');

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    onCapacityChange(localFilters.capacity);
    onFloorSelect(localFilters.floor);
    onAvailabilityChange(localFilters.availability);
    // Qui potresti aggiungere logica per altri filtri
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      capacity: 'all',
      floor: 'all',
      availability: 'all',
      timeRange: 'all',
      features: []
    };
    setLocalFilters(resetFilters);
    onCapacityChange('all');
    onFloorSelect('all');
    onAvailabilityChange('all');
  };

  const tabs = [
    { id: 'quick', label: '⚡ Ricerca Rapida', icon: '🎯' },
    { id: 'basic', label: '🎛️ Filtri Base', icon: '📋' },
    { id: 'advanced', label: '🔧 Filtri Avanzati', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header del Modal */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Filtro Avanzato</h2>
                <p className="text-blue-100 text-sm">
                  Trova la stanza perfetta per le tue esigenze
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center hover:bg-opacity-30 transition"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex bg-white bg-opacity-10 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-white hover:bg-white hover:bg-opacity-20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenuto del Modal */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-240px)]">
          {/* Tab: Ricerca Rapida */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  🎯 Scenari Predefiniti
                </h3>
                <p className="text-gray-600">
                  Seleziona uno scenario comune per applicare automaticamente i filtri ottimali
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Esempi di scenari rapidi */}
                <button
                  onClick={() => {
                    onQuickFilter({ capacity: '1-5', floor: 0 });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-200 transition text-left"
                >
                  <div className="text-3xl mb-3">🧑‍💼</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Riunione Piccola</h4>
                  <p className="text-sm text-gray-600">1-5 persone, Piano Terra</p>
                </button>

                <button
                  onClick={() => {
                    onQuickFilter({ capacity: '6-10', floor: 1 });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-200 transition text-left"
                >
                  <div className="text-3xl mb-3">👥</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Team Meeting</h4>
                  <p className="text-sm text-gray-600">6-10 persone, Primo Piano</p>
                </button>

                <button
                  onClick={() => {
                    onQuickFilter({ capacity: '21-30', floor: 'all' });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-200 transition text-left"
                >
                  <div className="text-3xl mb-3">🎓</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Presentazione</h4>
                  <p className="text-sm text-gray-600">21-30 persone, Tutti i piani</p>
                </button>

                <button
                  onClick={() => {
                    onQuickFilter({ capacity: '50+', floor: 0 });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-amber-200 transition text-left"
                >
                  <div className="text-3xl mb-3">🎤</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Conferenza</h4>
                  <p className="text-sm text-gray-600">50+ persone, Piano Terra</p>
                </button>

                <button
                  onClick={() => {
                    onQuickFilter({ capacity: '11-20', floor: 2 });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-rose-50 to-pink-100 border border-rose-200 rounded-xl hover:from-rose-100 hover:to-pink-200 transition text-left"
                >
                  <div className="text-3xl mb-3">💻</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Workshop</h4>
                  <p className="text-sm text-gray-600">11-20 persone, Secondo Piano</p>
                </button>

                <button
                  onClick={() => {
                    onQuickFilter({ capacity: 'all', floor: 'all' });
                    onClose();
                  }}
                  className="p-6 bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-slate-200 transition text-left"
                >
                  <div className="text-3xl mb-3">🏢</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Tutte le Stanze</h4>
                  <p className="text-sm text-gray-600">Vedi tutte le opzioni</p>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Filtri Base */}
          {activeTab === 'basic' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  📋 Filtri Base
                </h3>
                <p className="text-gray-600">
                  Personalizza la ricerca con i filtri principali
                </p>
              </div>

              {/* Selettore Piano */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    🏢
                  </span>
                  Seleziona Piano
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Filtra le stanze per piano specifico
                </p>
                <FloorSelector 
                  selectedFloor={localFilters.floor}
                  onFloorSelect={(floor) => setLocalFilters({...localFilters, floor})}
                />
              </div>

              {/* Filtro Capacità */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    👥
                  </span>
                  Capacità Stanza
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  Scegli in base al numero di persone
                </p>
                <CapacityFilter 
                  selectedCapacity={localFilters.capacity}
                  onCapacityChange={(capacity) => setLocalFilters({...localFilters, capacity})}
                  rooms={rooms}
                />
              </div>
            </div>
          )}

          {/* Tab: Filtri Avanzati */}
          {activeTab === 'advanced' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  ⚙️ Filtri Avanzati
                </h3>
                <p className="text-gray-600">
                  Opzioni avanzate per una ricerca dettagliata
                </p>
              </div>

              {/* Disponibilità */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    ⏰
                  </span>
                  Disponibilità
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['all', 'available', 'occupied', 'blocked'].map((status) => (
                    <label
                      key={status}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        localFilters.availability === status
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="availability"
                        value={status}
                        checked={localFilters.availability === status}
                        onChange={(e) => setLocalFilters({...localFilters, availability: e.target.value})}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {status === 'all' ? '🏢' : 
                           status === 'available' ? '✅' :
                           status === 'occupied' ? '🔴' : '🚫'}
                        </div>
                        <div className="font-medium capitalize">
                          {status === 'all' ? 'Tutte' :
                           status === 'available' ? 'Disponibili' :
                           status === 'occupied' ? 'Occupate' : 'Bloccate'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fascia Oraria */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    🕐
                  </span>
                  Fascia Oraria Preferita
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { id: 'all', label: 'Tutto il giorno', icon: '🌅' },
                    { id: 'morning', label: 'Mattina (8-12)', icon: '🌅' },
                    { id: 'afternoon', label: 'Pomeriggio (12-18)', icon: '☀️' },
                    { id: 'evening', label: 'Sera (18-22)', icon: '🌆' }
                  ].map((time) => (
                    <label
                      key={time.id}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        localFilters.timeRange === time.id
                          ? 'border-amber-500 bg-amber-100'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="timeRange"
                        value={time.id}
                        checked={localFilters.timeRange === time.id}
                        onChange={(e) => setLocalFilters({...localFilters, timeRange: e.target.value})}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl mb-2">{time.icon}</div>
                        <div className="font-medium text-sm">{time.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 <strong>Suggerimento:</strong> Usa i filtri per trovare rapidamente la stanza ideale
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleResetFilters}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                🗑️ Reset
              </button>
              <button 
                onClick={handleApplyFilters}
                className="px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
              >
                ✅ Applica Filtri
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersModal;
