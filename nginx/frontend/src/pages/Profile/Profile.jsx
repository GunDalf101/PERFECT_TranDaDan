import { useState, useEffect } from "react";
import { getMyData } from "../../api/authServiceMe";
import { getMatches, getDash } from "../../api/gameService";
import { useNavigate } from 'react-router-dom';
import Loading from "../../components/Loading/Loading";
import { MyLine, MyPie, UserLevelBox } from "../../components/user/dashboard";
import { useRealTime } from "../../context/RealTimeContext";
import { myToast } from "../../lib/utils1";
import { motion } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const [mydata, setMyData] = useState(null);
  const [dash, setDash] = useState(null);
  const [mymatches, setMymatches] = useState(null);
  const { friends } = useRealTime();
  const [activeTab, setActiveTab] = useState('pong');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getMyData();
        setMyData(data);
        const matches = await getMatches(data.id);
        const dash_data = await getDash(data.id);
        setDash(dash_data);
        setMymatches(matches);
      } catch (error) {
        myToast(2, "Something went wrong.");
        navigate('/');
      }
    };

    fetchUserData();
  }, [friends, navigate]);

  if (!mydata || !mymatches || !dash) return <Loading />;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Utility function for match table
  const renderMatchTable = (matches) => {
    if (!matches || matches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400">No matches to display.</p>
          <button 
            onClick={() => navigate('/game-lobby')}
            className="mt-3 px-4 py-2 bg-gradient-to-r from-neonBlue to-blue-500 text-white rounded-md hover:shadow-lg hover:shadow-neonBlue/30 transition-all duration-300"
          >
            Play a game
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto h-72 overflow-y-auto scrollbar">
        <table className="w-full text-center text-white border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-neonBlue/90 to-purple-600/90 backdrop-blur-sm">
              <th className="p-2 border-b border-white/20">#</th>
              <th className="p-2 border-b border-white/20">Date</th>
              <th className="p-2 border-b border-white/20">Opponent</th>
              <th className="p-2 border-b border-white/20">Result</th>
              <th className="p-2 border-b border-white/20">Score</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => {
              const isWin = match.result.toLowerCase() === 'win';
              return (
                <motion.tr
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    ${index % 2 === 0 ? 'bg-black/40' : 'bg-black/20'} 
                    hover:bg-gradient-to-r hover:from-black/60 hover:to-purple-900/30 transition-colors duration-200
                  `}
                >
                  <td className="p-2 border-b border-white/10">{match.id}</td>
                  <td className="p-2 border-b border-white/10 text-gray-300">{match.end_date}</td>
                  <td className="p-2 border-b border-white/10">
                    <span 
                      className="font-medium cursor-pointer hover:text-neonBlue transition-colors duration-200"
                      onClick={() => navigate(`/user/${match.opponent}`)}
                    >
                      {match.opponent}
                    </span>
                  </td>
                  <td className={`p-2 border-b border-white/10 font-semibold ${isWin ? 'text-neonBlue' : 'text-neonPink'}`}>
                    {match.result}
                  </td>
                  <td className="p-2 border-b border-white/10">
                    <span className="px-3 py-1 rounded bg-black/40 border border-white/10">
                      {match.score}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-center min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] text-white font-retro"
    >
      {/* Background overlays */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none z-0"></div>
      <div className="fixed inset-0 bg-scanline opacity-5 pointer-events-none z-0"></div>
      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-600 opacity-10 blur-3xl rounded-full z-0"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-cyan-500 opacity-10 blur-3xl rounded-full z-0"></div>
      
      {/* Main content */}
      <div className="flex flex-wrap m-10 justify-between w-11/12 gap-6 mt-24 z-1">
        {/* Profile Card */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 min-w-[500px] h-auto p-6 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonBlue rounded-xl shadow-[0_0_15px_rgba(8,247,254,0.5)]"></div>
          
          <div className="relative z-10 flex flex-col items-center py-6">
            {/* Profile Image with glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-neonPink rounded-full blur-xl opacity-30 animate-pulse-slow"></div>
              <img
                src={mydata.avatar_url || '/default_profile.webp'}
                alt="Profile"
                className="relative w-36 h-36 rounded-full border-4 border-white object-cover z-10"
              />
            </div>
            
            {/* Username with glow */}
            <h2 className="text-4xl font-bold text-white mb-2 relative">
              <span className="relative z-10">{mydata.username}</span>
              <span className="absolute inset-0 text-neonBlue blur-sm z-0">{mydata.username}</span>
            </h2>
            
            <p className="text-center text-gray-300 mb-4">{mydata.email}</p>
            
            <button
              onClick={() => (navigate("/Profile/edit"))}
              className="mt-4 px-8 py-3 bg-gradient-to-r from-neonPink to-purple-600 text-white font-bold rounded-lg relative overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-neonPink to-purple-600 opacity-0 group-hover:opacity-70 blur-xl transition-opacity duration-500"></span>
              <span className="relative z-10 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </span>
            </button>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div variants={itemVariants}>
          <UserLevelBox progress={mydata.xp_progress} level={mydata.level} />
        </motion.div>

        {/* Friends List */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 min-w-[600px] h-auto relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonPink rounded-xl shadow-[0_0_15px_rgba(254,83,187,0.5)]"></div>
          
          <div className="relative z-10 p-6">
            <h2 className="text-2xl font-bold text-center mb-6 relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-purple-400">Friends</span>
              <span className="absolute inset-0 text-neonPink blur-sm z-0">Friends</span>
            </h2>
            
            <div className="max-h-96 overflow-y-auto pr-2 scrollbar">
              {mydata.friends && mydata.friends.length > 0 ? (
                <motion.ul 
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  {mydata.friends.map((friend, index) => (
                    <motion.li
                      key={friend.id}
                      variants={itemVariants}
                      className="relative group"
                    >
                      {/* Hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-neonPink/20 to-neonBlue/20 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 rounded-lg"></div>
                      
                      <div className="relative flex items-center justify-between p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 group-hover:border-neonPink/50 transition-all duration-300 z-10">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-neonPink to-purple-500 rounded-full blur-sm opacity-60 group-hover:animate-pulse-slow"></div>
                            <img
                              src={friend.avatar_url || '/default_profile.webp'}
                              alt={`${friend.username}'s avatar`}
                              className="relative w-12 h-12 rounded-full border-2 border-white object-cover z-10"
                            />
                          </div>
                          
                          <div>
                            <p 
                              className="text-lg font-medium text-white group-hover:text-neonPink transition-colors duration-300 cursor-pointer"
                              onClick={() => navigate(`/user/${friend.username}`)}
                            >
                              {friend.username}
                            </p>
                            {friend.tournament_alias && (
                              <p className="text-sm text-gray-400">
                                {friend.tournament_alias}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-right">
                            <div className="text-neonBlue font-bold">Level {friend.level}</div>
                            {friend.xp && (
                              <div className="text-gray-400 text-sm">{friend.xp.toLocaleString()} XP</div>
                            )}
                          </div>
                          
                          <div className="ml-4 text-neonPink opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-400">No friends to display.</p>
                  <button 
                    onClick={() => navigate('/friends')}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-neonPink to-purple-500 text-white rounded-md hover:shadow-lg hover:shadow-neonPink/30 transition-all duration-300"
                  >
                    Find Friends
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Game History Cards */}
        <motion.div variants={itemVariants} className="flex-1 min-w-[600px] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonPink rounded-xl shadow-[0_0_15px_rgba(254,83,187,0.5)]"></div>
          
          <div className="relative z-10 p-6">
            {/* Game Selector Tabs */}
            <div className="flex border-b border-white/20 mb-4">
              <button
                onClick={() => setActiveTab('pong')}
                className={`px-4 py-2 font-medium transition-all duration-300 ${
                  activeTab === 'pong' 
                    ? 'text-neonBlue border-b-2 border-neonBlue' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                PingPong
              </button>
              <button
                onClick={() => setActiveTab('space')}
                className={`px-4 py-2 font-medium transition-all duration-300 ${
                  activeTab === 'space' 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                SPACExRIVALRY
              </button>
            </div>
            
            {/* Game Title */}
            <p className={`text-3xl text-center mb-5 font-bold ${
              activeTab === 'pong' ? 'text-neonBlue' : 'text-red-600'
            }`}>
              {activeTab === 'pong' ? 'PingPong' : 'SPACExRIVALRY'}
            </p>
            
            <h2 className="text-2xl text-center text-neonPink mb-4">Match History</h2>
            
            {/* Match History Table - Conditionally rendered based on active tab */}
            {activeTab === 'pong' ? renderMatchTable(mymatches.pong) : renderMatchTable(mymatches.space)}
          </div>
        </motion.div>
      </div>

      {/* Statistics Section */}
      <div className="flex flex-wrap justify-between w-11/12 gap-6 mb-8 z-1">
        {/* PingPong Stats */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 min-w-[500px] h-[500px] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonBlue rounded-xl shadow-[0_0_15px_rgba(8,247,254,0.5)]"></div>
          
          <div className="relative z-10 p-6">
            <p className="text-3xl text-center text-neonBlue mb-5 font-bold">PingPong</p>
            <h1 className="text-center text-2xl mb-6">
              <span className="text-neonPink">Win</span> and <span className="text-neonBlue">Loss</span> Statistics
            </h1>
            <div className="w-full h-[350px] flex items-center justify-center">
              <MyPie data={dash.pong}/>
            </div>
          </div>
        </motion.div>
        
        {/* SPACExRIVALRY Stats */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 min-w-[500px] h-[500px] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonBlue rounded-xl shadow-[0_0_15px_rgba(8,247,254,0.5)]"></div>
          
          <div className="relative z-10 p-6">
            <p className="text-3xl text-center text-red-600 mb-5 font-bold">SPACExRIVALRY</p>
            <h1 className="text-center text-2xl mb-6">
              <span className="text-neonPink">Win</span> and <span className="text-neonBlue">Loss</span> Statistics
            </h1>
            <div className="w-full h-[350px] flex items-center justify-center">
              <MyPie data={dash.space}/>
            </div>
          </div>
        </motion.div>
        
        {/* Trend Chart */}
        <motion.div 
          variants={itemVariants}
          className="flex-1 min-w-[500px] h-[500px] relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black to-purple-950/80 rounded-xl"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl"></div>
          <div className="absolute inset-0 border-2 border-neonBlue rounded-xl shadow-[0_0_15px_rgba(8,247,254,0.5)]"></div>
          
          <div className="relative z-10 p-6">
            <h1 className="text-center text-2xl mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPink">
                Performance Trend
              </span>
            </h1>
            <div className="w-full h-[350px] flex items-center justify-center">
              <MyLine data={dash}/>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;