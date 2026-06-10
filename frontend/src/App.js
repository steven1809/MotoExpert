import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login/Login'; 
import Servicios from './pages/Servicios';
import UsersList from './pages/UsersList';
import Vehiculos from './pages/Vehiculos';
import Citas from './pages/Citas';
import MiCuenta from './pages/MiCuenta';
import SeguridadView from './pages/SeguridadView.jsx';
import PanelEmpleado from './pages/PanelEmpleado';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DashboardAdmin from './pages/DashboardAdmin';
import InactivityHandler from './components/InactivityHandler';
import Toast from './components/Toast';
import UserDashboard from './pages/UserDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import OnboardingModal from './components/OnboardingModal';
import GoogleSignInModal from './components/GoogleSignInModal';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import ResenasPage from './pages/ResenasPage';
import AdminResenasModeracion from './pages/AdminResenasModeracion';
import ActivityLogPage from './pages/ActivityLogPage';
import PaymentStep from './components/PaymentStep';
import PaymentConfirmation from './components/PaymentConfirmation';
import AdminEstadisticas from './pages/AdminEstadisticas';
import ServiceTracking from './pages/ServiceTracking';
import EmpleadoHistorial from './pages/EmpleadoHistorial';

import { API_BASE_URL } from './apiConfig';

// Componente para manejar el retorno de Wompi
function WompiReturnHandler({ apiBaseUrl, onNavigate, onConfirm, showToast }) {
  const baseUrl = apiBaseUrl || API_BASE_URL;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenCode, setTokenCode] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      let transactionId = params.get('id');
      
      console.log('[WompiReturnHandler] URL params:', Object.fromEntries(params.entries()));
      console.log('[WompiReturnHandler] Raw transactionId:', transactionId);
      
      // Check localStorage for stored payment data first
      const storedPaymentDataStr = localStorage.getItem('wompiPaymentData');
      let storedPaymentData = null;
      if (storedPaymentDataStr) {
        try {
          storedPaymentData = JSON.parse(storedPaymentDataStr);
          console.log('[WompiReturnHandler] Found stored payment data:', storedPaymentData);
        } catch (e) {
          console.error('[WompiReturnHandler] Failed to parse stored payment data:', e);
        }
      }

      try {
        let response, data;
        
        // First, try using the stored payment ID to verify
        if (storedPaymentData?.paymentId) {
          console.log('[WompiReturnHandler] Verifying using stored payment ID:', storedPaymentData.paymentId);
          const token = localStorage.getItem('token');
          response = await fetch(`${baseUrl}/payments/${storedPaymentData.paymentId}/verify-wompi`, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            }
          });
          
          data = await response.json().catch(() => null);
          console.log('[WompiReturnHandler] Response from backend (using stored payment ID):', data);
        }
        
        // If that didn't work, try using the transaction ID from Wompi
        if ((!response || !response.ok) && transactionId) {
          console.log('[WompiReturnHandler] Falling back to transaction ID:', transactionId);
          transactionId = transactionId.trim().replace(/\s/g, '');
          response = await fetch(`${baseUrl}/payments/verify-wompi-transaction/${encodeURIComponent(transactionId)}`, {
            method: 'POST',
          });
          
          data = await response.json().catch(() => null);
          console.log('[WompiReturnHandler] Response from backend (using transaction ID):', data);
        }
        
        if (!response || !response.ok) {
          throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo verificar el pago');
        }

        if (data?.tokenCode) {
          setTokenCode(data.tokenCode);
          // Clear stored payment data after successful verification
          localStorage.removeItem('wompiPaymentData');
        } else {
          throw new Error('No se recibió el token de entrega');
        }
      } catch (e) {
        console.error('[WompiReturnHandler] Error:', e);
        setError(e instanceof Error ? e.message : 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [baseUrl]);

  const go = (path, state) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path, state);
      return;
    }
    try {
      window.history.pushState(state || {}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.assign(path);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
        <div className="mx-auto w-full max-w-md text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2563EB] border-t-transparent mx-auto"></div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Verificando pago...</h2>
          <p className="text-slate-600 dark:text-[#94A3B8]">Espera un momento mientras confirmamos tu pago.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#E24B4A]/15 border border-[#E24B4A]/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#E24B4A]" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Error al verificar el pago</h2>
            <p className="text-slate-600 dark:text-[#94A3B8]">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => go('/', {})}
            className="w-full py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em]"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (tokenCode) {
    // Renderizar la confirmación con el token
    return <PaymentConfirmation onExit={onConfirm} tokenCode={tokenCode} />;
  }

  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token')); 
  const [userRole, setUserRole] = useState(() => localStorage.getItem('role') || "admin");
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('motoexpert_current_view');
    const token = localStorage.getItem('token');
    return (token && saved) ? saved : "landing";
  });
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
    if (isLoggedIn && view !== 'landing') {
      localStorage.setItem('motoexpert_current_view', view);
    }
  }, [view, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (userRole === "empleado" || userRole === "trabajador") {
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
    // No reiniciamos la ruta si es la de confirmación de pago o la de pago
    if (routePath.startsWith('/appointments/') && 
        view !== 'citas' && 
        !routePath.includes('/payment-confirmation') && 
        !routePath.includes('/confirmation') && 
        !routePath.includes('/payment')) {
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
    let redirect = null;
    try {
      redirect = localStorage.getItem('motoexpert_post_login_redirect');
      localStorage.removeItem('motoexpert_post_login_redirect');
    } catch {}

    const isStandardUser = role === 'user' || role === 'cliente' || role === 'usuario';
    if (redirect === 'citas' && isStandardUser) {
      setView('citas');
      return;
    }

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
    localStorage.removeItem("motoexpert_current_view");
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
      transports: ['websocket', 'polling'],
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

    const onServiceTrackingNotification = (payload) => {
      const message = payload?.message;
      if (!message) return;
      showToast(message, 'info');
      try {
        window.dispatchEvent(new CustomEvent('motoexpert:refresh_notifications'));
      } catch {}
    };
    socket.on('service_tracking_notification', onServiceTrackingNotification);

    return () => {
      socket.off('appointment_resolved', onResolved);
      socket.off('service_tracking_notification', onServiceTrackingNotification);
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

          <main className="w-full min-h-screen pt-16 md:pt-16">
            {routePath.startsWith('/employee/service-tracking/') && (
              (userRole === 'empleado' || userRole === 'trabajador') ? (
                <ServiceTracking
                  citaId={routePath.split('/employee/service-tracking/')[1]}
                  userRole="empleado"
                  showToast={showToast}
                  onBack={() => {
                    navigate('/', {});
                    setView('panel_empleado');
                  }}
                />
              ) : (
                <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-center space-y-3">
                  <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    No autorizado
                  </div>
                  <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                    Esta ruta es solo para empleados.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/', {});
                      setView('citas');
                    }}
                    className="h-11 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Ir a mis citas
                  </button>
                </div>
              )
            )}
            {routePath.startsWith('/service-tracking/') && (
              isStandardUser ? (
                <ServiceTracking 
                  citaId={routePath.split('/service-tracking/')[1]}
                  userRole={userRole}
                  showToast={showToast}
                  onBack={() => {
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
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/', {});
                      setView('panel_empleado');
                    }}
                    className="h-11 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    Ir a mi panel
                  </button>
                </div>
              )
            )}
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

            {/* Rutas para confirmación de pago y retorno de Wompi */}
            {(routePath === '/appointments/payment-confirmation' || routePath === '/appointments/confirmation') && (
              (() => {
                // Verificar si tiene query params de Wompi
                const params = new URLSearchParams(window.location.search);
                const hasWompiParams = params.has('id') && params.has('env');
                
                if (hasWompiParams) {
                  return (
                    <WompiReturnHandler
                      onNavigate={navigate}
                      onConfirm={() => {
                        navigate('/', {});
                        setView('citas');
                      }}
                      showToast={showToast}
                    />
                  );
                }
                
                // Si no, es la confirmación normal
                return isStandardUser ? (
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
                );
              })()
            )}

            {routePath.startsWith('/appointments/') ||
            routePath.startsWith('/service-tracking/') ||
            routePath.startsWith('/employee/service-tracking/')
              ? null
              : (
              <>
                {view === "dashboard" && userRole === "admin" && <DashboardAdmin setView={setView} showToast={showToast} unreadNotifications={unreadNotifications} />}
                {view === "dashboard" && (userRole === "empleado" || userRole === "trabajador") && <EmployeeDashboard showToast={showToast} />}
                {view === "dashboard" && (userRole === "user" || userRole === "cliente" || userRole === "usuario") && <UserDashboard setView={setView} showToast={showToast} />}
                {view === "servicios" && <Servicios setView={setView} />}
                {view === "users" && <UsersList setView={setView} activeTab="usuarios" />}
                {view === "admin_empleados" && <UsersList setView={setView} activeTab="empleados" />}
                {view === "admin_citas" && <UsersList setView={setView} activeTab="citas" />}
                {view === "admin_actividad" && <ActivityLogPage />}
          {view === "admin_estadisticas" && <AdminEstadisticas setView={setView} showToast={showToast} />}
          {view === "resenas_admin" && <AdminResenasModeracion showToast={showToast} />}
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
                {view === "cuenta" && <MiCuenta setView={setView} />}
                {view === "seguridad" && <SeguridadView setView={setView} />}
                {view === "panel_empleado" && <PanelEmpleado showToast={showToast} />}
                {view === "empleado_historial" && <EmpleadoHistorial />}
              </>
            )}


          </main>
        </div>
      )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
