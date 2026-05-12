import React, { useState, useEffect } from "react";
import Login from "./components/Login/Login"; 
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
import Toast from "./components/Toast";
import UserDashboard from './pages/UserDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState("admin");
  const [view, setView] = useState("landing");
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState("light");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    let nextTheme = saved === "light" || saved === "dark" ? saved : null;
    if (!nextTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      nextTheme = prefersDark ? "dark" : "light";
    }
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    if (userRole === "empleado") {
      if (view === "vehiculos" || view === "citas") setView("panel_empleado");
    } else if (userRole === "admin") {
      if (view === "vehiculos" || view === "citas") setView("dashboard");
    } else {
      // Cubre "user", "cliente", "usuario" y cualquier otro rol no admin/empleado
      if (view === "panel_empleado" || view === "users") setView("dashboard");
    }
  }, [view, userRole, isLoggedIn]);

  const handleLoginSuccess = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setView("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setView("landing");
    setToasts([]);
    setUnreadNotifications(0);
    setNotifications([]);
    setShowNotifPanel(false);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
  };

  const showToast = (message, type = 'info') => {
    const newToast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setNotifications(prev => [{ ...newToast, read: false }, ...prev].slice(0, 20));
    setUnreadNotifications(prev => prev + 1);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const resetUnreadNotifications = () => {
    setUnreadNotifications(0);
    setShowNotifPanel(prev => !prev);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!isLoggedIn && view === "landing") {
    return <LandingPage theme={theme} onToggleTheme={toggleTheme} onEnterLogin={() => setView("login")} onEnterRegister={() => setView("register")} />;
  }

  if (!isLoggedIn && view === "login") {
    return (
      <div className="min-h-screen bg-[var(--mx-bg-2)] flex flex-col items-center justify-center p-6 text-[var(--mx-text)]">
        <button onClick={() => setView("landing")} className="mb-4 text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)] hover:text-[var(--mx-text)] transition">
          ← Volver al inicio
        </button>
        <Login initialMode="login" onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (!isLoggedIn && view === "register") {
    return (
      <div className="min-h-screen bg-[var(--mx-bg-2)] flex flex-col items-center justify-center p-6 text-[var(--mx-text)]">
        <button onClick={() => setView("landing")} className="mb-4 text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)] hover:text-[var(--mx-text)] transition">
          ← Volver al inicio
        </button>
        <Login initialMode="register" onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mx-bg-2)] text-[var(--mx-text)]">
      <InactivityHandler onLogout={handleLogout} />

      <Navbar 
        setView={setView} 
        handleLogout={handleLogout} 
        userRole={userRole}
        view={view}
        theme={theme}
        onToggleTheme={toggleTheme}
        unreadNotifications={unreadNotifications}
        resetUnreadNotifications={resetUnreadNotifications}
        notifications={notifications}
        showNotifPanel={showNotifPanel}
      />

      {toasts.map(toast => (
        <Toast 
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <main className="pt-[76px] md:pl-[280px] px-5 md:px-10 pb-14">
        {view === "dashboard" && userRole === "admin" && <DashboardAdmin setView={setView} showToast={showToast} />}
        {view === "dashboard" && userRole === "empleado" && <EmployeeDashboard />}
        {view === "dashboard" && (userRole === "user" || userRole === "cliente" || userRole === "usuario") && <UserDashboard setView={setView} showToast={showToast} />}
        {view === "servicios" && <Servicios setView={setView} />}
        {view === "users" && <UsersList />}
        {view === "vehiculos" && <Vehiculos setView={setView} />}
        {view === "citas" && <Citas setView={setView} showToast={showToast} />}
        {view === "cuenta" && <MiCuenta />}
        {view === "panel_empleado" && <PanelEmpleado />}

        {userRole === 'admin' && view !== 'users' && (
          <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10">
            <button 
              onClick={() => setView("users")}
              className="mx-btn mx-btn-primary px-6 py-4 text-[11px] shadow-[0_18px_40px_rgba(0,71,255,0.18)]"
            >
              Administrar usuarios
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
