import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer Token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('inpainting_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercept 401 & 403 responses to clear expired/invalid credentials and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Check if error is due to invalid/expired token or unauthenticated access
      const errorMessage = error.response.data?.error || '';
      if (
        error.response.status === 401 ||
        errorMessage.includes('token') ||
        errorMessage.includes('Access token')
      ) {
        localStorage.removeItem('inpainting_token');
        localStorage.removeItem('inpainting_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

