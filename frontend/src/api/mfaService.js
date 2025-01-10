import axiosInstance from './axiosInstance';


const qrMFAreq = async () => {
  try {
    const response = await axiosInstance.get('api/mfa/totp');
    return response.data;
  } catch (error) {
    console.error('Error enable MFA request:', error);
    throw error;
  }
};

const disableMFAreq = async () => {
  try {
    const response = await axiosInstance.delete('api/mfa/totp');
    return response.data;
  } catch (error) {
    console.error('Error disable MFA request:', error);
    throw error;
  }
};

const enableMFA = async (code) => {
  try {
    const response = await axiosInstance.put('api/mfa/totp', {code});
    return response.data;
  } catch (error) {
    console.error('Error submiting MFA code request:', error);
    throw error;
  }
};

export {qrMFAreq, disableMFAreq, enableMFA}