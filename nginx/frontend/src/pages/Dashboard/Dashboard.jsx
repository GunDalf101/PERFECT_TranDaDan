import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { axiosInstance } from '../../api/axiosInstance';
import Leaderboard from '../../components/Leaderboard/Leaderboard';

const GeneralDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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

  if (loading) return (
    <div className="min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] flex items-center justify-center">
      <div className="text-4xl font-bold text-neonBlue animate-pulse tracking-widest">
        LOADING DATA...
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] flex items-center justify-center">
      <div className="text-4xl font-bold text-red-500 tracking-widest">{error}</div>
    </div>
  );
  
  if (!dashData) return (
    <div className="min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] flex items-center justify-center">
      <div className="text-4xl font-bold text-neonBlue tracking-widest">NO DATA AVAILABLE</div>
    </div>
  );

  // Enhanced color palette with more vibrant neon colors
  const COLORS = ['#00FFFF', '#FF00FF', '#FE53BB', '#08F7FE', '#F5D300'];
  const CHART_LINE_COLOR = '#08F7FE';
  const CHART_BAR_COLOR = '#FE53BB';

  // Custom tooltip styles for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-neonBlue px-4 py-2 rounded-md">
          <p className="text-neonBlue">{`${payload[0].name || label || 'N/A'}`}</p>
          <p className="text-neonPink font-bold">{`${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-[url('/retro_1.jpeg')] text-white font-retro pr-4 pl-4 md:pr-8 md:pl-8 pt-24 relative z-0">
      {/* Overlay with grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none z-0"></div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-scanline opacity-10 pointer-events-none z-0"></div>
      
      {/* Glowing orbs for atmosphere */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-purple-600 opacity-20 blur-3xl rounded-full z-0"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-500 opacity-20 blur-3xl rounded-full z-0"></div>
      
      {/* Dashboard title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue via-neonPurple to-neonPink tracking-widest mb-2">
          ARCADE DASHBOARD
        </h1>
        <div className="h-1 w-48 md:w-96 mx-auto bg-gradient-to-r from-neonBlue to-neonPink rounded-full"></div>
      </div>
      
      {/* Dashboard content */}
      <div className="relative z-10">
        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatsCard 
            title="Total Matches" 
            value={dashData.overview.total_matches}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
            }
            color="from-blue-500 to-cyan-400"
          />
          
          <StatsCard 
            title="Active Matches" 
            value={dashData.overview.active_matches}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            }
            color="from-fuchsia-500 to-pink-500"
          />
          
          <StatsCard 
            title="Forfeit Rate" 
            value={`${dashData.overview.forfeit_rate.toFixed(1)}%`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            }
            color="from-orange-500 to-amber-400"
          />
        </div>

        {/* Main dashboard sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Game Distribution Card */}
          <ChartCard title="Game Distribution">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dashData.game_distribution}
                  dataKey="count"
                  nameKey="game_type"
                  cx="50%"
                  cy="50%"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="#111"
                >
                  {dashData.game_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />} 
                  formatter={(value, name, props) => [value, props.payload.game_type]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Daily Matches Card */}
          <ChartCard title="Daily Matches">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dashData.daily_trend}>
                <defs>
                  <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#08F7FE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#08F7FE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#FFF" tick={{ fill: '#FFF' }} />
                <YAxis stroke="#FFF" tick={{ fill: '#FFF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={CHART_LINE_COLOR}
                  strokeWidth={3}
                  dot={{ fill: CHART_LINE_COLOR, r: 6, strokeWidth: 1, stroke: '#000' }}
                  activeDot={{ r: 8, stroke: CHART_LINE_COLOR, strokeWidth: 2 }}
                  fill="url(#colorLine)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hourly Activity Card */}
          <ChartCard title="Hourly Activity">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dashData.hourly_activity}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FE53BB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FE53BB" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#FFF" tick={{ fill: '#FFF' }} />
                <YAxis stroke="#FFF" tick={{ fill: '#FFF' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="url(#colorBar)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top Players Card */}
          <ChartCard title="Top Players">
            <div className="space-y-4 px-2 py-4">
              {dashData.player_metrics.top_players.map((player, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 rounded-lg bg-black/30 border border-neonBlue/20 hover:border-neonBlue/60 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full
                      ${index === 0 ? 'bg-yellow-400 text-black' : 
                        index === 1 ? 'bg-gray-300 text-black' : 
                        index === 2 ? 'bg-amber-600 text-black' : 
                        'bg-neonBlue/30 text-white'}`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-neonPink group-hover:text-white transition-colors duration-300">
                      {player.winner__username}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white opacity-80 group-hover:text-neonBlue transition-colors duration-300">
                      {player.wins} wins
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Leaderboard component */}
          <div className="col-span-1 md:col-span-2">
            <Leaderboard />
          </div>
        </div>

        {/* Recent Matches Section */}
        <div className="mt-6">
          <Card className="relative bg-gradient-to-br from-black to-purple-900/80 border-none shadow-xl overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            
            {/* Glow effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-neonBlue opacity-20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neonPink opacity-20 blur-3xl rounded-full"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPink pb-1">
                  Recent Matches
                </CardTitle>
                <div className="h-1 w-full bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink rounded-full"></div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-neonBlue/20 to-neonPink/20">
                        <th className="p-3 text-left">Game</th>
                        <th className="p-3 text-left">Player 1</th>
                        <th className="p-3 text-left">Player 2</th>
                        <th className="p-3 text-center">Score</th>
                        <th className="p-3 text-right">Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashData.recent_matches.map((match, index) => (
                        <tr 
                          key={match.id} 
                          className={`border-b border-white/10 hover:bg-white/5 transition-colors duration-200
                            ${index % 2 === 0 ? 'bg-black/20' : 'bg-black/10'}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full mr-2" 
                                style={{ 
                                  backgroundColor: COLORS[match.game_type.charCodeAt(0) % COLORS.length] 
                                }}
                              ></div>
                              {match.game_type}
                            </div>
                          </td>
                          <td className="p-3">{match.player1__username}</td>
                          <td className="p-3">{match.player2__username}</td>
                          <td className="p-3 text-center">
                            <span className="px-3 py-1 rounded bg-black/40 border border-white/10">
                              <span className="text-neonBlue">{match.score_player1}</span>
                              <span className="mx-1">-</span>
                              <span className="text-neonPink">{match.score_player2}</span>
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPink">
                              {match.winner__username}
                            </span>
                            <span className="ml-2 inline-block">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 inline" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.11L21 6.89l-8.38-.38L10 0 7.38 6.51l-8.38.38 5.21 5" />
                              </svg>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="relative group">
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-neonBlue to-neonPink opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
      
      <div className="relative bg-black bg-opacity-80 rounded-xl overflow-hidden h-full z-10 border border-white/10 group-hover:border-neonBlue/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br opacity-30 rounded-full blur-xl transition-all duration-500 group-hover:opacity-60"
          style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`, '--tw-gradient-from': 'rgb(59 130 246)', '--tw-gradient-to': 'rgb(236 72 153)' }}
        ></div>
        
        <div className="flex items-center p-6">
          <div className={`flex items-center justify-center w-14 h-14 rounded-lg mr-4 bg-gradient-to-br ${color} text-white`}>
            {icon}
          </div>
          
          <div>
            <h3 className="text-gray-400 text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-white mt-1 group-hover:text-neonBlue transition-colors duration-300">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chart Card Component
const ChartCard = ({ title, children }) => {
  return (
    <Card className="relative bg-gradient-to-br from-black to-purple-900/80 border-none shadow-xl overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      
      {/* Glow effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-neonBlue opacity-10 blur-3xl rounded-full"></div>
      
      {/* Content */}
      <div className="relative z-10">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPink pb-1">
            {title}
          </CardTitle>
          <div className="h-1 w-full bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink rounded-full"></div>
        </CardHeader>
        
        <CardContent>
          {children}
        </CardContent>
      </div>
    </Card>
  );
};

export default GeneralDashboard;
