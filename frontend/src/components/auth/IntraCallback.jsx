import { useEffect, useState } from "react";
import MeAx from "../../api/authServiceUser"
import { useNavigate } from "react-router-dom";
// import axiosInstance from '../../api/axiosInstance';
import { getUserData } from "../../api/authService42Intra";

const IntraCallback = () => {

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get("accessToken");

    if (!accessToken) {
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("access_token", accessToken);

    // window.location.href = "/chat";
    const fetchUserData = async () => {
      try {
        const data = await getUserData();
        const userJSON = JSON.stringify(data);
        localStorage.setItem("user", userJSON);
        window.location.href = "/";
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
