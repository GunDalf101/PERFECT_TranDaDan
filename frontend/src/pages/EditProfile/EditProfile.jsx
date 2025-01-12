import styles from "./EditProfile.module.scss";
import Navbar from "../../components/Navbar/Logged";
import getMyData from "../../api/authServiceMe";
import {qrMFAreq, disableMFAreq, enableMFA} from "../../api/mfaService"
import {myToast} from "../../lib/utils1"
import { useState, useEffect } from "react";


const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: "/default_profile.webp",
    password: "",
    confirmPassword: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mydata = await getMyData();
        setFormData((prev) => ({ ...prev, ...mydata }));
        setIs2FAEnabled(mydata.mfa_enabled); // Assuming `mydata` contains a property `is2FAEnabled`
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array to run only on component mount



  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, avatar: reader.result })); // Update the avatar state with the file preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    try {
      await updateProfileData(formData); // Replace with actual API call
    } catch (error) {
      console.error("zaba")
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
      const isValid = await enableMFA(verificationCode); // Replace with your API call
      if (isValid) {
        alert("2FA setup is complete!");
        setSuccessMessage("2FA setup is complete!");
        setIs2FAEnabled(true)
        myToast(0, "MFA has been enabled.")
        setQrCode(null)
      } else {
        myToast(2, "invalid code.")
      }
    } catch (error) {
      console.error("Error verifying 2FA code:", error);
      alert("Failed to verify 2FA code. Please try again.");
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
                src={
                  formData.avatar ||
                  "https://via.placeholder.com/150?text=Your+Avatar"
                } // Default avatar if none is set
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
                accept="image/*"
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
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="text-neonBlue">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
              required
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
            <label htmlFor="confirmPassword" className="text-neonBlue">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="p-2 rounded bg-gray-800 text-white border border-gray-600"
              placeholder="Confirm new password"
            />
          </div>

          {passwordError && (
            <p className="text-red-500">{passwordError}</p>
          )}

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