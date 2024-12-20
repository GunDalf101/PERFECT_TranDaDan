import React from "react";
import styles from "./Profile.module.scss";
import alogo from "../../assets/image/42_Logo.png";
import Navbar from "../../components/Navbar/Logged";
import { Link } from "react-router-dom";

const Profile = () => {
  const Profile = {
    username: "serhouni",
    fullname: "Soufiane Erhouni",
    email: "sou2000far@gmail.com",
  };

  return (
    <div className="flex min-h-screen bg-cover bg-center bg-[url('retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />
      {/* Profile Card */}
      <div className="w-full h-fit m-11 mt-24 p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <img
            src="https://cdn.intra.42.fr/users/3ec9394f6d15992f667e33ff247e7368/serhouni.jpg"
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
          />
          <h2 className="text-xl text-center text-neonPink">{Profile.fullname}</h2>
          {/* Display Username */}
          <p className="text-center text-8xl text-gray-200 mt-4 font-levi" style={{textShadow: "1px 1px 5px rgb(0, 0, 0)"}}>
            {Profile.username}
          </p>
          {/* Display Email */}
          <p className="text-center text-sm text-neonBlue mt-2">
            <strong>Email:</strong> {Profile.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;