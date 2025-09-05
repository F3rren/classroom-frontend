import React from 'react';

const FloorHeader = ({ floor, roomCount }) => {
  const getFloorInfo = (floor) => {
    switch(floor) {
      case 0: 
        return { 
          icon: '🏛️', 
          name: 'Piano Terra', 
          description: 'Servizi e sale comuni',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        };
      case 1: 
        return { 
          icon: '1️⃣', 
          name: 'Primo Piano', 
          description: 'Aule standard e uffici amministrativi',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        };
      case 2: 
        return { 
          icon: '2️⃣', 
          name: 'Secondo Piano', 
          description: 'Aule specializzate e laboratori',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 3: 
        return { 
          icon: '3️⃣', 
          name: 'Terzo Piano', 
          description: 'Aule magistrali e sale conferenze',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800'
        };
      case 4: 
        return { 
          icon: '4️⃣', 
          name: 'Quarto Piano', 
          description: 'Dipartimenti e uffici docenti',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      default: 
        return { 
          icon: '🏢', 
          name: `Piano ${floor}`, 
          description: '',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const floorInfo = getFloorInfo(floor);

  return (
    <div className={`${floorInfo.bgColor} ${floorInfo.borderColor} border-l-4 p-4 mb-4 rounded-r-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{floorInfo.icon}</span>
          <div>
            <h3 className={`font-semibold text-lg ${floorInfo.textColor}`}>
              {floorInfo.name}
            </h3>
            {floorInfo.description && (
              <p className={`text-sm opacity-80 ${floorInfo.textColor}`}>
                {floorInfo.description}
              </p>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${floorInfo.bgColor} ${floorInfo.borderColor} border ${floorInfo.textColor} text-sm font-medium`}>
          {roomCount} {roomCount === 1 ? 'stanza' : 'stanze'}
        </div>
      </div>
    </div>
  );
};

export default FloorHeader;
