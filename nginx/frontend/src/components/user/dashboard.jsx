import { Pie, Line } from 'react-chartjs-2';
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
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  CategoryScale
);

export const MyPie = ({data}) => {

if (data.t_win == 0 && data.t_lose == 0)
    return (<p className="text-center text-gray-400">No matches to display.</p>)
  const stat = {
    labels: ['Win', 'Lose'],
    datasets: [
      {
        label: 'Win/Lose Rate',
        data: [data.t_win, data.t_lose],
        backgroundColor: ['rgb(0, 212, 255)', 'rgb(220, 38, 38)'],
        borderSize: 10,
        hoverOffset: 3,
      },
    ],
  };

  return <Pie data={stat} />;
};

export const MyLine = ({data}) => {
  const stat = {
    labels: data.days,
    datasets: [
      {
        label: 'Wins',
        data: data.wins,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Loses',
        data: data.loses,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
      },
    ],
  };

  return <Line data={stat}   options={{scales: {y: {min: 0}}}} />;
};

export const UserLevelBox = ({ level, progress }) => {
  return  (
    <div className="relative w-full max-w-xs p-6 rounded-2xl shadow-2xl text-center text-white bg-gradient-to-br from-black to-gray-900 border border-pink-500">
      <div className="absolute inset-0 rounded-2xl blur-md bg-gradient-to-br from-pink-500 to-blue-500 opacity-20"></div>
      <h2 className="text-3xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 animate-pulse">
        User Level
      </h2>
      <p className="text-4xl font-bold mb-6 text-pink-500 drop-shadow-[0_0_5px_rgba(255,20,147,0.8)]">
        {level}
      </p>
      <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-blue-500">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
        <div className="absolute top-0 left-0 h-full rounded-full opacity-50 blur-sm bg-gradient-to-r from-pink-400 to-blue-400" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-300 drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]">
        Progress: <span className="text-blue-400">{progress}%</span>
      </p>
    </div>
  );
};
