import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, ChevronRight } from 'lucide-react';
import api from '../services/api';
import AdminHome from './AdminHome';
import EmpleadoHome from './EmpleadoHome';

const Home = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [upcomingCita, setUpcomingCita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, citasRes] = await Promise.all([
          api.get('/usuarios/me'),
          api.get('/citas')
        ]);
        setUserProfile(profileRes.data);
        
        const citas = citasRes.data.data || citasRes.data;
        const next = citas.find(c => c.estado !== 'FINALIZADO' && c.estado !== 'CANCELADO');
        setUpcomingCita(next);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Despachar vista según rol
  const role = (userProfile?.role || '').toLowerCase();
  if (role === 'admin') return <AdminHome />;
  if (role === 'empleado' || role === 'trabajador') return <EmpleadoHome />;
  
  // Vista de Usuario (Default)
  const firstName = userProfile?.nombre?.split(' ')[0] || 'Usuario';

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
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>BIENVENIDO DE VUELTA</p>
          <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic', letterSpacing: '-0.02em' }}>Hola, {firstName}</h1>
        </div>
        <div
          style={{ 
            width: '52px', 
            height: '52px', 
            backgroundColor: 'var(--card-bg)', 
            border: '1px solid var(--border)', 
            borderRadius: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative', 
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
          onClick={() => navigate('/notificaciones')}
        >
          <Bell size={22} color="var(--text)" />
          <div style={{ position: 'absolute', top: '14px', right: '14px', width: '10px', height: '10px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid var(--card-bg)' }} />
        </div>
      </header>

      {/* Hero Card */}
      <section className="card" style={{ 
        background: 'var(--gradient-primary)', 
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '35px',
        padding: '32px',
        boxShadow: '0 20px 40px -10px rgba(61, 110, 245, 0.4)'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '1rem', marginBottom: '20px', backdropFilter: 'blur(10px)' }}>
            <Shield size={14} color="white" />
            <span style={{ fontSize: '11px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente {userProfile?.rank || 'Gold'}</span>
          </div>
          <h2 style={{ color: 'white', fontSize: '28px', marginBottom: '24px', textTransform: 'none', fontStyle: 'normal', lineHeight: '1.2', fontWeight: '800' }}>Tu auto merece<br/>lo mejor del mundo</h2>
          <button 
            style={{ 
              backgroundColor: 'white', 
              color: 'var(--primary)', 
              border: 'none', 
              padding: '16px 28px', 
              borderRadius: '1.25rem', 
              fontWeight: '800', 
              fontSize: '13px', 
              textTransform: 'uppercase', 
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }} 
            onClick={() => navigate('/citas')}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Agendar Ahora
          </button>
        </div>
      </section>

      {/* Next Appointment */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: '800' }}>PRÓXIMA CITA</h3>
          <button 
            style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }} 
            onClick={() => navigate('/citas')}
          >
            Ver todas
          </button>
        </div>
        
        {upcomingCita ? (
          <div 
            className="card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px', 
              padding: '20px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/citas')}
          >
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: 'rgba(61, 110, 245, 0.1)', 
              borderRadius: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(61, 110, 245, 0.1)'
            }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>
                {new Date(upcomingCita.fecha).toLocaleDateString('es-ES', { month: 'short' })}
              </span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>
                {new Date(upcomingCita.fecha).getDate()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal', fontWeight: '800' }}>
                {upcomingCita.servicio?.nombre || 'Servicio Premium'}
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                {upcomingCita.hora_inicio.substring(0, 5)} • {upcomingCita.vehiculo?.placa}
              </p>
            </div>
            <ChevronRight size={24} color="var(--text-muted)" />
          </div>
        ) : (
          <div className="card" style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            borderStyle: 'dashed', 
            borderWidth: '2px',
            background: 'transparent'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '16px' }}>No tienes citas programadas</p>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', display: 'inline-flex', padding: '12px 24px' }}
              onClick={() => navigate('/citas')}
            >
              + AGENDAR AHORA
            </button>
          </div>
        )}
      </section>

      {/* Loyalty Progress */}
      <section style={{ marginTop: '35px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>Programa de Lealtad</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gana puntos por cada servicio</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>{userProfile?.points || 0}</span>
              <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PUNTOS</span>
            </div>
          </div>
          <div style={{ height: '10px', backgroundColor: 'var(--bg)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min(100, ((userProfile?.points || 0) / 1000) * 100)}%`, 
              height: '100%', 
              background: 'var(--gradient-primary)', 
              borderRadius: '5px' 
            }} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', fontWeight: '600', textAlign: 'center' }}>
            Te faltan <span style={{ color: 'var(--text)', fontWeight: '800' }}>{1000 - (userProfile?.points || 0)} pts</span> para ser <span style={{ color: 'var(--primary)', fontWeight: '800' }}>Cliente Platinum</span>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
