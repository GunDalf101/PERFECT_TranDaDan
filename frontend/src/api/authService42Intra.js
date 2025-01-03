import axiosInstance from './axiosInstance';

const getUserData = async () => {
  try {
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error('No access token found');
    }
    const response = await axiosInstance.get('api/users/me');
    return response.data;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};


const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete axiosInstance.defaults.headers.common['Authorization'];
};


const isAuthenticated = () => {
  return localStorage.getItem('access_token') !== null;
};



export {  getUserData, logout, isAuthenticated };