import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/global.css';
import Login from './pages/Login';
import Home from './pages/Home';
import Citas from './pages/Citas';
import Vehiculos from './pages/Vehiculos';
import Perfil from './pages/Perfil';
import Resenas from './pages/Resenas';
import Servicios from './pages/Servicios';
import Notificaciones from './pages/Notificaciones';
import ServiceTracking from './pages/ServiceTracking';
import BottomNavbar from './components/BottomNavbar';

// Componente para proteger rutas por rol
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  try {
    user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" />;
  }

  // Normalizar el rol para la comparación
  const userRole = (user.role || user.rol || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    console.warn(`Access denied for role: ${userRole}. Allowed: ${normalizedAllowedRoles}`);
    return <Navigate to="/" />;
  }

  return children;
};

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <>
                  <Home />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />
            
            <Route path="/citas" element={
              <PrivateRoute>
                <>
                  <Citas />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />

            <Route path="/vehiculos" element={
              <PrivateRoute allowedRoles={['usuario', 'user', 'admin']}>
                <>
                  <Vehiculos />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />

            <Route path="/servicios" element={
              <PrivateRoute allowedRoles={['usuario', 'user', 'admin']}>
                <>
                  <Servicios />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />

            <Route path="/resenas" element={
              <PrivateRoute allowedRoles={['usuario', 'user']}>
                <>
                  <Resenas />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />

            <Route path="/notificaciones" element={
              <PrivateRoute>
                <>
                  <Notificaciones />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />
            
            <Route path="/perfil" element={
              <PrivateRoute>
                <>
                  <Perfil />
                  <BottomNavbar />
                </>
              </PrivateRoute>
            } />
            <Route path="/tracking/:citaId" element={
              <PrivateRoute>
                <ServiceTracking />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
