import axios from 'axios';

// Detect if running on phone (via IP) or localhost
const getAPIBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessed via IP, use that IP for API too
    if (hostname === '192.168.1.24' || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `http://${hostname}:3000`;
    }
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

const API_BASE_URL = getAPIBaseUrl();

let authToken = localStorage.getItem('auth_token');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

export const apiRequest = async (url, config = {}) => {
  try {
    const response = await apiClient({
      url,
      ...config,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'API Error');
  }
};

export default apiClient;
