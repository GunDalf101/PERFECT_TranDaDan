import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/',
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Set the auth cookie with the token
      document.cookie = `auth=${token}; path=/`;
    }else
      localStorage.removeItem('access_token');
    return config;
  }, error => {
    return Promise.reject(error);
  });


export default axiosInstance;