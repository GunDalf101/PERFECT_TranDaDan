import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import {axiosInstance} from '../../api/axiosInstance';
// import { getUserData } from "../../api/authService42Intra";
import { useUser } from "../../components/auth/UserContext";
import {getMyData} from "../../api/authServiceMe";
import MFAVerificationForm from "../../pages/Login/MFAVerificationForm";
import authVerifyMFA from "../../api/authVerifyMFA";

const IntraCallback = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [showMFAForm, setShowMFAForm] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const mfa = queryParams.get("mfa_required");
      const accessToken = queryParams.get("accessToken");
      if (mfa === "True") {
        localStorage.setItem("2fa_access_token", accessToken);
        setShowMFAForm(true);
        return;
      }
      localStorage.setItem("access_token", accessToken);
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }
      try {
        const data = await getMyData();
        const userJSON = JSON.stringify(data);
        login(userJSON);
        navigate("/");
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleMFAVerify = async (Mfadata) => {
    try {
      const response = await authVerifyMFA(Mfadata);
      const { access_token } = response.data;
      localStorage.removeItem("2fa_access_token");
      localStorage.setItem("access_token", access_token);
      const data = await getMyData();
      const userJSON = JSON.stringify(data);
      login(userJSON);
      navigate("/");
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Invalid verification code"
      );
    }
  };

  return (
    <>
      <div className="bg-black">
        {showMFAForm && (
          <div className="min-h-screen flex items-center justify-center ">
            <MFAVerificationForm
              onVerify={handleMFAVerify}
              onCancel={() => {
                setShowMFAForm(false);
                navigate('/login');
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default IntraCallback;
