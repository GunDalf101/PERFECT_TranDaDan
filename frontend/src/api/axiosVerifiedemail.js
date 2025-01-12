import {unauthAxiosInstance} from './axiosInstance';


const verifidEmail = async (token) => {
  try {
    const response = await unauthAxiosInstance.get(`api/email/verify/${token}`);
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};



export default verifidEmail;