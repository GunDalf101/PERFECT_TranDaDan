import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { axiosInstance } from '../../api/axiosInstance';
import Leaderboard from '../../components/Leaderboard/Leaderboard';

const GeneralDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/games/stats');
        setDashData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center p-8">Loading dashboard data...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!dashData) return <div className="text-center p-8">No data available</div>;

  const COLORS = ['#00D4FF', '#DC2626', '#9333EA', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] text-white font-retro p-8 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Matches:</span>
                <span className="text-neonPink">{dashData.overview.total_matches}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Matches:</span>
                <span className="text-neonPink">{dashData.overview.active_matches}</span>
              </div>
              <div className="flex justify-between">
                <span>Forfeit Rate:</span>
                <span className="text-neonPink">{dashData.overview.forfeit_rate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Game Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashData.game_distribution}
                  dataKey="count"
                  nameKey="game_type"
                  cx="50%"
                  cy="50%"
                  label
                >
                  {dashData.game_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Daily Matches</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashData.daily_trend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#00D4FF" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Hourly Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashData.hourly_activity}>
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00D4FF" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashData.player_metrics.top_players.map((player, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-neonPink">{player.winner__username}</span>
                  <span>{player.wins} wins</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Leaderboard />

        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-black bg-opacity-80 border-2 border-neonBlue shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-neonBlue">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neonBlue bg-opacity-20">
                    <th className="p-2">Game</th>
                    <th className="p-2">Player 1</th>
                    <th className="p-2">Player 2</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {dashData.recent_matches.map((match) => (
                    <tr key={match.id} className="border-t border-gray-700">
                      <td className="p-2 text-center">{match.game_type}</td>
                      <td className="p-2 text-center">{match.player1__username}</td>
                      <td className="p-2 text-center">{match.player2__username}</td>
                      <td className="p-2 text-center">
                        {match.score_player1} - {match.score_player2}
                      </td>
                      <td className="p-2 text-center text-neonPink">
                        {match.winner__username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeneralDashboard;