import styles from "./Profile.module.scss";
import Navbar from "../../components/Navbar/Logged";
import { useState, useEffect } from "react";
import getMyData from "../../api/authServiceMe";

const Profile = () => {
  const [mydata, setMyData] = useState(null);

  // Local test friend list
  const friends = [
    { id: 1, username: "Friend1", avatar: "https://via.placeholder.com/40?text=F1" },
    { id: 2, username: "Friend2", avatar: "https://via.placeholder.com/40?text=F2" },
    { id: 3, username: "Friend3", avatar: "https://via.placeholder.com/40?text=F3" },
    { id: 4, username: "Friend4", avatar: "https://via.placeholder.com/40?text=F4" },
  ];

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const data = await getMyData();
        setMyData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        window.location.href = "/login";
      }
    };

    fetchUserData();
  }, []);

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

  if (!mydata) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />

      {/* Profile and Friends Section */}
      <div className="flex flex-wrap m-10 justify-between w-11/12 gap-4 mt-20">
        {/* User Box */}
        <div className="flex-1 min-w-[300px] h-[400px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <img
              src="https://media.licdn.com/dms/image/v2/D4E03AQHoy7si-hZGzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723469726527?e=1740614400&v=beta&t=yUwzZJlP32P8gwYyIVh4vivqMCCeIiJw5xpYa0IYjDU"
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
            />
            <h2 className="text-3xl text-center text-neonPink">username</h2>
            <p
              className="text-center text-3xl text-gray-200 mt-4"
              style={{ textShadow: "1px 1px 5px rgb(0, 0, 0)" }}
            >
              {mydata.username}
            </p>
            <p className="text-center text-neonBlue mt-2 text-xl">
              {mydata.email}
            </p>

            {/* Edit Profile Button */}
            <button
              onClick={() => (window.location.href = "/Profile/edit")}
              className="mt-4 px-6 py-2 bg-neonPink text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonPink hover:shadow-[0_0_15px_3px] transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Friends Box */}
        <div className="flex-1 min-w-[300px] h-[400px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink overflow-y-auto">
          <h2 className="text-2xl text-center text-neonPink mb-4">Friends</h2>
          {friends && friends.length > 0 ? (
            <ul className="space-y-4">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <img
                    src={friend.avatar}
                    alt={`${friend.username}'s avatar`}
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                  <p className="text-lg text-white font-medium">{friend.username}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400">No friends to display.</p>
          )}
        </div>
      </div>

      {/* Match History and Statistics Section */}
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
