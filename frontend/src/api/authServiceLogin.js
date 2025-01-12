import {unauthAxiosInstance} from './axiosInstance';


const LoginAx = async (data) => {
  try {
    const response = await unauthAxiosInstance.post("api/login", data);
    return response; 
  } catch (error) {
    throw (error)
  }
};



export default LoginAx;
