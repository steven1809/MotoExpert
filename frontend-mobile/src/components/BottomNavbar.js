import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, User, Car, Star, Package, Bell } from 'lucide-react';

const BottomNavbar = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { icon: <Home size={22} />, label: 'Inicio', path: '/' },
    { icon: <Calendar size={22} />, label: 'Citas', path: '/citas' },
    { icon: <Car size={22} />, label: 'Vehículos', path: '/vehiculos' },
    { icon: <User size={22} />, label: 'Perfil', path: '/perfil' },
  ];

  const moreItems = [
    { icon: <Package size={22} />, label: 'Catálogo', path: '/servicios' },
    { icon: <Star size={22} />, label: 'Reseñas', path: '/resenas' },
    { icon: <Bell size={22} />, label: 'Avisos', path: '/notificaciones' },
  ];

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setShowMore(false);
  }, [location.pathname]);

  return (
    <>
      {/* Menú Expandible (More) */}
      {showMore && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 900 }} onClick={() => setShowMore(false)}>
          <div className="animate-in slide-in-from-bottom duration-300" style={{ 
            position: 'absolute', 
            bottom: 'var(--bottom-nav-height)', 
            left: '20px', 
            right: '20px', 
            backgroundColor: 'white', 
            borderRadius: '24px', 
            padding: '20px', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '15px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
          }} onClick={e => e.stopPropagation()}>
            {moreItems.map(item => (
              <NavLink key={item.path} to={item.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none', color: location.pathname === item.path ? '#2563EB' : '#64748B' }}>
                <div style={{ width: '44px', height: '44px', backgroundColor: location.pathname === item.path ? '#EFF6FF' : '#F8FAFC', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.cloneElement(item.icon, { color: location.pathname === item.path ? '#2563EB' : '#94A3B8' })}
                </div>
                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>{item.label}</span>
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
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 1000,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.05)'
      }}>
        {mainItems.slice(0, 2).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? '#2563EB' : '#94A3B8',
              transition: 'all 0.2s ease',
              width: '20%'
            })}
          >
            {item.icon}
            <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>{item.label}</span>
          </NavLink>
        ))}

        {/* Botón Central More */}
        <button 
          onClick={() => setShowMore(!showMore)}
          style={{ 
            width: '56px', 
            height: '56px', 
            backgroundColor: '#2563EB', 
            borderRadius: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            border: 'none', 
            color: 'white', 
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)',
            marginTop: '-25px',
            transition: 'transform 0.2s'
          }}
          className={showMore ? 'rotate-45' : ''}
        >
          <Plus size={28} />
          <style>{`.rotate-45 { transform: rotate(45deg); }`}</style>
        </button>

        {mainItems.slice(2, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              color: isActive ? '#2563EB' : '#94A3B8',
              transition: 'all 0.2s ease',
              width: '20%'
            })}
          >
            {item.icon}
            <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

const Plus = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

export default BottomNavbar;
