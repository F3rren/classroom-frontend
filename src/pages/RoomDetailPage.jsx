import { useParams, useNavigate } from 'react-router-dom';
import SmartRoomDetail from '../components/Room/SmartRoomDetail';

export default function RoomDetailPage({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <SmartRoomDetail 
        roomId={roomId} 
        isAdmin={user?.role === 'admin' || user?.ruolo === 'admin'}
        onClose={() => navigate('/rooms')}
      />
    </div>
  );
}
