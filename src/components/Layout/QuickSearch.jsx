import { useState } from "react";

export default function QuickSearch({ onOpenAdvancedSearch }) {
  const [quickCapacity, setQuickCapacity] = useState("");

  const handleQuickSearch = (e) => {
    e.preventDefault();
    // Questa funzionalità può essere estesa per fare ricerche rapide
    if (quickCapacity) {
      // Per ora apre la ricerca avanzata con pre-compilato
      onOpenAdvancedSearch({ minCapacity: quickCapacity });
    } else {
      onOpenAdvancedSearch();
    }
  };

  return (
    <div className="hidden lg:flex items-center space-x-2">
      <form onSubmit={handleQuickSearch} className="flex items-center space-x-2">
        <input
          type="number"
          min="1"
          placeholder="Posti..."
          value={quickCapacity}
          onChange={(e) => setQuickCapacity(e.target.value)}
          className="px-3 py-1 text-sm border border-blue-300 rounded bg-blue-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 w-20"
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition"
          title="Ricerca Avanzata"
        >
          🔍
        </button>
      </form>
    </div>
  );
}
