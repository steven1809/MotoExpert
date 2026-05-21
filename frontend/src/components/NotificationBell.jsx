import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    if (typeof id === 'string') {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones/${id}/marcar-leida`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones/marcar-todas-leidas`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleOverdue = (e) => {
      const payload = e?.detail;
      if (!payload?.appointmentId) return;
      const appointmentId = payload.appointmentId;
      const serviceName = (payload.serviceName || 'Servicio').toUpperCase();
      const plate = (payload.vehiclePlate || '—').toUpperCase();
      const minutes = Number(payload.minutesOverdue || 0);
      const id = `appointment_overdue:${appointmentId}`;

      setNotifications(prev => {
        if (prev.some(n => n.id === id)) return prev;
        const createdAt = new Date().toISOString();
        return [
          {
            id,
            tipo: 'appointment_overdue',
            titulo: 'Cita Atrasada',
            mensaje: `${serviceName} — ${plate} tiene un retraso de ${minutes} minutos`,
            createdAt,
            leida: false,
          },
          ...prev,
        ];
      });
    };

    const handleRefresh = () => {
      fetchNotifications();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('motoexpert:appointment_overdue', handleOverdue);
    window.addEventListener('motoexpert:refresh_notifications', handleRefresh);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('motoexpert:appointment_overdue', handleOverdue);
      window.removeEventListener('motoexpert:refresh_notifications', handleRefresh);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.leida).length;

  const getIconAndStyle = (tipo) => {
    switch (tipo) {
      case 'service_started':
        return {
          icon: (
            <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          bg: 'bg-[#2563EB]/10'
        };
      case 'service_completed':
        return {
          icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bg: 'bg-emerald-500/10'
        };
      case 'new_rating':
        return {
          icon: (
            <svg className="w-5 h-5 text-[#EF9F27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
            </svg>
          ),
          bg: 'bg-[#EF9F27]/10'
        };
      case 'appointment_overdue':
        return {
          icon: (
            <svg className="w-5 h-5 text-[#EF9F27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          bg: 'bg-[#EF9F27]/10'
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          bg: 'bg-[#2a2d3a]'
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-transparent border border-[#2a2d3a] hover:bg-[#1a1d27] transition-all"
      >
        <svg className="w-5 h-5 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center bg-[#E24B4A] text-white text-[10px] font-black ${
            unreadCount > 9 ? 'px-1.5 py-0.5 rounded-full min-w-[20px]' : 'w-5 h-5 rounded-full'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0f1117] border border-[#2a2d3a] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-[#2a2d3a] flex justify-between items-center">
            <h3 className="text-[#F8FAFC] font-bold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#2563EB] text-xs font-bold hover:text-[#1d4ed8] transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <svg className="w-8 h-8 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#94A3B8] italic text-sm">No hay notificaciones aún</p>
              </div>
            ) : (
              notifications.map(notification => {
                const { icon, bg } = getIconAndStyle(notification.tipo);
                return (
                  <div
                    key={notification.id}
                    onClick={() => !notification.leida && markAsRead(notification.id)}
                    className={`p-4 border-b border-[#2a2d3a] cursor-pointer transition-all ${!notification.leida ? 'bg-[#1a2035] border-l-2 border-l-[#2563EB]' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold ${!notification.leida ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                          {notification.titulo}
                        </h4>
                        <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2">
                          {notification.mensaje}
                        </p>
                        <p className="text-[11px] text-[#94A3B8]/70 mt-2">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
