import styles from "./Profile.module.scss";
import { useState, useEffect } from "react";
import {getMyData} from "../../api/authServiceMe";
import getMatches from "../../api/gameService"
import { useNavigate } from 'react-router-dom';
import Loading from "../../components/Loading/Loading";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary components
ChartJS.register(ArcElement, Tooltip, Legend);


const data = {
  labels: [
    "win",
    "lose"
  ],
  datasets: [{
    label: 'win lose rate',
    data: [1, 1],
    backgroundColor: [
      'rgb(0 212 255)',
      'rgb(220 38 38)',
    ],
    borderColor: ['rgb(255 0 204)'], // Set border color for each slice
    borderWidth: 0, // Set border width
    hoverOffset: 3
  }]
};


const Profile = () => {
  const [mydata, setMyData] = useState(null);
  const [mymatches, setMymatches] = useState({
    pong: [],
    space: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const data = await getMyData();
        setMyData(data);
        const matches = await getMatches(data.id);
        // console.log(matches)
        setMymatches(matches)
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const statistics = {
    totalMatches: 10,
    wins: 7,
    losses: 3,
    winRate: "70%",
  };

  if (!mydata) return <Loading />

  return (
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      {/* Profile and Friends Section */}
      <div className="flex flex-wrap m-10 justify-between w-11/12 gap-4 mt-20">
        {/* User Box */}
        <div className="flex-1 min-w-[500px] h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <img
              src={mydata.avatar_url || '/default_profile.webp'}
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
            />
            {/* <h2 className="text-3xl text-center text-neonPink">username</h2> */}
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
              onClick={() => (navigate("/Profile/edit"))}
              className="mt-4 px-6 py-2 bg-neonPink text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonPink hover:shadow-[0_0_15px_3px] transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>


        {/* Friends Box */}
        <div className="flex-1 min-w-[500px] h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink overflow-y-auto">
          <h2 className="text-2xl text-center text-neonPink mb-4">Friends</h2>
          {mydata.friends && mydata.friends.length > 0 ? (
              <ul className="space-y-4">
                {mydata.friends.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    <img
                      src={friend.avatar_url || '/default_profile.webp'}
                      alt={`${friend.username}'s avatar`}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                    <a href="#" onClick={() => navigate(`/user/${friend.username}`)}><p className="text-lg text-white font-medium">{friend.username}</p></a>
                  </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400">No friends to display.</p>
          )}
        </div>
        {/* Match History Card */}
        <div className="flex-1 min-w-[500px] min-h-[500px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
        <p className="text-3xl text-center text-neonBlue mb-5">PingPong</p>
          <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
          <div className="overflow-x-auto h-72 overflow-y-auto">
          {mymatches.pong && mymatches.pong.length > 0 ? (
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
                {mymatches.pong.map((match) => (
                  <tr key={match.id} className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="p-2 border border-white">{match.id}</td>
                    <td className="p-2 border border-white">{match.opponent}</td>
                    <td className="p-2 border border-white">{match.result}</td>
                    <td className="p-2 border border-white">{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            ):(
              <p className="text-center text-gray-400">No matches to display.</p>
            )}
          </div>
        </div>

        {/* Match History Card */}
        <div className="flex-1 min-w-[500px] min-h-[500px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
          <p className="text-3xl text-center text-red-600 mb-5">SPACExRIVALRY</p>
          <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
          <div className="overflow-x-auto h-72 overflow-y-auto">
          {mymatches.space && mymatches.space.length > 0 ? (
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
                {mymatches.space.map((match) => (
                  <tr key={match.id} className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="p-2 border border-white">{match.id}</td>
                    <td className="p-2 border border-white">{match.opponent}</td>
                    <td className="p-2 border border-white">{match.result}</td>
                    <td className="p-2 border border-white">{match.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            ):(
              <p className="text-center text-gray-400">No matches to display.</p>
            )}
          </div>
        </div>
      </div>

      {/* Match History and Statistics Section */}
      <div className="flex flex-wrap justify-between w-11/12 gap-4">
        <div className="flex-1 min-w-[300px] max-w-[500px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        <h1 className="text-center text-2xl m-2"><span className="text-red-700">Lose</span> and <span className="text-neonBlue">Win</span> rate.</h1>
        <Pie className="text-xl" data={data}/>
        </div>
        <div className="flex-1 min-w-[300px] max-w-[500px] h-fit p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        <h1 className="text-center text-2xl m-2"><span className="text-red-700">Lose</span> and <span className="text-neonBlue">Win</span> rate.</h1>
        <Pie className="text-xl" data={data}/>
        </div>
      </div>
    </div>
  );
};

export default Profile;
