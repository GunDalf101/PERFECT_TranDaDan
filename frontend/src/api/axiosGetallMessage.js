import axiosInstance from './axiosInstance';


const getAllMessage = async (username) => {
    try {
        const response = await axiosInstance.get(`api/chat/${username}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat data:', error);
        throw error;
    }
};



export default getAllMessage;