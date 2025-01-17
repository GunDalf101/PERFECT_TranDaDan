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

const getDash = async (userid) => {
  try {
    const response = await axiosInstance.get('/games/userdash/' + userid);
    return response.data;
  } catch (error) {
    console.error('Error dash request:', error);
    throw error;
  }
};


export {getMatches, getDash};
