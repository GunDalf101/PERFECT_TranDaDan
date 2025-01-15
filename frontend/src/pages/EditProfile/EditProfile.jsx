import {getMyData, editMyData} from "../../api/authServiceMe";
import {qrMFAreq, disableMFAreq, enableMFA} from "../../api/mfaService"
import {myToast} from "../../lib/utils1"
import { useState, useEffect } from "react";
import { changeAvatarReq } from "../../api/avatarService";
import {useUser} from "../../components/auth/UserContext"
import { useNavigate } from 'react-router-dom';

function formatSerializerErrors(errors) {
  if (typeof errors === "string") return [errors];
  else if (Array.isArray(errors)) return errors;

  let errorsArr = [];

  for (const [field, messages] of Object.entries(errors)) {
    errorsArr = errorsArr.concat([...new Set(messages)]);
  }

  return errorsArr;
}

const EditProfile = () => {

  const { updateAvatar, user, login } = useUser();
  const parsedUser = user ? JSON.parse(user) : null;

  const [avatar, setAvatar] = useState({
    data: null,
    path: null
  });
  const navigate = useNavigate();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [userData, setUserData] = useState();
  const [reload, setReload] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    tournament_alias: "",
    password: "",
    password_confirmation: "",
  });
  useEffect(() => {
    if (parsedUser?.avatar_url) {
      // setAvatar({data: null, path: parsedUser.avatar_url});
      updateAvatar(parsedUser.avatar_url);
    }
  }, [ avatar]);

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const mydata = JSON.parse(user);
        setUserData(mydata)
        setFormData({
          username: mydata.username,
          email: mydata.email,
          tournament_alias: mydata.tournament_alias,
          password: "",
          password_confirmation: "",
        });
        setAvatar({data: null, path: mydata.avatar_url});
        updateAvatar(mydata.avatar_url);
        
        setIs2FAEnabled(mydata.mfa_enabled); // Assuming `mydata` contains a property `is2FAEnabled`
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [reload]); // Empty dependency array to run only on component mount


  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
      const newAvatarUrl = reader.result;
      setAvatar((prev) => ({...prev, data: newAvatarUrl}));
      // updateAvatar(newAvatarUrl); // Add this line to update the avatar in context
    };
    reader.readAsDataURL(file);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update global context for real-time changes
    if (name !== 'password' && name !== 'password_confirmation') {
      const updatedUser = {
        ...parsedUser,
        [name]: value
      };
      login(JSON.stringify(updatedUser));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.password_confirmation) {
      myToast(2, "Passwords do not match.");
      return;
    }

    try {
      if (avatar.data && avatar.data !== parsedUser?.avatar_url) {
        await changeAvatarReq(avatar.data);
      }

      // Prepare form data for profile update
      let updatedFormData = { ...formData };
      const keys = ["username", "email", "tournament_alias"];
      
      keys.forEach((key) => {
        if (updatedFormData[key] === "" || updatedFormData[key] === userData[key]) {
          delete updatedFormData[key];
        }
      });

      if (updatedFormData.password === "") {
        delete updatedFormData.password;
        delete updatedFormData.password_confirmation;
      }

      // Update profile data if there are changes
      if (Object.keys(updatedFormData).length > 0) {
        console.log(updatedFormData);
        await editMyData(updatedFormData);
      }

      // Fetch latest user data
      const newUserData = await getMyData();
      
      // Update global context
      const updatedUser = {
        ...newUserData,
        avatar_url: avatar.data || newUserData.avatar_url
      };
      
      // login(JSON.stringify(updatedUser));
      updateAvatar(updatedUser.avatar_url);
      
      setUserData(newUserData);
      setReload(!reload);
      myToast(0, "you profile has been updated.")
      setFormData({
        username: "",
        email: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage = error?.response?.data?.error || "An unexpected error occurred.";
      myToast(2, typeof errorMessage === 'string' ? errorMessage : "Failed to update profile");
      
      // Revert to server data on error
      const currentData = await getMyData();
      login(JSON.stringify(currentData));
      setFormData({
        username: currentData.username,
        email: currentData.email,
        tournament_alias: currentData.tournament_alias,
        password: "",
        password_confirmation: "",
      });
    }
  };
  const toggle2FA = async () => {
    try {
      if (is2FAEnabled) {
        await disableMFAreq(); // Replace with your API logic
        setIs2FAEnabled(false);
        myToast(2, "MFA has been disabled.")
      } else {
        // Logic to enable 2FA
        const qrImage = await qrMFAreq(); // Replace with your API logic to get the QR code
        setQrCode(qrImage);
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
    }
  };

  const handle2FAVerification = async () => {
    try {
      // Logic to verify the 2FA code
      await enableMFA(verificationCode); // Replace with your API call
        setIs2FAEnabled(true)
        myToast(0, "MFA has been enabled.")
        setQrCode(null)
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      myToast(2, "invalid code.")
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <div className="flex flex-col items-center mt-20 w-11/12 max-w-[600px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
        <h1 className="text-3xl text-neonPink mb-6">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col items-center relative group">
            <div className="relative w-32 h-32">
              <img
                src={ avatar.data || avatar.path || '/default_profile.webp' }
                alt="Profile Avatar"
                className="w-full h-full rounded-full border-4 border-neonPink object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center text-center justify-center bg-black bg-opacity-70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <span className="text-sm text-white">Upload New Avatar</span>
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="username" className="text-neonBlue">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="text-neonBlue">
              Email
            </label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="talias" className="text-neonBlue">
            Tournament Alias
            </label>
            <input
              type="text"
              id="tournament-alias"
              name="talias"
              value={formData.tournament_alias}
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-neonBlue">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              autoComplete="password"
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
              placeholder="Enter new password"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password_confirmation" className="text-neonBlue">
              Confirm Password
            </label>
            <input
              type="password"
              id="password_confirmation"
              name="password_confirmation"
              value={formData.password_confirmation}
              autoComplete="password_confirmation"
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-neonPink text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonPink hover:shadow-[0_0_15px_3px] transition-all"
          >
            Save Changes
          </button>

          <button
            type="button"
            onClick={toggle2FA}
            className={`mt-4 px-6 py-2 ${
              is2FAEnabled
                ? "bg-red-500 hover:shadow-[0_0_15px_3px] shadow-red-500"
                : "bg-neonBlue hover:shadow-[0_0_15px_3px] shadow-neonBlue"
            } text-black font-bold rounded-lg shadow-[0_0_10px_2px] transition-all`}
          >
            {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>

          {qrCode && (
            <div className="mt-4 flex flex-col items-center">
              <p className="text-neonPink text-center mb-2 ">
                Scan the QR code with your authenticator app:
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: qrCode }}
                className="qr-code-svg bg-white"
              />
              <input
                type="text"
                placeholder="Enter 2FA code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="mt-4 p-2 rounded bg-gray-800 text-white border border-gray-600"
              />
              <button
                type="button"
                onClick={handle2FAVerification}
                className="mt-2 px-6 py-2 bg-neonPink text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonPink hover:shadow-[0_0_15px_3px] transition-all"
              >
                Verify 2FA Code
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
