import axios from 'axios';
import { env } from '../config/env';

const axiosInstance = axios.create({
    baseURL: location.origin,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

const unauthAxiosInstance = axios.create({ 
  baseURL: location.origin,
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
