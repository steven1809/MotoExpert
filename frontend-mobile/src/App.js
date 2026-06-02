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
import BottomNavbar from './components/BottomNavbar';

// Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
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
            <PrivateRoute>
              <>
                <Vehiculos />
                <BottomNavbar />
              </>
            </PrivateRoute>
          } />

          <Route path="/servicios" element={
            <PrivateRoute>
              <>
                <Servicios />
                <BottomNavbar />
              </>
            </PrivateRoute>
          } />

          <Route path="/resenas" element={
            <PrivateRoute>
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
