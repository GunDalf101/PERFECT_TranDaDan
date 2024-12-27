import axiosInstance from './axiosInstance';


const RegisterAx = async (data) => {
  try {
    const response = await axiosInstance.post('/register', data);
    return response;
  } catch (error) {
    throw(error);
  }
};


export default RegisterAx;