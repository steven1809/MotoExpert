import React, { useState } from "react";
import Login from "./components/Login/Login"; 
import Register from "./components/Register/Register";
import Servicios from "./pages/Servicios";
import UsersList from "./pages/UsersList";
import Vehiculos from "./pages/Vehiculos";
import Citas from "./pages/Citas";
import MiCuenta from "./pages/MiCuenta";
import PanelEmpleado from "./pages/PanelEmpleado";
import Navbar from "./components/Navbar";
import LandingPage from './pages/LandingPage';
import DashboardAdmin from './pages/DashboardAdmin';
import InactivityHandler from "./components/InactivityHandler";
import MapView from "./components/MapView";
import { useEffect } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState("admin"); // 'admin', 'user', 'empleado'
  const [view, setView] = useState("landing"); // Iniciamos en la landing

  // Validación de Rutas y Redirección según Rol
  useEffect(() => {
    if (!isLoggedIn) return;

    if (userRole === "empleado") {
      // Los empleados no pueden agendar citas ni ver vehículos generales
      if (view === "vehiculos" || view === "citas") {
        setView("panel_empleado");
      }
    } else if (userRole === "admin") {
      // Los administradores no pueden agendar citas ni ver vehículos de cliente
      if (view === "vehiculos" || view === "citas") {
        setView("dashboard");
      }
    } else if (userRole === "user") {
      // Los usuarios normales no pueden ver el panel de trabajo ni administración
      if (view === "panel_empleado" || view === "users") {
        setView("dashboard");
      }
    }
  }, [view, userRole, isLoggedIn]);

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setView("dashboard");
  };

  // Función para cerrar sesión correctamente
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setView("landing"); // Redirige a la landing al salir
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    // Opcional: localStorage.clear(); para borrar todo
  };

  // 1. SI NO ESTÁ LOGUEADO Y LA VISTA ES "LANDING"
  if (!isLoggedIn && view === "landing") {
    return <LandingPage onEnterLogin={() => setView("login")} onEnterRegister={() => setView("register")} />;
  }

  // 2. SI NO ESTÁ LOGUEADO Y LA VISTA ES "LOGIN"
  if (!isLoggedIn && view === "login") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 text-[#F8FAFC]">
        <button 
          onClick={() => setView("landing")}
          className="mb-4 text-[#94A3B8] hover:text-[#F8FAFC] transition text-sm"
        >
          ← Volver al inicio
        </button>
        
        <Login 
        initialMode="login"
        onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (!isLoggedIn && view === "register") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 text-[#F8FAFC]">
        <button 
          onClick={() => setView("landing")}
          className="mb-4 text-[#94A3B8] hover:text-[#F8FAFC] transition text-sm"
        >
          ← Volver al inicio
        </button>

        <Login 
          initialMode="register"
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // 3. SI YA ESTÁ LOGUEADO (Dashboard y Navegación)
  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC]">
      {/* Sistema de Seguridad por Inactividad */}
      <InactivityHandler onLogout={handleLogout} />

      {/* Navbar Superior Global - Ahora recibe handleLogout */}
      <Navbar 
        setView={setView} 
        handleLogout={handleLogout} 
        userRole={userRole} 
      />

      {/* Contenido Principal con margen superior para el Navbar fixed */}
      <main className="pt-16 p-8">
        {view === "dashboard" && <DashboardAdmin setView={setView} />}
        
        {view === "servicios" && <Servicios setView={setView} />}
        
        {view === "users" && <UsersList />}
        
        {view === "vehiculos" && <Vehiculos setView={setView} />}
        
        {view === "citas" && <Citas setView={setView} />}
        
        {view === "cuenta" && <MiCuenta />}
        
        {view === "panel_empleado" && <PanelEmpleado />}

        {/* Acceso rápido para admin si no está en la vista de usuarios */}
        {userRole === 'admin' && view !== 'users' && (
          <div className="fixed bottom-8 right-8">
            <button 
              onClick={() => setView("users")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-all transform hover:scale-105 font-bold"
            >
              👥 Administrar Usuarios
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;