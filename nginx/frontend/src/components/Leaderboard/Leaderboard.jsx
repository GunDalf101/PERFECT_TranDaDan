import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { axiosInstance } from '../../api/axiosInstance';
import { motion } from 'framer-motion';

const Leaderboard = () => {
  const [rankings, setRankings] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/leaderboard');
        setRankings(response.data.top_users);
        setError(null);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setError('Failed to load rankings');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="relative bg-black bg-opacity-80 border-2 border-neonBlue rounded-lg p-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-neonBlue text-xl animate-pulse">Loading rankings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative bg-black bg-opacity-80 border-2 border-red-500 rounded-lg p-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-red-500 text-xl">{error}</div>
        </div>
      </div>
    );
  }

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

  return (
    <Card className="relative bg-gradient-to-br from-black to-purple-900 border-none shadow-xl overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      {/* Glow effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-neonBlue opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neonPink opacity-20 blur-3xl rounded-full"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="pb-2">
          <div className="glitch-container mb-2">
            <CardTitle className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPink pb-1">
              Top Players
            </CardTitle>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink rounded-full"></div>
        </CardHeader>
        
        <CardContent>
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {rankings?.map((user, index) => (
              <motion.div
                key={user.username}
                variants={itemVariants}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative flex items-center justify-between p-4 rounded-lg 
                  ${hoveredIndex === index 
                    ? 'bg-gradient-to-r from-blue-900/60 to-purple-900/60 shadow-lg shadow-neonBlue/20' 
                    : 'bg-black/40 backdrop-blur-sm'} 
                  hover:bg-gradient-to-r hover:from-blue-900/60 hover:to-purple-900/60
                  transition-all duration-300 overflow-hidden group`}
              >
                {/* Rank accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 
                  ${index === 0 ? 'bg-yellow-400' : 
                    index === 1 ? 'bg-gray-300' : 
                    index === 2 ? 'bg-amber-600' : 
                    'bg-neonBlue/70'}`}
                />
                
                {/* Player info */}
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full
                    ${index === 0 ? 'bg-yellow-400 text-black' : 
                      index === 1 ? 'bg-gray-300 text-black' : 
                      index === 2 ? 'bg-amber-600 text-black' : 
                      'bg-neonBlue/30 text-white'} 
                    font-bold text-lg`}>
                    {index + 1}
                  </div>
                  
                  <div className="relative">
                    <div className={`absolute inset-0 rounded-full 
                      ${hoveredIndex === index ? 'animate-pulse-slow' : ''} 
                      ${index < 3 ? 'border-2 border-neonPink/70' : 'border border-neonBlue/50'}`} 
                    />
                    <img
                      src={user.avatar_url || '/default_profile.webp'}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                  </div>
                  
                  <div>
                    <div className="text-white font-bold group-hover:text-neonBlue transition-colors duration-300">
                      {user.username}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {user.tournament_alias}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-neonBlue font-bold group-hover:text-neonPink transition-colors duration-300">
                      Level {user.level}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {user.xp.toLocaleString()} XP
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="text-neonBlue opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </div>
    </Card>
  );
};

export default Leaderboard;