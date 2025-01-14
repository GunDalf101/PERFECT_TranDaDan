import React, { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, X, Check } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useInvite } from '../../chatContext/InviteContext';
export const InviteUI = () => {
  const { invites, notification, sendInvite, acceptInvite, declineInvite, setNotification } = useInvite();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (sendInvite(targetUsername)) {
      setTargetUsername('');
      setShowInviteForm(false);
    }
  };

  return (
    <div className="fixed right-4 top-4 z-50">
      {notification && (
        <Alert className={`mb-4 ${notification.type === 'error' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          <AlertTitle>{notification.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

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
export default InviteUI;