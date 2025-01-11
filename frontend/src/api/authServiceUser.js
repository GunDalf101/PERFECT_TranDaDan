import axiosInstance from './axiosInstance';


const getUserData = async (username) => {
  try {
    const response = await axiosInstance.get('api/user/' + username);
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};



export default getUserData;