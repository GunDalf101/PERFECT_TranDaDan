import axiosInstance from './axiosInstance';


const getMyData = async () => {
  try {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};



export default getMyData;