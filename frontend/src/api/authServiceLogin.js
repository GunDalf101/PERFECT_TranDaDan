import axiosInstance from './axiosInstance';


const LoginAx = async (data) => {
  try {
    const response = await axiosInstance.post("/login", data);
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default LoginAx;
