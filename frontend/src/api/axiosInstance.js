import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://10.12.7.6:8000/',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const unauthAxiosInstance = axios.create({ 
  baseURL: 'http://10.12.7.6:8000/',
  withCredentials: true,
  headers: {
      'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Token'] = `${token}`;
  } else {
    localStorage.removeItem('access_token');
  }
  return config;
}, error => {
  return Promise.reject(error);
});


export {axiosInstance, unauthAxiosInstance};
