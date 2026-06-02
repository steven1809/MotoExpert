import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, ChevronRight, Info } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServicio, setSelectedServicio] = useState(null);

  const fetchServicios = useCallback(async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  const filteredServicios = servicios.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Catálogo</h1>
        <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nuestros servicios de detallado</p>
      </header>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '25px' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar servicio..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', height: '56px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '18px', padding: '0 20px 0 52px', fontSize: '15px', fontWeight: '600', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredServicios.map((s) => (
          <div key={s.id} className="card" onClick={() => setSelectedServicio(s)} style={{ padding: '20px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, marginRight: '15px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal' }}>{s.nombre}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#2563EB' }}>${Number(s.precio).toLocaleString()}</span>
                <span style={{ color: '#E2E8F0' }}>•</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{s.duracion || 45} min</span>
              </div>
            </div>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#F0F9FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#0EA5E9" />
            </div>
          </div>
        ))}
      </div>

      {/* Service Detail Modal */}
      {selectedServicio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="animate-in slide-in-from-bottom duration-300" style={{ width: '100%', backgroundColor: 'white', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '30px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', textTransform: 'none' }}>{selectedServicio.nombre}</h2>
              <button onClick={() => setSelectedServicio(null)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.6' }}>{selectedServicio.descripcion || 'Este servicio incluye limpieza profunda, detallado exterior e interior con productos premium.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ padding: '15px', backgroundColor: '#F0F9FF', borderRadius: '18px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#0EA5E9', textTransform: 'uppercase', marginBottom: '4px' }}>Precio</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#0369A1' }}>${Number(selectedServicio.precio).toLocaleString()}</p>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#FDF2F8', borderRadius: '18px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#DB2777', textTransform: 'uppercase', marginBottom: '4px' }}>Duración</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#9D174D' }}>{selectedServicio.duracion || 45} min</p>
                </div>
              </div>

              <button onClick={() => { setSelectedServicio(null); /* Podría navegar a agendar con este servicio */ }} className="btn-primary" style={{ width: '100%', height: '60px' }}>Reservar ahora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default Servicios;
