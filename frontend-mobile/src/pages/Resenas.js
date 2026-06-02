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
      // Filtrar por el usuario actual
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
          color={s <= value ? '#FBBF24' : '#E2E8F0'}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Mis Reseñas</h1>
        <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tu opinión nos ayuda a mejorar</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {resenas.length > 0 ? (
          resenas.map((r) => (
            <div key={r.id} className="card" onClick={() => setSelectedResena(r)} style={{ padding: '20px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>
                    {r.cita?.servicio?.nombre || 'Servicio AutoClean'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StarRating value={Math.round((r.serviceRating + r.specialistRating) / 2)} />
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8' }}>
                      {new Date(r.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="#2563EB" />
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '15px', fontStyle: 'italic' }}>
                "{r.comment || 'Sin comentarios adicionales.'}"
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Especialista: {r.cita?.empleado?.nombre || 'AutoClean'}
                </span>
                <ChevronRight size={18} color="#CBD5E1" />
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <Star size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
            <p style={{ fontWeight: '600' }}>Aún no has calificado ningún servicio</p>
          </div>
        )}
      </div>

      {/* Detalle de Reseña (Modal simple) */}
      {selectedResena && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="animate-in slide-in-from-bottom duration-300" style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '30px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', textTransform: 'none' }}>Detalle de Calificación</h2>
              <button onClick={() => setSelectedResena(null)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#64748B' }}>Servicio</span>
                <StarRating value={selectedResena.serviceRating} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: '#64748B' }}>Especialista</span>
                <StarRating value={selectedResena.specialistRating} />
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '20px' }}>
                <p style={{ fontSize: '14px', color: '#0F172A', fontWeight: '600' }}>{selectedResena.comment}</p>
              </div>
              <button onClick={() => setSelectedResena(null)} className="btn-primary" style={{ width: '100%' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resenas;
