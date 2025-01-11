import axiosInstance from './axiosInstance';
// cause merge issue

const qrMFAreq = async () => {
  try {
    const response = await axiosInstance.get('api/security/mfa/totp');
    return response.data;
  } catch (error) {
    console.error('Error enable MFA request:', error);
    throw error;
  }
};

const disableMFAreq = async () => {
  try {
    const response = await axiosInstance.delete('api/security/mfa/totp');
    return response.data;
  } catch (error) {
    console.error('Error disable MFA request:', error);
    throw error;
  }
};

const enableMFA = async (code) => {
  try {
    const response = await axiosInstance.put('api/security/mfa/totp', {code});
    return response.data;
  } catch (error) {
    console.error('Error submiting MFA code request:', error);
    throw error;
  }
};

export {qrMFAreq, disableMFAreq, enableMFA}
