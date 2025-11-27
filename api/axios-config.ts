import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://your-api-url.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('Response error:', error.response.status);
      
      switch (error.response.status) {
        case 401:
          console.log('Unauthorized - please log in');
          break;
        case 404:
          console.log('Resource not found');
          break;
        case 500:
          console.log('Server error');
          break;
        default:
          console.log('An error occurred');
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const api = {
  getToday: (date: string) => 
    axiosInstance.get(`/api/today/${date}`),
  
  getClubEvents: (date: string) => 
    axiosInstance.get(`/api/club-events/${date}`),
  
  submitClubEvent: (data: any) => 
    axiosInstance.post('/api/club-events', data),
};