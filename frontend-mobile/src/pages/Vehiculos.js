import React, { useState, useEffect, useCallback } from 'react';
import { Car, Plus, ChevronLeft, Check, Trash2, Shield, Info, ArrowLeft } from 'lucide-react';
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
        <div className="loader" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="page-container" style={{ backgroundColor: 'white' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#0F172A' }}>
            <ArrowLeft size={28} />
          </button>
          <h1 style={{ fontSize: '24px', fontStyle: 'italic', textTransform: 'none' }}>Nuevo Vehículo</h1>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '25px', border: 'none', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {['auto', 'suv', 'moto', 'otro'].map(t => (
                <div key={t} onClick={() => setFormData({ ...formData, tipo: t })} 
                  style={{ 
                    padding: '15px', 
                    borderRadius: '18px', 
                    textAlign: 'center', 
                    backgroundColor: formData.tipo === t ? '#2563EB' : 'white',
                    color: formData.tipo === t ? 'white' : '#64748B',
                    border: formData.tipo === t ? '2px solid #2563EB' : '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: '800',
                    textTransform: 'uppercase'
                  }}>
                  {t}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginLeft: '4px' }}>Marca</label>
              <input required value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} placeholder="Ej: Toyota" 
                style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '700' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginLeft: '4px' }}>Modelo</label>
              <input required value={formData.modelo} onChange={e => setFormData({ ...formData, modelo: e.target.value })} placeholder="Ej: Corolla" 
                style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '700' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginLeft: '4px' }}>Año</label>
                <input required type="number" value={formData.anio} onChange={e => setFormData({ ...formData, anio: e.target.value })} 
                  style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '700' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '10px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginLeft: '4px' }}>Placa</label>
                <input required value={formData.placa} onChange={e => setFormData({ ...formData, placa: e.target.value })} placeholder="ABC-123" 
                  style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase' }} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ height: '60px', marginTop: '10px' }}>Registrar Vehículo</button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Mis Vehículos</h1>
        <button onClick={() => setShowForm(true)} style={{ width: '48px', height: '48px', backgroundColor: '#2563EB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'white', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
          <Plus size={24} />
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {vehiculos.length > 0 ? (
          vehiculos.map(v => (
            <div key={v.id} className="card" style={{ padding: '20px', border: 'none', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ width: '60px', height: '60px', backgroundColor: '#F8FAFC', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                  <Car size={28} color="#2563EB" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', textTransform: 'none', fontStyle: 'normal' }}>{v.marca} {v.modelo}</h4>
                    <span style={{ padding: '4px 8px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '10px', fontWeight: '900', color: '#64748B' }}>{v.anio}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} color="#2563EB" />
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#2563EB', letterSpacing: '0.05em' }}>{v.placa}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
                  <Info size={14} />
                  <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{v.tipo}</span>
                </div>
                <button onClick={() => handleDelete(v.id)} style={{ padding: '8px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: 'none', color: '#EF4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <Car size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '600' }}>No tienes vehículos registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vehiculos;
