import {unauthAxiosInstance} from './axiosInstance';


const ResetPassword = async (token,data) => {
  try {
    console.log(data);
    const response = await unauthAxiosInstance.post(`api/reset/${token}`,data);
    
    return response; 
  } catch (error) {
    console.log(error);
    throw (error)
  }
};



export default ResetPassword;
