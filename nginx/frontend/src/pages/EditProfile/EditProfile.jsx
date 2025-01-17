import {getMyData, editMyData} from "../../api/authServiceMe";
import {qrMFAreq, disableMFAreq, enableMFA} from "../../api/mfaService"
import {myToast} from "../../lib/utils1"
import { useState, useEffect } from "react";
import { changeAvatarReq } from "../../api/avatarService";
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../components/auth/UserContext";
import {useRealTime} from "../../context/RealTimeContext"

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

  const navigate = useNavigate();
  const {triggerRefetchUser} = useUser();

  const [avatar, setAvatar] = useState({
    data: null,
    path: null
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [userData, setUserData] = useState();
  const [formData, setFormData] = useState({
    email: "",
    tournament_alias: "",
    password: "",
    password_confirmation: "",
  });

  const {sendUserUpdate} = useRealTime();

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const mydata = await getMyData();
        setUserData(mydata)
        setFormData({
          email: mydata.email,
          tournament_alias: mydata.tournament_alias,
          password: "",
          password_confirmation: "",
        });
        setAvatar({data: null, path: mydata.avatar_url});
        setIs2FAEnabled(mydata.mfa_enabled);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);


  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar((prev) => ({...prev, data: reader.result}));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.password_confirmation) {
      myToast(2, "Passwords do not match.");
      return;
    }
    try {
      let keys = ["email", "tournament_alias"];
      keys.forEach((key) => {
        if (formData[key] == "" || formData[key] === userData[key]) {
          delete formData[key];
        }
      });
      if(formData["password"] == "")
        delete formData["password"], delete formData["password_confirmation"]
      if(Object.keys(formData).length == 0 && avatar.data == null)
      {
        myToast(1, "nothing has been updated !");
        return;
      }
      else if(avatar.data != null)
      {
        const new_avatar = await changeAvatarReq(avatar.data);
      } else if (Object.keys(formData).length > 0)
        await editMyData(formData);
      myToast(0, "you profile has been updated.");
      sendUserUpdate();
      triggerRefetchUser();
      navigate("/profile");
    } catch (error) {
      let errors = formatSerializerErrors(error.response.data['error']);
      for (let e of errors) myToast(2, e);
    }
  };
  const toggle2FA = async () => {
    try {
      if (is2FAEnabled) {
        await disableMFAreq();
        setIs2FAEnabled(false);
        myToast(2, "MFA has been disabled.")
      } else {
        const qrImage = await qrMFAreq();
        setQrCode(qrImage);
      }
    } catch (error) {
      myToast(2, "can't toggle MFA.")
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
            <label htmlFor="tournament_alias" className="text-neonBlue">
            Tournament Alias
            </label>
            <input
              type="text"
              id="tournament_alias"
              name="tournament_alias"
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
