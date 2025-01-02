import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Logged";
import NotFound from "../NotFound/NotFound";
import getUserData from "../../api/authServiceUser";
import {sendFriendReq, cancelFriendReq} from "../../api/friendService";

const User = () => {
  const [mydata, setMyData] = useState(null); // Store user data
  const [error, setError] = useState(false); // Handle errors
  const [friendRequestText, setFriendRequestText] = useState("Add Friend"); // Default button state
  const { username } = useParams();
  const [reload, setReload] = useState(false); // State to trigger useEffect
  const [isHovering, setIsHovering] = useState(false); // State to manage hover

  // Fetch user data and friend request status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserData(username);
        setMyData(data);

        // Set friend request status based on fetched data
        if (data.relationship === 1) {
          setFriendRequestText("Request Sent");
        } else {
          setFriendRequestText("Add Friend");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(true);
      }
    };

    fetchUserData();
  }, [username, reload]); // Add reload dependency

  // Handle sending a friend request
  const handleAddFriend = async () => {
    try {
      if(mydata.relationship == 0)
        await sendFriendReq(username);
      else if(mydata.relationship == 1)
        await cancelFriendReq(username)
        
      setReload(!reload); // Trigger the useEffect to refetch user data
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  if (error) return <NotFound />;
  if (!mydata) return <div>Loading...</div>; // Show loading state while fetching data

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
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />
      {/* Profile Card */}
      <div className="w-11/12 h-fit m-4 mt-20 p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        <div className="flex flex-col items-center">
          <img
            src="https://media.licdn.com/dms/image/v2/D4E03AQHoy7si-hZGzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723469726527?e=1740614400&v=beta&t=yUwzZJlP32P8gwYyIVh4vivqMCCeIiJw5xpYa0IYjDU"
            alt="Profile"
            className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
          />
          <h2 className="text-3xl text-center text-neonPink">zaba</h2>
          {/* Display Username */}
          <p className="text-center text-3xl text-gray-200 mt-4" style={{ textShadow: "1px 1px 5px rgb(0, 0, 0)" }}>
            {mydata.username}
          </p>
          {/* Display Email */}
          <p className="text-center text-neonBlue mt-2 text-xl">{mydata.email}</p>
          {/* Add Friend Button */}
          <button
            onClick={handleAddFriend}
            onMouseEnter={() => {
              if (mydata.relationship == 1) setIsHovering(true);
            }}
            onMouseLeave={() => setIsHovering(false)}
            className={`mt-4 px-6 py-2 rounded-lg text-xl font-bold transition-all duration-300 ${
              (mydata.relationship == 0)
                ? "bg-neonBlue text-black hover:bg-neonPink hover:text-white"
                : (isHovering && mydata.relationship == 1)
                ? "bg-neonBlue text-black hover:bg-red-600 hover:text-white"
                : "bg-gray-500 text-white cursor-not-allowed"
            }`}
          >
            {mydata.relationship == 0
              ? "Add Friend"
              : isHovering && mydata.relationship == 1
              ? "Cancel Request"
              : "Request is sent"}
          </button>
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

export default User;