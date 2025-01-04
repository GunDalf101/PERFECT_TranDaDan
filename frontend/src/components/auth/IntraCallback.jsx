import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import axiosInstance from '../../api/axiosInstance';
import { getUserData } from "../../api/authService42Intra";
import { useUser } from '../../components/auth/UserContext'


const IntraCallback = () => {

  const { login } = useUser();
  const navigate = useNavigate();

  
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
        const userJSON = JSON.stringify(data);
        localStorage.setItem("user", userJSON);
        login(data);
        navigate('/'); 
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
	<></>
  );
};

export default IntraCallback;
