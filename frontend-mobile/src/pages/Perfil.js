import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Award, Sun, Moon } from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Perfil = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

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
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: '40px', textAlign: 'center', paddingTop: '20px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{ 
            width: '120px', 
            height: '120px', 
            background: 'var(--card-bg)', 
            borderRadius: '2.5rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '50px'
          }}>
            👤
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: '-5px', 
            right: '-5px', 
            width: '38px', 
            height: '38px', 
            background: 'var(--gradient-primary)', 
            borderRadius: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '4px solid var(--bg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Award size={18} color="white" />
          </div>
        </div>
        <h1 style={{ fontSize: '28px', color: 'var(--text)', marginTop: '20px', marginBottom: '6px' }}>{userProfile?.nombre}</h1>
        <div style={{ 
          display: 'inline-block',
          padding: '6px 16px',
          background: 'rgba(61, 110, 245, 0.1)',
          borderRadius: '1rem',
          color: 'var(--primary)',
          fontSize: '11px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Cliente {userProfile?.rank || 'Gold'}
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Info Card */}
        <section className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.05em', margin: '0' }}>INFORMACIÓN PERSONAL</h3>
          </div>
          
          <div style={{ padding: '8px 24px' }}>
            {[
              { icon: <Mail size={18} />, label: 'Email', value: userProfile?.email },
              { icon: <Phone size={18} />, label: 'Teléfono', value: userProfile?.telefono || 'No registrado' },
              { icon: <MapPin size={18} />, label: 'Ubicación', value: userProfile?.direccion || 'AutoClean Center' },
            ].map((item, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '18px', 
                padding: '20px 0',
                borderBottom: idx === 2 ? 'none' : '1px solid var(--border)'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '12px', 
                  background: 'var(--bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--primary)' 
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.02em' }}>{item.label}</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings List */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Theme Toggle Option */}
          <div 
            onClick={toggleTheme}
            className="card" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '12px', 
                background: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isDark ? '#FBBF24' : '#6366F1' 
              }}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>
                  {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Cambiar la apariencia visual
                </span>
              </div>
            </div>
            <div style={{ 
              width: '50px', 
              height: '28px', 
              backgroundColor: isDark ? 'var(--primary)' : 'var(--border)', 
              borderRadius: '100px',
              position: 'relative',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '4px',
                left: isDark ? '26px' : '4px',
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }} />
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="btn-secondary"
            style={{ 
              marginTop: '10px',
              color: '#EF4444',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '18px'
            }}
          >
            <LogOut size={20} />
            CERRAR SESIÓN
          </button>
        </section>
      </div>
    </div>
  );
};

export default Perfil;
