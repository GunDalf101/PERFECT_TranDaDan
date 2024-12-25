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

  const matchHistory = [
    { id: 1, opponent: "Player1", result: "Win", score: "3-1" },
    { id: 2, opponent: "Player2", result: "Loss", score: "1-3" },
    { id: 3, opponent: "Player3", result: "Win", score: "2-0" },
    { id: 4, opponent: "Player3", result: "Win", score: "2-9" },
    { id: 5, opponent: "Player3", result: "Win", score: "3-0" },
  ];

  const statistics = {
    totalMatches: 10,
    wins: 7,
    losses: 3,
    winRate: "70%",
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />

      {/* Profile Card */}
      <div className="w-11/12 h-fit m-4 mt-20 p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        {/* Profile Image */}
        <div className="flex flex-col items-center">
          <img
            src="https://media.licdn.com/dms/image/v2/D4E03AQHoy7si-hZGzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723469726527?e=1740614400&v=beta&t=yUwzZJlP32P8gwYyIVh4vivqMCCeIiJw5xpYa0IYjDU"
            alt="Profile"
            className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
          />
          <h2 className="text-3xl text-center text-neonPink">{Profile.fullname}</h2>
          {/* Display Username */}
          <p className="text-center text-3xl text-gray-200 mt-4" style={{ textShadow: "1px 1px 5px rgb(0, 0, 0)" }}>
            {Profile.username}
          </p>
          {/* Display Email */}
          <p className="text-center text-neonBlue mt-2 text-xl">
            {Profile.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between w-11/12 gap-4">
        {/* Match History Card */}
        <div className="flex-1 min-w-[300px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
          <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-white border-collapse">
              <thead>
                <tr className="bg-neonBlue text-black">
                  <th className="p-2 border border-white">#</th>
                  <th className="p-2 border border-white">Opponent</th>
                  <th className="p-2 border border-white">Result</th>
                  <th className="p-2 border border-white">Score</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((match) => (
                  <tr key={match.id} className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="p-2 border border-white">{match.id}</td>
                    <td className="p-2 border border-white">{match.opponent}</td>
                    <td className="p-2 border border-white">{match.result}</td>
                    <td className="p-2 border border-white">{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="flex-1 min-w-[300px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
          <h2 className="text-2xl text-center text-neonBlue mb-4">Game Statistics</h2>
          <ul className="text-center text-white">
            <li className="mb-2">
              <strong>Total Matches:</strong> {statistics.totalMatches}
            </li>
            <li className="mb-2">
              <strong>Wins:</strong> {statistics.wins}
            </li>
            <li className="mb-2">
              <strong>Losses:</strong> {statistics.losses}
            </li>
            <li>
              <strong>Win Rate:</strong> {statistics.winRate}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
