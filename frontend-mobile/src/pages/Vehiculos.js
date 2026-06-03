import React, { useState, useEffect, useCallback } from 'react';
import { Car, Plus, ChevronLeft, Check, Trash2, Shield, Info, ArrowLeft, X } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const Vehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    placa: '',
    tipo: 'auto'
  });

  const fetchVehiculos = useCallback(async () => {
    try {
      const response = await api.get('/vehiculos');
      setVehiculos(response.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = {
        ...formData,
        usuarioId: user?.id,
        anio: parseInt(formData.anio)
      };

      await api.post('/vehiculos', payload);
      setShowForm(false);
      setFormData({ marca: '', modelo: '', anio: new Date().getFullYear(), placa: '', tipo: 'auto' });
      fetchVehiculos();
    } catch (err) {
      alert('Error al agregar vehículo: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este vehículo?')) {
      try {
        await api.delete(`/vehiculos/${id}`);
        fetchVehiculos();
      } catch (err) {
        alert('Error al eliminar');
      }
    }
  };

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingTop: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>GESTIÓN DE FLOTA</p>
          <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic' }}>Vehículos</h1>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{ 
              width: '52px', height: '52px', background: 'var(--gradient-primary)', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', cursor: 'pointer'
            }}
          >
            <Plus size={24} color="white" />
          </button>
        )}
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {vehiculos.length > 0 ? (
          vehiculos.map((v) => (
            <div key={v.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ width: '56px', height: '56px', backgroundColor: 'var(--bg)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <Car size={28} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal' }}>{v.marca} {v.modelo}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>PLACA: {v.placa}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(v.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--status-error)', opacity: 0.6, padding: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  AÑO: {v.anio}
                </div>
                <div style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg)', fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TIPO: {v.tipo}
                </div>
              </div>
            </div>
          ))
        ) : !showForm && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}>
            <Car size={48} color="var(--text-muted)" style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '15px' }}>No tienes vehículos registrados</p>
            <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '12px 24px', marginTop: '16px' }} onClick={() => setShowForm(true)}>
              + REGISTRAR VEHÍCULO
            </button>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(10px)' }}>
          <div className="card" style={{ width: '100%', borderBottomLeftRadius: '0', borderBottomRightRadius: '0', padding: '30px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '22px', textTransform: 'none', color: 'var(--text)', margin: '0' }}>Nuevo Vehículo</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X size={26} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {['auto', 'suv', 'moto', 'otro'].map(t => (
                  <div key={t} onClick={() => setFormData({ ...formData, tipo: t })} 
                    style={{ 
                      padding: '16px', 
                      borderRadius: '16px', 
                      textAlign: 'center', 
                      backgroundColor: formData.tipo === t ? 'var(--primary)' : 'var(--bg)',
                      color: formData.tipo === t ? 'white' : 'var(--text)',
                      border: formData.tipo === t ? '2px solid var(--primary)' : '1px solid var(--border)',
                      fontSize: '12px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}>
                    {t}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="Marca (Ej: Toyota)" 
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  required
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                />
                <input 
                  type="text" 
                  placeholder="Modelo (Ej: Corolla)" 
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  required
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                />
                <input 
                  type="number" 
                  placeholder="Año" 
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  required
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                />
                <input 
                  type="text" 
                  placeholder="Placa" 
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  required
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>CANCELAR</button>
                <button type="submit" className="btn-primary">GUARDAR VEHÍCULO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;
