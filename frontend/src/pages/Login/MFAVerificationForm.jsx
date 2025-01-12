import React, { useState } from 'react';
import styles from "./Login.module.scss";


const MFAVerificationForm = ({onVerify,onCancel}) => {
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!/^\d+$/.test(mfaCode)) {
      setError('Please enter numbers only');
      return;
    }

    if (!mfaCode || mfaCode.length !== 6) {
      setError("Please enter a valid 6-digit MFA code.");
      return;
    }
    try {
      setIsLoading(true); 
      await onVerify(mfaCode);
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg w-96 border border-gray-800 shadow-inner  shadow-blue-400">
        <h2 className={`text-2xl font-bold mb-6 text-center ${styles.glowText}`}>
          Two-Factor Authentication
        </h2>
        <p className="text-gray-400 text-center mb-6">
          Please enter the verification code to continue
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col items-center ">
          <div className="w-full mb-5">
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                setError('');
              }}//
              placeholder="Enter verification code"
              className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border 
                ${error ? "border-red-500" : "border-gray-600"}
                placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 
                focus:bg-gray-900 text-white`}
              maxLength="6"
            />
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-center space-x-4 w-full">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-[#00d4ff] hover:text-gray-400 px-4 py-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.retroButton} px-8 py-3 font-bold rounded-lg text-white 
                flex items-center justify-center transition-all duration-300 ease-in-out 
                focus:outline-none ${isLoading ? 'opacity-50' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MFAVerificationForm;