import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

/**
 * Universal function to fix any image URL, replacing localhost with current API_BASE_URL
 * and ensuring proper protocol (HTTPS when using ngrok)
 */
export const fixImageUrl = (url) => {
  if (!url) return null;
  
  // If it's a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if it's using localhost and we're using a different base URL
    if ((url.includes('localhost:3001') || url.includes('localhost:3000') || url.includes('localhost:3005')) && 
        API_BASE_URL && !API_BASE_URL.includes('localhost')) {
      // Extract the path part (after localhost:XXXX)
      let path = url.split('localhost:3001')[1] || 
                 url.split('localhost:3000')[1] || 
                 url.split('localhost:3005')[1];
      if (path) {
        return `${API_BASE_URL}${path}`;
      }
    }
    // If it's HTTP but we're using HTTPS (ngrok), upgrade it
    if (url.startsWith('http://') && API_BASE_URL.startsWith('https://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  }
  
  // If it's a relative path
  if (url.startsWith('/uploads')) return `${API_BASE_URL}${url}`;
  if (url.startsWith('uploads/')) return `${API_BASE_URL}/${url}`;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  
  // Assume it's in uploads
  return `${API_BASE_URL}/uploads/${url}`;
};

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