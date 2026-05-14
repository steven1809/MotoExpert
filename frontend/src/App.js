import React, { useState, useEffect } from "react";
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
import Toast from "./components/Toast";
import UserDashboard from './pages/UserDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import OnboardingModal from './components/OnboardingModal';
import GoogleSignInModal from './components/GoogleSignInModal';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState("admin");
  const [view, setView] = useState("landing");
  const [toasts, setToasts] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

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

  useEffect(() => {
    if (isLoggedIn) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const onboardingKey = `motoexpert_onboarding_done_${userId}`;
        const onboardingDone = localStorage.getItem(onboardingKey);
        if (!onboardingDone && (userRole === 'user' || userRole === 'cliente' || userRole === 'usuario')) {
          setShowOnboarding(true);
        }
      }
    }
  }, [isLoggedIn, userRole]);

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

  return (
    <AuthProvider>
      <ThemeProvider>
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          userId={localStorage.getItem('userId')}
        />
        <GoogleSignInModal 
          isOpen={showGoogleModal} 
          onClose={() => setShowGoogleModal(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
        {!isLoggedIn && view === "landing" && (
          <LandingPage onEnterLogin={() => setView("login")} onEnterRegister={() => setView("register")} />
        )}

      {!isLoggedIn && view === "login" && (
        <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center p-4 text-slate-900 dark:text-[#F8FAFC]">
          <button onClick={() => setView("landing")} className="mb-4 text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition text-sm">
            ← Volver al inicio
          </button>
          <Login initialMode="login" onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {!isLoggedIn && view === "register" && (
        <div className="min-h-screen bg-white dark:bg-[#020617] flex flex-col items-center justify-center p-4 text-slate-900 dark:text-[#F8FAFC]">
          <button onClick={() => setView("landing")} className="mb-4 text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition text-sm">
            ← Volver al inicio
          </button>
          <Login initialMode="register" onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {isLoggedIn && (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-[#F8FAFC]">
          <InactivityHandler onLogout={handleLogout} />

          <Navbar 
            setView={setView} 
            view={view}
            handleLogout={handleLogout} 
            userRole={userRole}
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

          <main className="pt-20 md:pt-8 md:pl-72 p-6 md:p-8">
            {view === "dashboard" && userRole === "admin" && <DashboardAdmin setView={setView} showToast={showToast} unreadNotifications={unreadNotifications} />}
            {view === "dashboard" && userRole === "empleado" && <EmployeeDashboard />}
            {view === "dashboard" && (userRole === "user" || userRole === "cliente" || userRole === "usuario") && <UserDashboard setView={setView} showToast={showToast} />}
            {view === "servicios" && <Servicios setView={setView} />}
            {view === "users" && <UsersList />}
            {view === "vehiculos" && <Vehiculos setView={setView} />}
            {view === "citas" && <Citas setView={setView} showToast={showToast} />}
            {view === "cuenta" && <MiCuenta />}
            {view === "panel_empleado" && <PanelEmpleado />}

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
      )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
