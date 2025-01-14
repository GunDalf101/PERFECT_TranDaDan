import React, { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, X, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const InviteSystem = ({ username }) => {
  const [invites, setInvites] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [notification, setNotification] = useState(null);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/invites/?username=${username}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Invite WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'game_invite':
        setInvites(prev => [...prev, data]);
        break;
      case 'invite_accepted':
        const gameSession = localStorage.setItem('gameSession', JSON.stringify({
          gameId: data.game_id,
          username: username,
          opponent: data.opponent,
          isPlayer1: username === data.player1
        }));
        setTimeout(() => {
              navigate('/game-lobby/remote-play', {
                state: gameSession
            });
          }, 3000);
        break;
      case 'invite_declined':
        setNotification({
          type: 'error',
          message: `${data.by_username} declined your invitation`
        });
        break;
      case 'invite_error':
        setNotification({
          type: 'error',
          message: data.message
        });
        break;
      case 'invite_sent':
        setNotification({
          type: 'success',
          message: `Invite sent to ${data.target_username}`
        });
        setShowInviteForm(false);
        break;
    }
  };

  const sendInvite = (e) => {
    e.preventDefault();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'send_invite',
        target_username: targetUsername,
        game_type: 'standard'
      }));
      setTargetUsername('');
    }
  };

  const acceptInvite = (invite) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'accept_invite',
        from_username: invite.from_username,
        game_type: invite.game_type
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
    }
  };

  const declineInvite = (invite) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'decline_invite',
        from_username: invite.from_username
      }));
      setInvites(prev => prev.filter(i => i.from_username !== invite.from_username));
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      {/* Notification Alert */}
      {notification && (
        <Alert className={`mb-4 ${notification.type === 'error' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          <AlertTitle>{notification.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Invite Button */}
      <button
        onClick={() => setShowInviteForm(!showInviteForm)}
        className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600 transition-colors"
      >
        <UserPlus size={24} />
      </button>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="absolute right-0 top-12 bg-white p-4 rounded-lg shadow-lg w-64">
          <form onSubmit={sendInvite} className="space-y-4">
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder="Username to invite..."
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Send Invite
            </button>
          </form>
        </div>
      )}

      {/* Incoming Invites */}
      {invites.length > 0 && (
        <div className="absolute right-0 top-12 bg-white p-4 rounded-lg shadow-lg w-64 mt-2">
          <h3 className="font-semibold mb-2">Game Invites</h3>
          {invites.map((invite, index) => (
            <div key={index} className="border-b last:border-b-0 py-2">
              <p className="text-sm mb-2">Invite from {invite.from_username}</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => acceptInvite(invite)}
                  className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => declineInvite(invite)}
                  className="p-1 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InviteSystem;