export default function RoomLegend() {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Piantina Aule</h3>
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded border"></div>
          <span>Libera</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded border"></div>
          <span>Prenotata</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded border animate-pulse"></div>
          <span>In Uso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded border"></div>
          <span>Bloccata</span>
        </div>
      </div>
    </div>
  );
}
