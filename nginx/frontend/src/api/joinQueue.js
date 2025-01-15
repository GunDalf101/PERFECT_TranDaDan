import {axiosInstance} from './axiosInstance';

const joinQueue = async () => {
    try {
      const response = await axiosInstance.get('games/matchmaking/join');
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Get user data error:', error);
      throw error;
    }
  };
  
  
  
  export default joinQueue;