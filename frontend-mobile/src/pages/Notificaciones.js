import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, Info, Calendar, X } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = useCallback(async () => {
    try {
      const response = await api.get('/notificaciones');
      setNotificaciones(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificaciones();
  }, [fetchNotificaciones]);

  const marcarComoLeida = async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/marcar-leida`);
      setNotificaciones(notificaciones.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const borrarNotificacion = async (id) => {
    try {
      setNotificaciones(notificaciones.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>CENTRO DE MENSAJES</p>
          <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic' }}>Notificaciones</h1>
        </div>
        <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <Bell size={24} color="var(--primary)" />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {notificaciones.length > 0 ? (
          notificaciones.map((n) => (
            <div 
              key={n.id} 
              className="card" 
              onClick={() => !n.leida && marcarComoLeida(n.id)} 
              style={{ 
                padding: '20px', 
                backgroundColor: n.leida ? 'var(--card-bg)' : 'rgba(61, 110, 245, 0.05)', 
                borderLeft: n.leida ? '1px solid var(--border)' : '4px solid var(--primary)',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); borrarNotificacion(n.id); }} 
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>

              <div style={{ display: 'flex', gap: '18px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: n.leida ? 'var(--bg)' : 'white', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: n.leida ? 'none' : 'var(--shadow-sm)',
                  border: '1px solid var(--border)'
                }}>
                  {n.tipo === 'service_started' ? <Calendar size={22} color="var(--primary)" /> :
                   n.tipo === 'service_completed' ? <CheckCircle2 size={22} color="var(--status-success)" /> :
                   <Info size={22} color="var(--text-muted)" />}
                </div>
                
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal' }}>{n.titulo}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '10px' }}>{n.mensaje}</p>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}>
            <Bell size={48} color="var(--text-muted)" style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '15px' }}>No tienes notificaciones</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Te avisaremos cuando haya novedades.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
