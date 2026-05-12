import React, { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_TIME = 14 * 60 * 1000; // 14 minutos para el aviso
const LOGOUT_TIME = 15 * 60 * 1000;   // 15 minutos para el cierre total

const InactivityHandler = ({ onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

  const resetTimers = useCallback(() => {
    // Si el modal de advertencia está visible, no reiniciamos por actividad automática
    if (showWarning) return;

    // Limpiar temporizadores existentes
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    // Configurar temporizador para mostrar aviso a los 14 minutos
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIME);

    // Configurar temporizador para cierre automático a los 15 minutos
    logoutTimerRef.current = setTimeout(() => {
      handleAutoLogout();
    }, LOGOUT_TIME);
  }, [showWarning]);

  const handleAutoLogout = () => {
    setShowWarning(false);
    onLogout();
  };

  const handleContinueSession = () => {
    setShowWarning(false);
    // Al cerrar el modal manualmente, reiniciamos los timers
    // Usamos un pequeño delay o forzamos el reinicio
    setTimeout(() => {
      resetTimers();
    }, 100);
  };

  useEffect(() => {
    // Eventos a detectar para considerar actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      resetTimers();
    };

    // Agregar listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Inicializar timers al montar
    resetTimers();

    // Limpieza al desmontar
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-100 transform animate-in zoom-in duration-300">
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold italic tracking-tighter">Sesión por Expirar</h3>
        </div>
        
        <div className="p-8 text-center">
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Tu sesión está a punto de expirar por inactividad. <br />
            <span className="font-bold text-slate-800">¿Deseas continuar conectado?</span>
          </p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={handleContinueSession}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95 text-lg"
            >
              Continuar Sesión
            </button>
            <button 
              onClick={handleAutoLogout}
              className="w-full py-3 text-gray-400 hover:text-red-500 font-medium transition-colors text-sm"
            >
              Cerrar Sesión Ahora
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full animate-[progress_60s_linear]" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2 font-bold">Tiempo restante: 1 minuto</p>
        </div>
      </div>
    </div>
  );
};

export default InactivityHandler;
