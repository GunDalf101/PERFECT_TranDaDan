import axiosInstance from './axiosInstance';


const RequestResetPassword = async (data) => {
  try {
    const response = await axiosInstance.post("api/reset", data);
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default RequestResetPassword;
