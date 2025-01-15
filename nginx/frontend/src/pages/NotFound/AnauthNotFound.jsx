import { Link } from "react-router-dom";
import React from "react";

const AnauthNotFound = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-cover bg-center bg-[url('/retro_car_1.jpeg')] from-darkBackground via-purpleGlow to-neonBlue text-white font-retro">

      {/* Not Found Card */}
      <div className="w-11/12 h-fit m-4 mt-20 p-6 bg-black bg-opacity-80 rounded-lg border-2 border-neonBlue shadow-[0_0_25px_5px] shadow-neonBlue">
        <div className="flex flex-col items-center">
          <h2 className="text-5xl text-center text-neonPink mb-4">404</h2>
          <h3 className="text-2xl text-center text-gray-200 mt-4">
            Oops! The page you're looking for does not exist.
          </h3>
          <p className="text-center text-xl text-neonBlue mt-2">
            You may have typed the URL incorrectly, or the page may have been moved or deleted.
          </p>
          <Link
            to="/"
            className="mt-6 px-6 py-2 bg-neonBlue text-black rounded-lg text-xl font-bold transition-all duration-300 hover:bg-neonPink hover:text-white"
          >
            Go Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnauthNotFound;
