import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import RoomsList from './RoomsList';
import MyBookings from './MyBookings';
import WeeklyCalendar from './WeeklyCalendar';

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const userResult = await getCurrentUser();
      if (userResult && userResult.success) {
        // User loaded successfully
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'calendar', 
      label: 'Calendario Settimanale', 
      description: 'Vista calendario per prenotazioni rapide'
    },
    { 
      id: 'rooms', 
      label: 'Cerca Stanze', 
      description: 'Visualizza e prenota le stanze disponibili'
    },
    { 
      id: 'mybookings', 
      label: 'Le mie prenotazioni', 
      description: 'Gestisci le tue prenotazioni'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'calendar' && <WeeklyCalendar />}
        {activeTab === 'rooms' && <RoomsList />}
        {activeTab === 'mybookings' && <MyBookings />}
      </div>
    </div>
  );
};

export default BookingsPage;
