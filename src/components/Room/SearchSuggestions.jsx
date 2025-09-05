export default function SearchSuggestions({ onQuickFilter }) {
  const suggestions = [
    { 
      key: "small-meeting", 
      label: "Piccola Riunione", 
      icon: "👥", 
      criteria: { minCapacity: 4, maxCapacity: 10 },
      description: "4-10 persone"
    },
    { 
      key: "class", 
      label: "Lezione", 
      icon: "🎓", 
      criteria: { minCapacity: 20, maxCapacity: 40 },
      description: "20-40 persone"
    },
    { 
      key: "conference", 
      label: "Conferenza", 
      icon: "🏛️", 
      criteria: { minCapacity: 50 },
      description: "50+ persone"
    },
    { 
      key: "now", 
      label: "Disponibili Ora", 
      icon: "⚡", 
      criteria: { 
        status: "libera",
        date: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().slice(0, 5)
      },
      description: "Libere adesso"
    }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map(suggestion => (
        <button
          key={suggestion.key}
          onClick={() => onQuickFilter(suggestion.criteria)}
          className="group px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg 
                   hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 
                   transition-all duration-200 flex items-center gap-2"
        >
          <span className="text-sm">{suggestion.icon}</span>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-800 group-hover:text-blue-800">
              {suggestion.label}
            </div>
            <div className="text-xs text-gray-500 group-hover:text-blue-600">
              {suggestion.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
