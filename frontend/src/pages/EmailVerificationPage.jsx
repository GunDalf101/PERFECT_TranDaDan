import React, { useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import verifidEmail from '../api/axiosVerifiedemail';

const EmailVerificationPage = () => {
    const { token } = useParams(); 
    const navigate = useNavigate();
    const [status, setStatus] = useState({ success: null, message: '' });
  
    useEffect(() => {
      const verifyEmail = async () => {
        try {
          await verifidEmail(token);
          setStatus({ success: true, message: 'Your email has been successfully verified!' });
        } catch (error) {
          setStatus({
            success: false,
            message: error.response?.data?.message || 'Email verification failed. Please try again.',
          });
        }
      };
      verifyEmail();
  
      const timeout = setTimeout(() => {
        navigate("/login"); 
      }, 3000);
  
      return () => clearTimeout(timeout);
    }, [token, navigate]);
  
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-300 text-2xl">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
          {status.success === null ? (
            <h1>Verifying your email, please wait...</h1>
          ) : status.success ? (
            <h1 className="text-green-600">{status.message}</h1>
          ) : (
            <h1 className="text-red-600">{status.message}</h1>
          )}
        </div>
      </div>
    );
  };
  
  export default EmailVerificationPage;
