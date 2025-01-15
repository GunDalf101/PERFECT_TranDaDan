import {unauthAxiosInstance} from './axiosInstance';


const RegisterAx = async (data) => {
  try {
    const response = await unauthAxiosInstance.post('api/register', data);
    return response;
  } catch (error) {
    throw(error);
  }
};


export default RegisterAx;