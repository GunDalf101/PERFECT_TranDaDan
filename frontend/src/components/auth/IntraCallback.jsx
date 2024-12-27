import { useEffect, useState } from "react";
import MeAx from "../../api/authServiceUser"
import { useNavigate } from "react-router-dom";
// import axiosInstance from '../../api/axiosInstance';
import { getUserData } from "../../api/authService42Intra";
// import axios from 'axios';
// import Cookies from 'js-cookie';


const IntraCallback = () => {

  const [user, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get("accessToken");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("access_token", accessToken);

    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        setUserData(data);
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
	<div className="flex justify-center items-center h-screen bg-black">
	<div className="text-white text-xl">
	  {user ? (
		<pre>{JSON.stringify(user, null, 2)}</pre>
	  ) : (
		'Authenticating...'
	  )}
	</div>
  </div>
  );
};

export default IntraCallback;
