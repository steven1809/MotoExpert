import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../apiConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    const role = localStorage.getItem('role');

    if (token && userId) {
      setUser({
        id: userId,
        name: userName,
        email: userEmail,
        role: role,
      });
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token || '');
    localStorage.setItem('userId', userData.id);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('role', userData.role || 'user');
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleToken }),
      });

      if (!response.ok) {
        throw new Error('Error al iniciar sesión con Google');
      }

      const data = await response.json();
      const userData = {
        id: data.user.id,
        name: data.user.nombre,
        email: data.user.email,
        role: data.user.role || 'user',
        token: data.access_token,
      };
      login(userData);
      return userData;
    } catch (err) {
      console.error('Error en Google login:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
