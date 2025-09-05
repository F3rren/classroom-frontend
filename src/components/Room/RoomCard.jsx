import { getStatusColor, getCapacityIcon, getCapacityLabel } from "../../utils/roomUtils";

export default function RoomCard({ room, onRoomClick }) {
  return (
    <button
      onClick={() => onRoomClick(room)}
      className={`
        ${getStatusColor(room.status)}
        p-4 rounded-lg border-2 text-white font-semibold
        transform transition-all duration-200 hover:scale-105 shadow-lg
        relative
      `}
    >
      <div className="text-center">
        <div className="text-lg font-bold">{room.id}</div>
        <div className="text-xs mt-1">{room.name}</div>
        {room.capacity && (
          <div className="mt-2 text-xs opacity-90">
            <div className="flex items-center justify-center gap-1">
              <span>{getCapacityIcon(room.capacity)}</span>
              <span>{room.capacity}</span>
            </div>
            <div className="text-xs opacity-75 mt-1">
              {getCapacityLabel(room.capacity)}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
