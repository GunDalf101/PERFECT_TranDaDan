import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NotFound from "../NotFound/NotFound";
import getUserData from "../../api/authServiceUser";
import {getMyData} from "../../api/authServiceMe"
import { sendFriendReq, cancelFriendReq, acceptFriendReq, unfriendReq} from "../../api/friendService";
import { blockUser, unblockUser } from "../../api/blockService";
import {getMatches, getDash} from "../../api/gameService";
import { useRealTime } from "../../context/RealTimeContext";
import {myToast} from "../../lib/utils1"
import { useNavigate } from 'react-router-dom';
import {MyLine, MyPie, UserLevelBox} from "../../components/user/dashboard"
import Loading from "../../components/Loading/Loading";

const r = {
  NONE: 0,
  YOU_REQUEST: 1,
  HE_REQUEST: 2,
  FRIENDS: 3,
  YOU_BLOCK: 4,
  HE_BLOCK: 5,
  BLOCK_BOTH: 6
};

const showUserContent = (relationship) => (
  !(relationship == r.YOU_BLOCK || relationship == r.HE_BLOCK || relationship == r.BLOCK_BOTH)
);

const User = () => {

  const navigate = useNavigate();

  const [userdata, setuserdata] = useState(null); // Store user data
  const [error, setError] = useState(false); // Handle errors
  const [reload, setReload] = useState(false); // State to trigger useEffect
  const [isAddHovering, setIsAddHovering] = useState(false); // State to manage hover
  const [isBlockHovering, setIsBlockHovering] = useState(false); // State to manage hover for block button
  const [userMatches, setUserMatches] = useState({
    pong: [],
    space: []
  });
  const { sendRelationshipUpdate, relationshipUpdate, onlineFriends, friends } = useRealTime();
  const { username } = useParams();
  const [dash, setDash] = useState();
  
  useEffect(() => {
    setReload(!reload);
  }, [relationshipUpdate, username, onlineFriends, friends]);

  // Fetch user data and friend request status
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mydata = await getMyData()
        const data = await getUserData(username);
        setuserdata(data);
        const matches = await getMatches(data.id)
        setUserMatches(matches)
        const dash_data = await getDash(data.id);
        setDash(dash_data);
        if(mydata.id == data.id)
            navigate("/profile");
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
      myToast(0, "friend request has been sent")
      sendRelationshipUpdate("sent_friend_request", username);
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
    setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleCancelReq = async () => {
    try {
        // if(username.relationship == r.HE_REQUEST)
        //   {
            await cancelFriendReq(username);
            setIsAddHovering(false);
            myToast(1, "friend request has been canceled")
            sendRelationshipUpdate("cancel_friend_request", username);
          // }
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
      setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleUnfriend = async () => {
    try {
        await unfriendReq(username);
        setIsAddHovering(false);
        myToast(2, "I'm sorry mi amori")
        sendRelationshipUpdate("unfriended", username);
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
      setReload(!reload); // Trigger the useEffect to refetch user data
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptFriendReq(username)
      myToast(1, "friend request has been accepted.")
      sendRelationshipUpdate("friends", username);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
    setReload(!reload);
  };

  const handleBlockUser = async () => {
    try {
      if (userdata.relationship == r.YOU_BLOCK || userdata.relationship == r.BLOCK_BOTH)
        {
          await unblockUser(username);
          myToast(0, "unblocked.")
          sendRelationshipUpdate("unblocked", username);
        }
        else
        {
          await blockUser(username);
          myToast(2, "blocked.")
          sendRelationshipUpdate("blocked", username);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
    setReload(!reload);
  };

  if (error) return <NotFound />;
  if (!userdata || !dash) return <Loading />;

  const statistics = {
    totalMatches: 10,
    wins: 7,
    losses: 3,
    winRate: "70%",
  };

  return(
    <div className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">
      <div className="flex flex-wrap m-10 justify-between w-11/12 gap-4 mt-20">
        {/* User Box */}
        <div className="flex-1 min-w-[500px] min-h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
          <div className="flex flex-col items-center relative">
            <img
              src={userdata.avatar_url || "/default_profile.webp"}
              alt="Profile"
              className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_20px_5px] shadow-neonPink mb-4"
            />
            {/* Status Dot */}
            <div
              className={`absolute top-1 right-1 w-4 h-4 rounded-full border-2 ${
                onlineFriends.includes(userdata.username) ? "bg-green-500" : "bg-gray-500"
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
           { userdata.relationship == r.FRIENDS ? (
            <button
              onClick={handleUnfriend} // Assuming this handler unfriends the user
              onMouseEnter={() => setIsAddHovering(true)}
              onMouseLeave={() => setIsAddHovering(false)}
              className="mt-4 px-6 py-2 rounded-lg  bg-neonPink text-xl font-bold transition-all duration-300 hover:bg-red-600 hover:text-white"
            >
              {isAddHovering ? "Unfriend" : "Friends"}
            </button>
            ) :
           userdata.relationship == r.HE_REQUEST ? (
             <button
               onClick={handleAcceptRequest}
               className="mt-4 px-6 py-2 bg-neonBlue text-black font-bold rounded-lg shadow-[0_0_10px_2px] shadow-neonBlue hover:bg-neonPink hover:text-white transition-all"
             >
               Accept Request
             </button>
             ) : userdata.relationship == r.NONE ? (
               // Add Friend Button
               <button
                 onClick={handleAddFriend}
                 onMouseEnter={() => setIsAddHovering(true)}
                 onMouseLeave={() => setIsAddHovering(false)}
                 className="items-center mt-4 px-6 py-2 rounded-lg text-xl font-bold transition-all duration-300 bg-neonBlue text-black hover:bg-neonPink hover:text-white flex"
               >
                 Add Friend
               </button>
             ) : userdata.relationship == r.YOU_REQUEST ? (
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
             {(userdata.relationship == r.YOU_BLOCK || userdata.relationship == r.BLOCK_BOTH) && isBlockHovering
               ? "Unblock"
               : (userdata.relationship == r.YOU_BLOCK || userdata.relationship == r.BLOCK_BOTH)
               ? "Blocked"
               : "Block"}
           </button>
          </div>
        </div>

        {showUserContent(userdata.relationship) ?(
        <UserLevelBox level={userdata.level} progress={userdata.xp_progress}/>
        ):""}

        {/* Friends Box */}
        {showUserContent(userdata.relationship) ?(
        <div className="flex-1 min-w-[500px] min-h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink overflow-y-auto">
          <h2 className="text-2xl text-center text-neonPink mb-4">Friends</h2>
          {userdata.friends && userdata.friends.length > 0 ? (
            <ul className="space-y-4">
              {userdata.friends.map((friend) => (
                <li
                key={friend.id}
                className="flex items-center justify-between gap-4 p-3 bg-gradient-to-r from-purple-700 via-pink-400 to-purple-700 rounded-lg border-2 border-neonPink shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={friend.avatar_url || '/default_profile.webp'}
                    alt={`${friend.username}'s avatar`}
                    className="w-12 h-12 rounded-full border-4 border-white shadow-[0_0_10px_2px] shadow-neonPink"
                  />
                  <a href="#" onClick={() => navigate(`/user/${friend.username}`)}>
                    <p className="text-lg text-white font-medium text-shadow-lg hover:text-neonPink transition-colors">
                      {friend.username}
                    </p>
                  </a>
                </div>
                <div className="text-lg font-bold text-white">
                  <span className="text-lg text-neonPink">Level </span>
                  <span className="text-xl text-neonBlue">{friend.level}</span>
                </div>
              </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-400">No friends to display.</p>
          )}
        </div>
        ):""}

        {/* Match History Card */}
        {showUserContent(userdata.relationship) ?(
        <div className="flex-1 min-w-[500px] min-h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
          <p className="text-3xl text-center text-neonBlue mb-5">PingPong</p>
          <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
          <div className="overflow-x-auto h-72 overflow-y-auto">
          {userMatches.pong && userMatches.pong.length > 0 ? (
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
                {userMatches.pong.map((match) => (
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
        ):""}
        {/* Match History Card */}
        {showUserContent(userdata.relationship) ? (
        <div className="flex-1 min-w-[500px] min-h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonPink shadow-[0_0_25px_5px] shadow-neonPink">
          <p className="text-3xl text-center text-red-600 mb-5">SPACExRIVALRY</p>
          <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
          <div className="overflow-x-auto h-72 overflow-y-auto">
          {userMatches.space && userMatches.space.length > 0 ? (
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
                {userMatches.space.map((match) => (
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
        ):""}
      </div>

      {/* Match History and Statistics Section */}
      {showUserContent(userdata.relationship) ?(
        <div className="flex flex-wrap justify-between w-11/12 gap-4 mb-4">
          <div className="flex-1 min-w-[500px] h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
            <p className="text-3xl text-center text-neonBlue mb-5">PingPong</p>
            <h1 className="text-center text-2xl m-2"><span className="text-red-700">Lose</span> and <span className="text-neonBlue">Win</span> rate.</h1>
            <div className="w-full h-[350px] flex items-center justify-center">
              <MyPie data={dash.pong}/>
            </div>
          </div>
          <div className="flex-1 min-w-[500px] h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
            <p className="text-3xl text-center text-red-600 mb-5">SPACExRIVALRY</p>
            <h1 className="text-center text-2xl m-2"><span className="text-red-700">Lose</span> and <span className="text-neonBlue">Win</span> rate.</h1>
            <div className="w-full h-[350px] flex items-center justify-center">
              <MyPie data={dash.space}/>
            </div>
          </div>
          <div className="flex-1 min-w-[500px] h-[500px] p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
            <h1 className="text-center text-2xl m-2"><span className="text-red-700">Lose</span> and <span className="text-neonBlue">Win</span> rate.</h1>
            <div className="w-full h-[350px] flex items-center justify-center">
            <MyLine data={dash}/>
            </div>
          </div>
        </div>
      ):""}
    </div>
  );
};

export default User;
