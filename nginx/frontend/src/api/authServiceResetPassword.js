import {unauthAxiosInstance} from './axiosInstance';


const ResetPassword = async (token,data) => {
  try {
    const response = await unauthAxiosInstance.post(`api/reset/${token}`,data);
    
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default ResetPassword;
