import React, { useState, useEffect } from 'react';
import { Calendar, Car, Star, Shield, Bell, ChevronRight } from 'lucide-react';
import api from '../services/api';

const Home = () => {
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

  const firstName = userProfile?.nombre?.split(' ')[0] || 'Usuario';

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Bienvenido de vuelta</p>
          <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Hola, {firstName}</h1>
        </div>
        <div style={{ width: '48px', height: '48px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Bell size={20} color="#64748B" />
          <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', backgroundColor: '#EF4444', borderRadius: '50%', border: '2px solid white' }} />
        </div>
      </header>

      {/* Hero Card */}
      <section className="card" style={{ 
        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', 
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '30px',
        padding: '30px'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', blur: '40px' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '100px', marginBottom: '15px' }}>
            <Shield size={12} color="white" />
            <span style={{ fontSize: '10px', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente {userProfile?.rank || 'Gold'}</span>
          </div>
          <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '10px', textTransform: 'none', fontStyle: 'normal' }}>Tu auto merece<br/>lo mejor</h2>
          <button style={{ backgroundColor: 'white', color: '#2563EB', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>
            Agendar Ahora
          </button>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '12px', color: '#64748B', marginBottom: '15px', letterSpacing: '0.1em' }}>Accesos Rápidos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
          {[
            { label: 'Citas', icon: <Calendar size={24} />, color: '#EFF6FF', iconColor: '#2563EB' },
            { label: 'Vehículos', icon: <Car size={24} />, color: '#FFF7ED', iconColor: '#EA580C' },
            { label: 'Reseñas', icon: <Star size={24} />, color: '#FAF5FF', iconColor: '#9333EA' },
            { label: 'Puntos', icon: <Shield size={24} />, color: '#ECFDF5', iconColor: '#059669' },
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: 'none', backgroundColor: 'white' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: item.color, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {React.cloneElement(item.icon, { color: item.iconColor })}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Next Appointment */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.1em' }}>Próxima Cita</h3>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>Ver todas</span>
        </div>
        
        {upcomingCita ? (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#EFF6FF', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #DBEAFE' }}>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase' }}>
                {new Date(upcomingCita.fecha).toLocaleDateString('es-ES', { month: 'short' })}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#2563EB' }}>
                {new Date(upcomingCita.fecha).getDate()}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '14px', color: '#0F172A', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal', fontWeight: '800' }}>
                {upcomingCita.servicio?.nombre || 'Servicio Premium'}
              </h4>
              <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                {upcomingCita.hora_inicio.substring(0, 5)} • {upcomingCita.vehiculo?.placa}
              </p>
            </div>
            <ChevronRight size={20} color="#CBD5E1" />
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '30px', borderStyle: 'dashed' }}>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>No tienes citas programadas</p>
            <button style={{ marginTop: '10px', color: '#2563EB', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', background: 'none', border: 'none' }}>
              + Agendar Ahora
            </button>
          </div>
        )}
      </section>

      {/* Loyalty Progress */}
      <section style={{ marginTop: '30px' }}>
        <div className="card" style={{ backgroundColor: '#F1F5F9', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A' }}>Programa de Lealtad</span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB' }}>{userProfile?.points || 0} pts</span>
          </div>
          <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((userProfile?.points || 0) / 1000) * 100)}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '4px' }} />
          </div>
          <p style={{ fontSize: '10px', color: '#64748B', marginTop: '10px', fontWeight: '600', textAlign: 'center' }}>
            Te faltan {1000 - (userProfile?.points || 0)} pts para ser <span style={{ color: '#0F172A', fontWeight: '800' }}>Cliente Platinum</span>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
