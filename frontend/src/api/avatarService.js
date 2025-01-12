import {axiosInstance} from './axiosInstance';

const changeAvatarReq = async (avatar) => {
  try {
    console.log(avatar)
    const response = await axiosInstance.post('api/changeavatar', {avatar});
    return response.data;
  } catch (error) {
    console.error('Error changing avatar request:', error);
    throw error;
  }
};

export {changeAvatarReq}