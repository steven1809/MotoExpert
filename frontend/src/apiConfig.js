import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

// Instancia axios con header ngrok
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptar fetch nativo globalmente
const originalFetch = window.fetch;
window.fetch = (url, options = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set('ngrok-skip-browser-warning', 'true');
  return originalFetch(url, { ...options, headers });
};

export default api;