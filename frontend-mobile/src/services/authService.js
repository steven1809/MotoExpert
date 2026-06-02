import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      
      // El backend devuelve los datos del usuario directamente en response.data
      const userData = {
        id: response.data.userId,
        nombre: response.data.nombre,
        role: response.data.role || 'usuario',
        picture: response.data.picture
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
