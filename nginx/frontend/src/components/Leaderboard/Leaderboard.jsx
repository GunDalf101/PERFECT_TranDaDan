import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { axiosInstance } from '../../api/axiosInstance';

const Leaderboard = () => {
  const [rankings, setRankings] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    return <div className="text-center p-8">Loading rankings...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-neonBlue">Top Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankings?.map((user, index) => (
            <div
              key={user.username}
              className="flex items-center justify-between p-4 rounded-lg bg-opacity-40 bg-gray-800 hover:bg-opacity-60 transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="text-neonPink font-bold w-8">{index + 1}</div>
                <img
                  src={user.avatar_url || '/default_profile.webp'}
                  alt={user.username}
                  className="w-10 h-10 rounded-full border-2 border-neonBlue"
                />
                <div>
                  <div className="text-white font-bold">{user.username}</div>
                  <div className="text-gray-400 text-sm">{user.tournament_alias}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-neonBlue font-bold">Level {user.level}</div>
                  <div className="text-gray-400 text-sm">{user.xp.toLocaleString()} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
