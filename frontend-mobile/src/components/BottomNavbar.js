import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Car, Star, Package, Bell, LayoutGrid } from 'lucide-react';

const BottomNavbar = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [role, setRole] = useState('usuario');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role || user.rol || 'usuario');
    }
    setShowMore(false);
  }, [location.pathname]);

  const getMainItems = () => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'admin') {
      return [
        { icon: <Home size={22} />, label: 'Panel', path: '/' },
        { icon: <Calendar size={22} />, label: 'Citas', path: '/citas' },
        { icon: <Car size={22} />, label: 'Flota', path: '/vehiculos' },
        { icon: <User size={22} />, label: 'Perfil', path: '/perfil' },
      ];
    } else if (normalizedRole === 'empleado' || normalizedRole === 'trabajador') {
      return [
        { icon: <Home size={22} />, label: 'Tareas', path: '/' },
        { icon: <Calendar size={22} />, label: 'Agenda', path: '/citas' },
        { icon: <Bell size={22} />, label: 'Avisos', path: '/notificaciones' },
        { icon: <User size={22} />, label: 'Perfil', path: '/perfil' },
      ];
    } else {
      return [
        { icon: <Home size={22} />, label: 'Inicio', path: '/' },
        { icon: <Calendar size={22} />, label: 'Citas', path: '/citas' },
        { icon: <Car size={22} />, label: 'Vehículos', path: '/vehiculos' },
        { icon: <User size={22} />, label: 'Perfil', path: '/perfil' },
      ];
    }
  };

  const mainItems = getMainItems();

  const moreItems = [
    { icon: <Package size={22} />, label: 'Servicios', path: '/servicios' },
    { icon: <Star size={22} />, label: 'Reseñas', path: '/resenas' },
    { icon: <Bell size={22} />, label: 'Avisos', path: '/notificaciones' },
  ];

  const normalizedRole = role.toLowerCase();
  const isUser = normalizedRole === 'usuario' || normalizedRole === 'user';

  return (
    <>
      {/* Menú Expandible (Solo para Usuario) */}
      {showMore && isUser && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 900, backdropFilter: 'blur(10px)', transition: 'all 0.3s' }} 
          onClick={() => setShowMore(false)}
        >
          <div style={{ 
            position: 'absolute', 
            bottom: 'calc(var(--bottom-nav-height) + 15px)', 
            left: '15px', 
            right: '15px', 
            backgroundColor: 'var(--card-bg)', 
            borderRadius: '2rem', 
            padding: '24px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '15px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            animation: 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={e => e.stopPropagation()}>
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `}</style>
            {moreItems.map(item => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none', color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)' }}
              >
                <div style={{ 
                  width: '54px', 
                  height: '54px', 
                  backgroundColor: location.pathname === item.path ? 'rgba(61, 110, 245, 0.1)' : 'var(--bg)', 
                  borderRadius: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '1px solid var(--border)' 
                }}>
                  {React.cloneElement(item.icon, { size: 24, color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)' })}
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        backgroundColor: 'var(--card-bg)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
      }}>
        {mainItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px 12px',
              borderRadius: '16px',
              transition: 'all 0.2s',
              flex: 1,
              position: 'relative'
            }}
          >
            {location.pathname === item.path && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                width: '4px',
                height: '4px',
                backgroundColor: 'var(--primary)',
                borderRadius: '50%',
                boxShadow: '0 0 10px var(--primary)'
              }} />
            )}
            <div style={{ 
              color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'transform 0.2s',
              transform: location.pathname === item.path ? 'scale(1.1)' : 'scale(1)'
            }}>
              {React.cloneElement(item.icon, { 
                strokeWidth: location.pathname === item.path ? 2.5 : 2 
              })}
            </div>
            <span style={{ 
              fontSize: '9px', 
              fontWeight: '800', 
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              opacity: location.pathname === item.path ? 1 : 0.7
            }}>
              {item.label}
            </span>
          </NavLink>
        ))}

        {isUser && (
          <button
            onClick={() => setShowMore(!showMore)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'transparent',
              border: 'none',
              color: showMore ? 'var(--primary)' : 'var(--text-muted)',
              padding: '8px 12px',
              flex: 1,
              cursor: 'pointer'
            }}
          >
            <LayoutGrid size={22} strokeWidth={showMore ? 2.5 : 2} />
            <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em', opacity: showMore ? 1 : 0.7 }}>MÁS</span>
          </button>
        )}
      </nav>
    </>
  );
};

export default BottomNavbar;
