import styles from "./EditProfile.module.scss";
import Navbar from "../../components/Navbar/Logged";
import getMyData from "../../api/authServiceMe";
import { useState, useEffect } from "react";

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: "wgfgsfg",
    email: "sgfdgsfg",
    avatar: "", // URL or image file preview
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mydata = await getMyData()
        setFormData(mydata)
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []); // Add reload dependency

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
    try {
      await updateProfileData(formData);
      setSuccessMessage("Profile updated successfully!");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Failed to update profile. Please try again.");
      setSuccessMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />

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

          <button
            type="submit"
            className="mt-4 px-6 py-2 bg-neonPink text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonPink hover:shadow-[0_0_15px_3px] transition-all"
          >
            Save Changes
          </button>
        </form>

        {successMessage && (
          <p className="mt-4 text-green-500">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-4 text-red-500">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default EditProfile;