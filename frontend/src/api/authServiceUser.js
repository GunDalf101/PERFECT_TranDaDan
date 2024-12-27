import axiosInstance from './axiosInstance';


const MeAx = async (data) => {
  try {
    const response = await axiosInstance.get("/users/me", data);
    return response;
  } catch (error) {
    throw (error)
  }
};



export default MeAx;