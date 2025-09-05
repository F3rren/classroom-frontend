export default function CapacityFilter({ selectedCapacity, onCapacityChange, rooms }) {
  const capacityRanges = [
    { key: "all", label: "Tutte le capienze", icon: "🏢", min: 0, max: Infinity },
    { key: "1-5", label: "1-5 persone", icon: "👤", min: 1, max: 5 },
    { key: "6-10", label: "6-10 persone", icon: "👥", min: 6, max: 10 },
    { key: "11-20", label: "11-20 persone", icon: "👥👥", min: 11, max: 20 },
    { key: "21-30", label: "21-30 persone", icon: "🏢", min: 21, max: 30 },
    { key: "31-50", label: "31-50 persone", icon: "🏛️", min: 31, max: 50 },
    { key: "50+", label: "50+ persone", icon: "🏟️", min: 51, max: Infinity }
  ];

  const getCountForRange = (min, max) => {
    return rooms.filter(room => room.capacity >= min && room.capacity <= max).length;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        👥 Filtra per Capienza
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
        {capacityRanges.map(range => {
          const count = range.key === "all" ? rooms.length : getCountForRange(range.min, range.max);
          const isActive = selectedCapacity === range.key;
          
          return (
            <button
              key={range.key}
              onClick={() => onCapacityChange(range.key)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-center
                ${isActive 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <div className="text-lg mb-1">{range.icon}</div>
              <div className="text-xs font-medium">{range.label}</div>
              <div className="text-xs text-gray-500 mt-1">({count})</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
