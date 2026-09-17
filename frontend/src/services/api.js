import axios from 'axios';

// Render production backend URL
const RENDER_BACKEND_URL = 'https://threadly-backend-prmf.onrender.com';
const RENDER_API_URL = `${RENDER_BACKEND_URL}/api`;
const LOCAL_API_URL = 'http://localhost:5000/api';

// Check if running in a deployed/production environment
const isProduction =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1');

// Determine Base API URL:
// In production, always use the Render backend URL (unless a custom non-localhost VITE_API_URL is provided).
// In local development, use VITE_API_URL or default to localhost.
const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (isProduction) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return RENDER_API_URL;
  }
  return envUrl || LOCAL_API_URL;
};

export const API_URL = resolveApiUrl();

// Base backend URL (without trailing /api)
export const BACKEND_URL =
  API_URL.replace(/\/api\/?$/, '') ||
  (isProduction ? RENDER_BACKEND_URL : 'http://localhost:5000');

// Default fallback image
export const FALLBACK_IMAGE = 'https://placehold.co/500x600/eeeeee/999999.png?text=No+Image';

/**
 * Returns a normalized image URL.
 * In production, prefixes relative image paths with the Render backend URL
 * so images load reliably from https://threadly-backend-prmf.onrender.com/images/...
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
  const cleanPath = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
  if (isProduction) {
    return `${BACKEND_URL}${cleanPath}`;
  }
  return cleanPath;
};

/**
 * Robust image error handler:
 * If an image fails to load, attempt loading directly from the Render backend.
 * If that also fails, fall back to the placeholder image.
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
    const backendUrl = `${RENDER_BACKEND_URL}${originalSrc.startsWith('/') ? '' : '/'}${originalSrc}`;
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
