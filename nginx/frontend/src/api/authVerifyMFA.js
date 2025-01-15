import {unauthAxiosInstance} from './axiosInstance';


const authVerifyMFA = async (data) => {
  try {
    const response = await unauthAxiosInstance.post("api/login/mfa/totp", {"code":data}, {headers: {"Token": localStorage.getItem('2fa_access_token')}});
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default authVerifyMFA;
