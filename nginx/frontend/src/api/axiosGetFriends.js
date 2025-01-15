import {axiosInstance} from './axiosInstance';


const getFriends = async () => {
  try {
    const response = await axiosInstance.get('api/friends');
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};



export default getFriends;