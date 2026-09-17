import axios from 'axios';

// Base URL comes from the .env file (VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with the base URL set
const api = axios.create({
  baseURL: API_URL,
});

// Before every request, check if a token is in localStorage
// If it exists, attach it as an Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('threadly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
