import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Logged";
import NotFound from "../NotFound/NotFound";
import getUserData from "../../api/authServiceUser";
import getMyData from "../../api/authServiceMe"
import { sendFriendReq, cancelFriendReq, acceptFriendReq, unfriendReq} from "../../api/friendService";
import { blockUser, unblockUser } from "../../api/blockService";
import { toast } from 'react-toastify';
import getMatches from "../../api/gameService";

function isBlocked(r)
{
  return r == 4 || r == 6;
}

const User = () => {
  const [userdata, setuserdata] = useState(null); // Store user data
  const [error, setError] = useState(false); // Handle errors
  const [reload, setReload] = useState(false); // State to trigger useEffect
  const [isAddHovering, setIsAddHovering] = useState(false); // State to manage hover
  const [isBlockHovering, setIsBlockHovering] = useState(false); // State to manage hover for block button
  const [userMatches, setUserMatches] = useState(null);

  const { username } = useParams();

  // Fetch user data and friend request status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mydata = await getMyData()
        const data = await getUserData(username);
        setuserdata(data);
        const matches = await getMatches(data.id)
        setUserMatches(matches)
        if(mydata.id == data.id)
            window.location.href = "/profile"
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(true);
      }
    };

    fetchUserData();
  }, [reload]); // Add reload dependency

  // Handle sending/canceling a friend request
  const handleAddFriend = async () => {
    try {
      await sendFriendReq(username);
      setIsAddHovering(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
    setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleCancelReq = async () => {
    try {
        await cancelFriendReq(username);
        setIsAddHovering(false);
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
      setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleUnfriend = async () => {
    try {
        await unfriendReq(username);
        setIsAddHovering(false);
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
      setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptFriendReq(username)
      console.log("Friend request accepted");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
    setReload(!reload);
  };

  const handleBlockUser = async () => {
    try {
      if (userdata.relationship == 4)
        {
          await unblockUser(username);
          toast.error({
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          });
        }
      else
      {
        await blockUser(username);
        window.location.href = '/'
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
    setReload(!reload);
  };

  if (error) return <NotFound />;
  if (!userdata) return <div>Loading...</div>; // Show loading state while fetching data

  const statistics = {
    totalMatches: 10,
    wins: 7,
    losses: 3,
    winRate: "70%",
  };

  return(
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <Navbar />

      <div className="flex flex-wrap m-10 justify-between w-11/12 gap-4 mt-20">
        {/* User Box */}
        <div className="flex-1 min-w-[300px] h-[460px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
          <div className="flex flex-col items-center relative">
            <img
              src="https://media.licdn.com/dms/image/v2/D4E03AQHoy7si-hZGzQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1723469726527?e=1740614400&v=beta&t=yUwzZJlP32P8gwYyIVh4vivqMCCeIiJw5xpYa0IYjDU"
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
            />
            {/* Status Dot */}
            <div
              className={`absolute top-1 right-1 w-4 h-4 rounded-full border-2 ${
                userdata.isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
              title={userdata.isOnline ? "Online" : "Offline"} // Tooltip for accessibility
            ></div>
          </div>
            <h2 className="text-3xl text-center text-neonPink">username</h2>
            <p
              className="text-center text-3xl text-gray-200 mt-4"
              style={{ textShadow: "1px 1px 5px rgb(0, 0, 0)" }}
            >
              {userdata.username}
            </p>
            <p className="text-center text-neonBlue mt-2 text-xl">
              {userdata.email}
            </p>

            {/* Friend Request Button */}
           { userdata.relationship == 3 ? (
            <button
              onClick={handleUnfriend} // Assuming this handler unfriends the user
              onMouseEnter={() => setIsAddHovering(true)}
              onMouseLeave={() => setIsAddHovering(false)}
              className="mt-4 px-6 py-2 rounded-lg text-green-500 text-xl font-bold transition-all duration-300 bg-transparent border-green-500 border-2 hover:bg-red-600 hover:text-white hover:border-none"
            >
              {isAddHovering ? "Unfriend" : "Friends"}
            </button>
            ) :
           userdata.relationship == 2 ? (
             <button
               onClick={handleAcceptRequest}
               className="mt-4 px-6 py-2 bg-neonBlue text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonBlue hover:bg-neonPink hover:text-white transition-all"
             >
               Accept Request
             </button>
             ) : userdata.relationship == 0 ? (
               // Add Friend Button
               <button
                 onClick={handleAddFriend}
                 onMouseEnter={() => setIsAddHovering(true)}
                 onMouseLeave={() => setIsAddHovering(false)}
                 className="items-center mt-4 px-6 py-2 rounded-lg text-xl font-bold transition-all duration-300 bg-neonBlue text-black hover:bg-neonPink hover:text-white flex"
               >
                 Add Friend
               </button>
             ) : userdata.relationship == 1 ? (
               // Cancel Request Button
               <button
                 onClick={handleCancelReq} // Assuming the same handler cancels the request
                 onMouseEnter={() => setIsAddHovering(true)}
                 onMouseLeave={() => setIsAddHovering(false)}
                 className="mt-4 px-6 py-2 rounded-lg text-xl font-bold transition-all duration-300 hover:bg-red-600 text-white bg-gray-500"
               >
                 {isAddHovering ? "Cancel Request" : "Request sent"}
               </button>
             ) : null}

           {/* Block Button */}
           <button
             onClick={handleBlockUser}
             onMouseEnter={() => setIsBlockHovering(true)}
             onMouseLeave={() => setIsBlockHovering(false)}
             className={`mt-4 px-6 py-2 rounded-lg text-xl font-bold transition-all duration-300 ${
               !isBlockHovering
                 ? "bg-red-600 text-white hover:bg-gray-800"
                 : "bg-gray-500 text-white"
             }`}
           >
             {userdata.relationship == 4 && isBlockHovering
               ? "Unblock"
               : userdata.relationship == 4
               ? "Blocked"
               : "Block"}
           </button>
          </div>
        </div>

        {/* Friends Box */}
        <div className="flex-1 min-w-[300px] h-[460px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink overflow-y-auto">
          <h2 className="text-2xl text-center text-neonPink mb-4">Friends</h2>
          {userdata.friends && userdata.friends.length > 0 ? (
            <ul className="space-y-4">
              {userdata.friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <img
                    src={friend.avatar}
                    alt={`${friend.username}'s avatar`}
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                  <a href={friend.username}><p className="text-lg text-white font-medium">{friend.username}</p></a>
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
          {userMatches && userMatches.length > 0 ? (
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
                {userMatches.map((match) => (
                  <tr key={match.id} className="odd:bg-gray-800 even:bg-gray-700">
                    <td className="p-2 border border-white">{match.id}</td>
                    <td className="p-2 border border-white">{match.p1}</td>
                    <td className="p-2 border border-white">{match.result}</td>
                    <td className="p-2 border border-white">{match.score1 + "-" + match.score2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            ):(
              <p className="text-center text-gray-400">No matches to display.</p>
            )}
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
