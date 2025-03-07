import { Pie, Line } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  CategoryScale,
  Filler
);

export const MyPie = ({data}) => {
  const [chartLoaded, setChartLoaded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    // Animation effect when component mounts
    const timer = setTimeout(() => {
      setChartLoaded(true);
    }, 300);
    
    // Track window size for responsive adjustments
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (data.t_win === 0 && data.t_lose === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm rounded-xl border border-neonBlue/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400 text-lg sm:text-xl">No match data available</p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">Play some games to see your stats</p>
        </div>
      </div>
    );
  }

  const totalGames = data.t_win + data.t_lose;
  const winRate = Math.round((data.t_win / totalGames) * 100);
  
  // Adjust font sizes based on screen size
  const legendFontSize = windowWidth < 640 ? 8 : windowWidth < 768 ? 10 : 12;
  const tooltipTitleFontSize = windowWidth < 640 ? 10 : 13;
  const tooltipBodyFontSize = windowWidth < 640 ? 9 : 12;
  
  const stat = {
    labels: ['Win', 'Lose'],
    datasets: [
      {
        label: 'Win/Lose Rate',
        data: [data.t_win, data.t_lose],
        backgroundColor: [
          'rgba(8, 247, 254, 0.8)',  // Neon blue
          'rgba(254, 83, 187, 0.8)'  // Neon pink
        ],
        borderColor: [
          'rgba(8, 247, 254, 1)',
          'rgba(254, 83, 187, 1)'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          'rgba(8, 247, 254, 1)',
          'rgba(254, 83, 187, 1)'
        ],
        hoverBorderColor: '#fff',
        hoverBorderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: "'Press Start 2P', system-ui",
            size: legendFontSize
          },
          color: '#ffffff',
          boxWidth: windowWidth < 640 ? 10 : 15,
          padding: windowWidth < 640 ? 10 : 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          family: "'Press Start 2P', system-ui",
          size: tooltipTitleFontSize
        },
        bodyFont: {
          family: "'Press Start 2P', system-ui",
          size: tooltipBodyFontSize
        },
        padding: windowWidth < 640 ? 8 : 12,
        cornerRadius: 8,
        bodyColor: '#fff',
        titleColor: '#08F7FE',
        borderColor: '#08F7FE',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const percentage = Math.round((value / totalGames) * 100);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
          size: windowWidth < 640 ? 10 : 13
        },
        formatter: (value, ctx) => {
          const percentage = Math.round((value / totalGames) * 100);
          return `${percentage}%`;
        }
      }
    },
    cutout: windowWidth < 640 ? '45%' : '50%',
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1500,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className={`relative w-full h-full transition-opacity duration-500 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">{winRate}%</div>
          <div className="text-xs sm:text-sm text-gray-300">Win Rate</div>
        </div>
      </div>
      <Pie data={stat} options={options} />
    </div>
  );
};

export const MyLine = ({data}) => {
  const [chartLoaded, setChartLoaded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    // Animation effect when component mounts
    const timer = setTimeout(() => {
      setChartLoaded(true);
    }, 300);
    
    // Track window size for responsive adjustments
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Adjust options based on screen size
  const fontSizeY = windowWidth < 640 ? 7 : windowWidth < 768 ? 8 : 10;
  const fontSizeX = windowWidth < 640 ? 7 : windowWidth < 768 ? 8 : 10;
  const legendFontSize = windowWidth < 640 ? 7 : windowWidth < 768 ? 8 : 10;
  const pointRadius = windowWidth < 640 ? 3 : 5;
  const pointHoverRadius = windowWidth < 640 ? 5 : 7;
  const borderWidth = windowWidth < 640 ? 2 : 3;
  
  // On mobile, limit the number of labels displayed to prevent overcrowding
  let displayedLabels = [...data.days];
  let displayedWins = [...data.wins];
  let displayedLoses = [...data.loses];
  
  if (windowWidth < 640 && data.days.length > 7) {
    // If more than 7 data points on mobile, show only every other label
    displayedLabels = data.days.filter((_, index) => index % 2 === 0);
    displayedWins = data.wins.filter((_, index) => index % 2 === 0);
    displayedLoses = data.loses.filter((_, index) => index % 2 === 0);
  }

  const stat = {
    labels: windowWidth < 640 ? displayedLabels : data.days,
    datasets: [
      {
        label: 'Wins',
        data: windowWidth < 640 ? displayedWins : data.wins,
        borderColor: 'rgba(8, 247, 254, 1)',  // Neon blue
        backgroundColor: 'rgba(8, 247, 254, 0.2)',
        borderWidth: borderWidth,
        pointRadius: pointRadius,
        pointBackgroundColor: 'rgba(8, 247, 254, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: borderWidth - 1,
        pointHoverRadius: pointHoverRadius,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(8, 247, 254, 1)',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Loses',
        data: windowWidth < 640 ? displayedLoses : data.loses,
        borderColor: 'rgba(254, 83, 187, 1)',  // Neon pink
        backgroundColor: 'rgba(254, 83, 187, 0.2)',
        borderWidth: borderWidth,
        pointRadius: pointRadius,
        pointBackgroundColor: 'rgba(254, 83, 187, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: borderWidth - 1,
        pointHoverRadius: pointHoverRadius,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(254, 83, 187, 1)',
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: true
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderDash: [5, 5],
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'Press Start 2P', system-ui",
            size: fontSizeY
          },
          padding: windowWidth < 640 ? 5 : 10,
          // On small screens, limit the number of Y-axis ticks
          maxTicksLimit: windowWidth < 640 ? 5 : undefined,
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderDash: [5, 5],
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'Press Start 2P', system-ui",
            size: fontSizeX
          },
          padding: windowWidth < 640 ? 5 : 10,
          // Adjust rotation on small screens to prevent label overlap
          maxRotation: windowWidth < 640 ? 45 : 0,
          minRotation: windowWidth < 640 ? 45 : 0,
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: windowWidth < 640 ? 10 : 15,
          boxHeight: windowWidth < 640 ? 10 : 15,
          padding: windowWidth < 640 ? 8 : 15,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          color: '#ffffff',
          font: {
            family: "'Press Start 2P', system-ui",
            size: legendFontSize
          },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: {
          family: "'Press Start 2P', system-ui",
          size: windowWidth < 640 ? 9 : 12
        },
        bodyFont: {
          family: "'Press Start 2P', system-ui",
          size: windowWidth < 640 ? 8 : 11
        },
        padding: windowWidth < 640 ? 8 : 12,
        cornerRadius: 6,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: function(context) {
          const index = context.datasetIndex;
          return index === 0 ? 'rgba(8, 247, 254, 1)' : 'rgba(254, 83, 187, 1)';
        },
        borderWidth: 2,
        displayColors: true,
        boxWidth: windowWidth < 640 ? 8 : 10,
        boxHeight: windowWidth < 640 ? 8 : 10,
        usePointStyle: true,
        callbacks: {
          labelColor: function(context) {
            const color = context.datasetIndex === 0 ? 'rgba(8, 247, 254, 1)' : 'rgba(254, 83, 187, 1)';
            return {
              borderColor: color,
              backgroundColor: color
            };
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        borderWidth: borderWidth
      }
    }
  };

  return (
    <div className={`relative w-full h-full transition-opacity duration-500 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
      <Line data={stat} options={options} />
    </div>
  );
};

