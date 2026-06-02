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
      // Si existe el endpoint de borrar
      // await api.delete(`/notificaciones/${id}`);
      setNotificaciones(notificaciones.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Notificaciones</h1>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mantente al tanto de tu servicio</p>
        </div>
        <Bell size={28} color="#2563EB" />
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {notificaciones.length > 0 ? (
          notificaciones.map((n) => (
            <div key={n.id} className="card" onClick={() => !n.leida && marcarComoLeida(n.id)} style={{ 
              padding: '20px', 
              backgroundColor: n.leida ? 'white' : '#F0F9FF', 
              borderLeft: n.leida ? '1px solid #E2E8F0' : '4px solid #2563EB',
              position: 'relative'
            }}>
              <button onClick={(e) => { e.stopPropagation(); borrarNotificacion(n.id); }} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#CBD5E1' }}>
                <X size={16} />
              </button>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  backgroundColor: n.leida ? '#F8FAFC' : 'white', 
                  borderRadius: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: n.leida ? 'none' : '0 4px 10px rgba(37, 99, 235, 0.1)'
                }}>
                  {n.tipo === 'service_started' ? <Calendar size={20} color="#2563EB" /> :
                   n.tipo === 'service_completed' ? <CheckCircle2 size={20} color="#059669" /> :
                   <Info size={20} color="#64748B" />}
                </div>
                
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal' }}>{n.titulo}</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', marginBottom: '8px' }}>{n.mensaje}</p>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                    {new Date(n.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94A3B8' }}>
            <Bell size={50} style={{ marginBottom: '20px', opacity: 0.2 }} />
            <p style={{ fontWeight: '600' }}>No tienes notificaciones nuevas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificaciones;
