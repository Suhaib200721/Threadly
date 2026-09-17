import axios from 'axios';

// Determine if running in a deployed/production browser environment
const isProduction =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

// Base API URL: prefer VITE_API_URL, fallback to Render in production, localhost in development
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction
    ? 'https://threadly-backend-prmf.onrender.com/api'
    : 'http://localhost:5000/api');

// Base backend URL (without trailing /api)
export const BACKEND_URL =
  API_URL.replace(/\/api\/?$/, '') ||
  (isProduction
    ? 'https://threadly-backend-prmf.onrender.com'
    : 'http://localhost:5000');

// Default fallback image
export const FALLBACK_IMAGE = 'https://placehold.co/500x600/eeeeee/999999.png?text=No+Image';

/**
 * Returns a normalized image URL.
 */
export const getImageUrl = (imageSrc) => {
  if (!imageSrc) return FALLBACK_IMAGE;
  if (
    imageSrc.startsWith('http://') ||
    imageSrc.startsWith('https://') ||
    imageSrc.startsWith('data:') ||
    imageSrc.startsWith('blob:')
  ) {
    return imageSrc;
  }
  return imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
};

/**
 * Robust image error handler:
 * If an image fails to load from the frontend host,
 * automatically attempt loading it directly from the Render backend.
 * If both fail, fall back to the placeholder image.
 */
export const handleImageErrorWithFallback = (e, originalSrc, fallback = FALLBACK_IMAGE) => {
  e.target.onerror = null;
  if (
    originalSrc &&
    !originalSrc.startsWith('http://') &&
    !originalSrc.startsWith('https://') &&
    !originalSrc.startsWith('data:') &&
    !originalSrc.startsWith('blob:')
  ) {
    const backendBase = BACKEND_URL.startsWith('http')
      ? BACKEND_URL
      : 'https://threadly-backend-prmf.onrender.com';
    const backendUrl = `${backendBase}${originalSrc.startsWith('/') ? '' : '/'}${originalSrc}`;
    if (e.target.src !== backendUrl) {
      e.target.src = backendUrl;
      return;
    }
  }
  e.target.src = fallback;
};

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
