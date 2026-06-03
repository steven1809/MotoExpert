import React, { useState, useEffect, useCallback } from 'react';
import { Star, Clock, FileText, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const Resenas = () => {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResena, setSelectedResena] = useState(null);

  const fetchResenas = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;

      const response = await api.get('/ratings');
      const allRatings = response.data.data || response.data;
      const userRatings = allRatings.filter(r => String(r.usuario?.id) === String(user.id));
      setResenas(userRatings);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResenas();
  }, [fetchResenas]);

  const StarRating = ({ value }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          fill={s <= value ? '#FBBF24' : 'none'}
          color={s <= value ? '#FBBF24' : 'var(--border)'}
        />
      ))}
    </div>
  );

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
      <header style={{ marginBottom: '30px', paddingTop: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>EXPERIENCIAS PASADAS</p>
        <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic' }}>Mis Reseñas</h1>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {resenas.length > 0 ? (
          resenas.map((r) => (
            <div key={r.id} className="card" onClick={() => setSelectedResena(r)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', marginBottom: '6px', textTransform: 'none', fontStyle: 'normal' }}>
                    {r.cita?.servicio?.nombre || 'Servicio Premium'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StarRating value={Math.round((r.serviceRating + r.specialistRating) / 2)} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--bg)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <FileText size={22} color="var(--primary)" />
                </div>
              </div>
              
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '18px', fontStyle: 'italic', opacity: 0.9 }}>
                "{r.comment || 'Sin comentarios adicionales.'}"
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>
                    {r.cita?.empleado?.nombre?.charAt(0) || 'A'}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Especialista: {r.cita?.empleado?.nombre || 'AutoClean'}
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}>
            <Star size={48} color="var(--text-muted)" style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '15px' }}>Aún no has calificado ningún servicio</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Tu opinión aparecerá aquí después de calificar.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedResena && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)', margin: '0', textTransform: 'none', fontStyle: 'normal' }}>Detalle de Reseña</h2>
              <button onClick={() => setSelectedResena(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>CALIFICACIÓN SERVICIO</p>
                <StarRating value={selectedResena.serviceRating} />
              </div>
              
              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>CALIFICACIÓN ESPECIALISTA</p>
                <StarRating value={selectedResena.specialistRating} />
              </div>

              <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>COMENTARIO</p>
                <p style={{ fontSize: '14px', color: 'var(--text)', fontStyle: 'italic', margin: '0' }}>"{selectedResena.comment || 'Sin comentarios.'}"</p>
              </div>

              <button className="btn-primary" onClick={() => setSelectedResena(null)}>CERRAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resenas;