export const UserLevelBox = ({ level, progress }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Animation effect when component mounts
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Calculate level details
  const nextLevel = level + 1;
  const glowIntensity = isHovered ? 'lg' : 'md';
  const progressBarWidth = isAnimated ? `${progress}%` : '0%';

  return (
    <div
      className={`relative w-full max-w-xs p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-500 transform ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black to-purple-950"></div>
      
      {/* Background grid */}
      <div className="absolute inset-0 rounded-2xl bg-[url('/grid.svg')] opacity-10"></div>
      
      {/* Animated glow effect */}
      <div className={`absolute inset-0 rounded-2xl blur-${glowIntensity} bg-gradient-to-br from-neonBlue/20 via-purple-800/20 to-neonPink/20 transition-all duration-300 ${isHovered ? 'opacity-40' : 'opacity-20'}`}></div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border-2 border-neonBlue shadow-[0_0_15px_rgba(8,247,254,0.5)] z-0"></div>
      
      {/* Content container */}
      <div className="relative z-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-3 sm:mb-5 text-transparent bg-clip-text bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink">
          Player Level
        </h2>
        
        {/* Level display */}
        <div className="relative mb-4 sm:mb-6">
          <div className="text-6xl sm:text-7xl md:text-8xl font-bold mb-1 sm:mb-2 text-white relative">
            <span className="relative z-10">{level}</span>
            <div className="absolute inset-0 blur-md text-neonBlue z-0">{level}</div>
          </div>
          
          <div className="text-xs sm:text-sm font-medium text-gray-300 mt-1 sm:mt-2">
            Next Level: <span className="text-neonPink">{nextLevel}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative w-full h-4 sm:h-6 bg-black rounded-full overflow-hidden border border-neonBlue/30 shadow-inner mb-3 sm:mb-4">
          {/* Track background with scanlines */}
          <div className="absolute inset-0 bg-scanline opacity-20"></div>
          
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-neonBlue via-purple-500 to-neonPink rounded-full transition-all duration-1000 ease-out"
            style={{ width: progressBarWidth }}
          ></div>
          
          {/* Glowing edge */}
          <div 
            className="absolute top-0 h-full w-1 sm:w-2 bg-white blur-sm rounded-full transition-all duration-1000 ease-out"
            style={{ 
              left: `calc(${progressBarWidth} - 2px)`,
              opacity: isAnimated ? 0.7 : 0 
            }}
          ></div>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-text">
            {progress}%
          </div>
        </div>
        
        {/* Details */}
        <div className="text-xs sm:text-sm font-medium text-gray-300 flex justify-between px-1">
          <div>Current</div>
          <div>Next Level</div>
        </div>
        
        {/* Decoration elements */}
        <div className={`absolute -top-3 -right-3 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-neonPink shadow-[0_0_10px_rgba(254,83,187,0.7)] transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}></div>
        <div className={`absolute -bottom-3 -left-3 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-neonBlue shadow-[0_0_10px_rgba(8,247,254,0.7)] transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}></div>
      </div>
    </div>
  );
};