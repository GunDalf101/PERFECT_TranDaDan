import {unauthAxiosInstance} from './axiosInstance';


const RequestResetPassword = async (data) => {
  try {
    const response = await unauthAxiosInstance.post("api/reset", data);
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default RequestResetPassword;
