import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useInvite } from '../../chatContext/InviteContext';

export const InviteUI = () => {
  const { invites, notification, sendInvite, acceptInvite, declineInvite, setNotification } = useInvite();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');

  React.useEffect(() => {
    if (notification) {
      toast[notification.type === 'error' ? 'error' : 'success'](notification.message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      setNotification(null);
    }
  }, [notification, setNotification]);

  React.useEffect(() => {
    const latestInvite = invites[invites.length - 1];
    
    if (latestInvite) {
      toast(
        <div className="min-w-[200px]">
          <p className="text-sm mb-2">Invite from {latestInvite.from_username}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                acceptInvite(latestInvite);
                toast.dismiss();
              }}
              className="p-1 rounded bg-green-500 text-white hover:bg-green-600"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                declineInvite(latestInvite);
                toast.dismiss();
              }}
              className="p-1 rounded bg-red-500 text-white hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          closeButton: true,
          toastId: `invite-${latestInvite.from_username}` // Prevent duplicate toasts
        }
      );
    }
  }, [invites, acceptInvite, declineInvite]);

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (sendInvite(targetUsername)) {
      setTargetUsername('');
      setShowInviteForm(false);
    }
  };


  return (
    <>
    </>
  );
};
export default InviteUI;