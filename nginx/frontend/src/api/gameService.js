import {axiosInstance} from './axiosInstance';


const getMatches = async (userid) => {
  try {
    const response = await axiosInstance.get('/games/usermatches/' + userid);
    return response.data;
  } catch (error) {
    console.error('Error match request:', error);
    throw error;
  }
};


export default getMatches;