import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Award } from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Perfil = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/usuarios/me');
        setUserProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            backgroundColor: 'white', 
            borderRadius: '35px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '4px solid white',
            boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
            fontSize: '40px'
          }}>
            👤
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: '0', 
            right: '0', 
            width: '32px', 
            height: '32px', 
            backgroundColor: '#2563EB', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '3px solid white'
          }}>
            <Award size={16} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: '24px', color: '#0F172A', marginTop: '15px', marginBottom: '4px' }}>{userProfile?.nombre}</h1>
        <p style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cliente {userProfile?.rank || 'Gold'}</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {/* Info Card */}
        <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '11px', color: '#64748B', letterSpacing: '0.1em', marginBottom: '0' }}>Información de la Cuenta</h3>
          </div>
          
          <div style={{ padding: '10px 20px' }}>
            {[
              { icon: <Mail size={18} />, label: 'Email', value: userProfile?.email },
              { icon: <Phone size={18} />, label: 'Teléfono', value: userProfile?.telefono || 'No registrado' },
              { icon: <MapPin size={18} />, label: 'Ubicación', value: userProfile?.direccion || 'AutoClean Center' },
            ].map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                padding: '15px 0',
                borderBottom: idx === 2 ? 'none' : '1px solid #F1F5F9'
              }}>
                <div style={{ color: '#94A3B8' }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings List */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Mis Vehículos', icon: <ChevronRight size={18} /> },
            { label: 'Historial de Pagos', icon: <ChevronRight size={18} /> },
            { label: 'Configuración', icon: <ChevronRight size={18} /> },
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ 
              padding: '18px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              border: '1px solid #F1F5F9'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{item.label}</span>
              <div style={{ color: '#CBD5E1' }}>{item.icon}</div>
            </div>
          ))}
        </section>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{ 
            marginTop: '10px',
            backgroundColor: '#FEF2F2', 
            color: '#EF4444', 
            border: '1px solid #FEE2E2', 
            padding: '18px', 
            borderRadius: '20px', 
            fontWeight: '900', 
            fontSize: '13px', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%'
          }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Perfil;
