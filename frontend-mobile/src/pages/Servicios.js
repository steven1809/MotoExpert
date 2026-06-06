import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, ChevronRight, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 👈 Importamos el hook de redirección
import api from '../services/api';
import '../styles/global.css';

const Servicios = () => {
  const navigate = useNavigate(); // 👈 Inicializamos la función navigate
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
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ marginBottom: '30px', paddingTop: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>CATÁLOGO DE EXPERIENCIAS</p>
        <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic' }}>Servicios</h1>
      </header>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '25px' }}>
        <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
        <input 
          type="text" 
          placeholder="¿Qué servicio buscas?" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', 
            height: '60px', 
            backgroundColor: 'var(--card-bg)', 
            border: '1px solid var(--border)', 
            borderRadius: '20px', 
            padding: '0 20px 0 54px', 
            fontSize: '15px', 
            fontWeight: '600', 
            color: 'var(--text)', 
            boxShadow: 'var(--shadow-sm)',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredServicios.map((s) => (
          <div key={s.id} className="card" onClick={() => setSelectedServicio(s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div style={{ flex: 1, marginRight: '15px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text)', marginBottom: '6px', textTransform: 'none', fontStyle: 'normal' }}>{s.nombre}</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color: 'var(--primary)' }}>${Number(s.precio).toLocaleString()}</span>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--border)' }}></div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>{s.duracion || 45} MIN</span>
              </div>
            </div>
            <div style={{ width: '52px', height: '52px', backgroundColor: 'rgba(61, 110, 245, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(61, 110, 245, 0.1)' }}>
              <Package size={24} color="var(--primary)" />
            </div>
          </div>
        ))}
        
        {filteredServicios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>No encontramos servicios con ese nombre.</p>
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      {selectedServicio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(10px)' }}>
          <div className="card" style={{ width: '100%', borderBottomLeftRadius: '0', borderBottomRightRadius: '0', padding: '32px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', margin: '0', textTransform: 'none', fontStyle: 'normal' }}>{selectedServicio.nombre}</h2>
              <button onClick={() => setSelectedServicio(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={26} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'var(--bg)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '15px', color: 'var(--text)', lineHeight: '1.6', opacity: 0.9 }}>{selectedServicio.descripcion || 'Este servicio incluye limpieza profunda, detallado exterior e interior con productos premium de alta calidad.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '20px', backgroundColor: 'rgba(61, 110, 245, 0.05)', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>PRECIO ESTIMADO</p>
                  <p style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text)' }}>${Number(selectedServicio.precio).toLocaleString()}</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: 'rgba(61, 110, 245, 0.05)', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>DURACIÓN</p>
                  <p style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text)' }}>{selectedServicio.duracion || 45} MIN</p>
                </div>
              </div>

              <button className="btn-primary" onClick={() => { setSelectedServicio(null); navigate('/citas'); }}>
                AGENDAR ESTE SERVICIO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicios;