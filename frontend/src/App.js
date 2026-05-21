import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Login from "./components/Login/Login"; 
import Servicios from "./pages/Servicios";
import UsersList from "./pages/UsersList";
import Vehiculos from "./pages/vehiculos";
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
import OnboardingModal from './components/OnboardingModal';
import GoogleSignInModal from './components/GoogleSignInModal';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import ResenasPage from './pages/ResenasPage';
import PaymentStep from './components/PaymentStep';
import PaymentConfirmation from './components/PaymentConfirmation';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userRole, setUserRole] = useState("admin");
  const [view, setView] = useState("landing");
  const [routePath, setRoutePath] = useState(window.location.pathname || '/');
  const [toasts, setToasts] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [overdueAlerts, setOverdueAlerts] = useState([]);
  const processedTimeoutsRef = useRef(new Set());

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
    const onPop = () => setRoutePath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (routePath.startsWith('/appointments/') && view !== 'citas') {
      try {
        window.history.pushState({}, '', '/');
        setRoutePath('/');
      } catch {}
    }
  }, [view, isLoggedIn, routePath]);

  const navigate = (path, state) => {
    try {
      window.history.pushState(state || {}, '', path);
      setRoutePath(path);
      return;
    } catch {}
    window.location.assign(path);
  };

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
    setRoutePath('/');
    setToasts([]);
    setUnreadNotifications(0);
    setNotifications([]);
    setShowNotifPanel(false);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    localStorage.removeItem("userPicture");
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

  const isStandardUser = userRole === "user" || userRole === "cliente" || userRole === "usuario";

  const addOverdueAlert = (payload) => {
    if (!payload?.appointmentId) return;
    setOverdueAlerts((prev) => {
      if (prev.some((a) => a.appointmentId === payload.appointmentId)) return prev;
      return [payload, ...prev];
    });

    try {
      window.dispatchEvent(
        new CustomEvent('motoexpert:appointment_overdue', { detail: payload }),
      );
    } catch {}
  };

  const dismissOverdueAlert = (appointmentId) => {
    setOverdueAlerts((prev) => prev.filter((a) => a.appointmentId !== appointmentId));
  };

  const handleOpenChat = (payload) => {
    showToast('Chat no disponible todavía.', 'info');
  };

  const handleViewAppointment = (appointmentId) => {
    if (!appointmentId) return;
    localStorage.setItem('focusCitaId', String(appointmentId));
    setView('citas');
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    const onOverdue = (payload) => {
      if (!payload?.appointmentId) return;
      if (processedTimeoutsRef.current.has(payload.appointmentId)) return;
      processedTimeoutsRef.current.add(payload.appointmentId);
      
      const serviceName = (payload.serviceName || 'Servicio').toUpperCase();
      const plate = (payload.vehiclePlate || '—').toUpperCase();
      const minutes = Number(payload.minutesOverdue || 0);
      showToast(`CITA ATRASADA: ${serviceName} (${plate}) tiene un retraso de ${minutes} minutos.`, 'error');

      addOverdueAlert(payload);
    };

    socket.on('appointment_overdue', onOverdue);
    socket.on('appointment_timeout', onOverdue);

    socket.on('appointment_status_changed', (data) => {
      const { oldCita, newCita } = data;
      if (!oldCita || !newCita) return;
      if (oldCita.estado === 'PENDIENTE' && newCita.estado === 'EN PROCESO') {
        showToast(`Tu servicio ${newCita.servicio?.nombre} ha comenzado. ¡Estamos trabajando en tu vehículo!`, 'info');
      } else if (oldCita.estado === 'EN PROCESO' && newCita.estado === 'FINALIZADO') {
        showToast(`Tu servicio ${newCita.servicio?.nombre} ha sido completado. ¡Tu vehículo está listo!`, 'success');
      }
    });

    const onResolved = (payload) => {
      const appointmentId = payload?.appointmentId;
      if (!appointmentId) return;
      dismissOverdueAlert(appointmentId);
      try {
        window.dispatchEvent(
          new CustomEvent('motoexpert:appointment_resolved', { detail: { appointmentId } }),
        );
      } catch {}
    };
    socket.on('appointment_resolved', onResolved);

    return () => {
      socket.off('appointment_resolved', onResolved);
      socket.disconnect();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const activeStates = new Set(['pendiente', 'en_proceso']);
    let stopped = false;

    const computeExpectedEndTime = (cita) => {
      if (cita?.expected_end_time) {
        const d = new Date(cita.expected_end_time);
        return Number.isFinite(d.getTime()) ? d : null;
      }

      const fecha = cita?.fecha;
      const hora = cita?.hora_inicio;
      if (!fecha || !hora) return null;

      const start = new Date(`${fecha}T${hora}`);
      if (!Number.isFinite(start.getTime())) return null;

      const minutesRaw =
        cita?.servicio?.duration_minutes ??
        cita?.servicio?.duracion ??
        cita?.service_duration_minutes ??
        60;
      const minutes = Number(minutesRaw);
      if (!Number.isFinite(minutes) || minutes <= 0) return null;

      return new Date(start.getTime() + minutes * 60_000);
    };

    const normalizeEstado = (estado) =>
      (estado || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/citas`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const now = new Date();
        for (const cita of data) {
          const estado = normalizeEstado(cita?.estado);
          if (!activeStates.has(estado)) continue;

          const expectedEnd = computeExpectedEndTime(cita);
          if (!expectedEnd) continue;
          if (now <= expectedEnd) continue;

          if (processedTimeoutsRef.current.has(cita.id)) continue;
          processedTimeoutsRef.current.add(cita.id);

          await fetch(`${API_BASE_URL}/citas/${cita.id}/estado`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: 'tiempo_excedido' }),
          });

          const minutesOverdue = Math.max(
            0,
            Math.floor((now.getTime() - expectedEnd.getTime()) / 60_000),
          );
          addOverdueAlert({
            appointmentId: cita.id,
            clientName: cita?.usuario?.nombre || localStorage.getItem('userName') || '—',
            vehiclePlate: cita?.vehiculo?.placa || '—',
            serviceName: cita?.servicio?.nombre || 'Servicio',
            expectedEndTime: expectedEnd.toISOString(),
            minutesOverdue,
          });
        }
      } catch {}
    };

    run();
    const interval = setInterval(() => {
      if (!stopped) run();
    }, 5 * 60 * 1000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [isLoggedIn]);

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
        {(!isLoggedIn && (view === "landing" || view === "login" || view === "register")) && (
          <LandingPage onEnterLogin={() => setView("login")} onEnterRegister={() => setView("register")} />
        )}

      {!isLoggedIn && (view === "login" || view === "register") && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
          <Login 
            initialMode={view} 
            onLoginSuccess={handleLoginSuccess} 
            onBack={() => setView("landing")} 
          />
        </div>
      )}

      {isLoggedIn && (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-[#F8FAFC]">
          <InactivityHandler onLogout={handleLogout} />

          <div className="fixed top-4 right-4 md:right-80 z-40">
            <NotificationBell />
          </div>

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

          <main className={`pt-20 ${isStandardUser ? "md:pt-24" : "md:pt-8 md:pl-72"} p-6 md:p-8`}>
            {routePath === '/appointments/payment' && (
              isStandardUser ? (
                <PaymentStep onNavigate={navigate} />
              ) : (
                <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-center space-y-3">
                  <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    No autorizado
                  </div>
                  <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                    Esta ruta es solo para usuarios.
                  </div>
                </div>
              )
            )}

            {routePath === '/appointments/confirmation' && (
              isStandardUser ? (
                <PaymentConfirmation
                  onExit={() => {
                    navigate('/', {});
                    setView('citas');
                  }}
                />
              ) : (
                <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-center space-y-3">
                  <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    No autorizado
                  </div>
                  <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                    Esta ruta es solo para usuarios.
                  </div>
                </div>
              )
            )}

            {routePath.startsWith('/appointments/') ? null : (
              <>
                {view === "dashboard" && userRole === "admin" && <DashboardAdmin setView={setView} showToast={showToast} unreadNotifications={unreadNotifications} />}
                {view === "dashboard" && userRole === "empleado" && <EmployeeDashboard showToast={showToast} />}
                {view === "dashboard" && (userRole === "user" || userRole === "cliente" || userRole === "usuario") && <UserDashboard setView={setView} showToast={showToast} />}
                {view === "servicios" && <Servicios setView={setView} />}
                {view === "users" && <UsersList />}
                {view === "vehiculos" && <Vehiculos setView={setView} showToast={showToast} />}
                {view === "citas" && (
                  <Citas
                    setView={setView}
                    showToast={showToast}
                    overdueAlerts={overdueAlerts}
                    onDismissOverdueAlert={dismissOverdueAlert}
                    onOpenOverdueChat={handleOpenChat}
                    onViewOverdueAppointment={handleViewAppointment}
                  />
                )}
                {view === "resenas" && <ResenasPage />}
                {view === "cuenta" && <MiCuenta />}
                {view === "panel_empleado" && <PanelEmpleado showToast={showToast} />}
              </>
            )}

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
