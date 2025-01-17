import {axiosInstance} from './axiosInstance';


const getMyData = async () => {
  try {
    const response = await axiosInstance.get('api/users/me');
    return response.data;
  } catch (error) {
    throw (error);
  }
};

const editMyData = async (form) => {
  try {
    const response = await axiosInstance.patch('api/users/me', form);
    return response.data;
  } catch (error) {
    throw (error);
  }
};



export {getMyData, editMyData};
