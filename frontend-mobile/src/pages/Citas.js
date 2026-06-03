import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Plus, ChevronLeft, Check, Car, User, Settings, X } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const Citas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    vehiculoId: '',
    servicioId: '',
    empleadoId: ''
  });

  const fetchInitialData = useCallback(async () => {
    try {
      const [citasRes, vehiculosRes, serviciosRes, empleadosRes] = await Promise.all([
        api.get('/citas'),
        api.get('/vehiculos'),
        api.get('/servicios'),
        api.get('/empleados')
      ]);
      setCitas(citasRes.data.data || citasRes.data);
      setVehiculos(vehiculosRes.data);
      setServicios(serviciosRes.data.data || serviciosRes.data);
      setEmpleados(empleadosRes.data.filter(e => e.status === 'activo' || e.estado === 'activo'));
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchDisponibilidad = useCallback(async (fecha, servicioId, empleadoId) => {
    if (!fecha || !servicioId || !empleadoId) return;
    setLoadingSlots(true);
    try {
      const response = await api.get(`/citas/disponibilidad?fecha=${fecha}&servicioId=${servicioId}&empleadoId=${empleadoId}`);
      setDisponibilidad(response.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (currentStep === 4 && formData.fecha && formData.servicioId && formData.empleadoId) {
      fetchDisponibilidad(formData.fecha, formData.servicioId, formData.empleadoId);
    }
  }, [currentStep, formData.fecha, formData.servicioId, formData.empleadoId, fetchDisponibilidad]);

  const handleSubmit = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = {
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio.length === 5 ? `${formData.hora_inicio}:00` : formData.hora_inicio,
        hora_fin: "00:00:00",
        vehiculoId: parseInt(formData.vehiculoId),
        servicioId: parseInt(formData.servicioId),
        empleadoId: parseInt(formData.empleadoId),
        usuarioId: user?.id
      };

      await api.post('/citas', payload);
      setShowForm(false);
      setCurrentStep(1);
      setFormData({ fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '', empleadoId: '' });
      fetchInitialData();
    } catch (err) {
      alert('Error al agendar cita: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toUpperCase()) {
      case 'FINALIZADO': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)', label: 'Completado' };
      case 'EN PROCESO': return { bg: 'rgba(61, 110, 245, 0.1)', color: 'var(--primary)', label: 'En Proceso' };
      case 'CANCELADO': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-error)', label: 'Cancelado' };
      default: return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-pending)', label: 'Pendiente' };
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
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>GESTIÓN DE SERVICIOS</p>
          <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic' }}>Mis Citas</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          style={{ 
            width: '52px', height: '52px', background: 'var(--gradient-primary)', border: 'none', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-md)', cursor: 'pointer'
          }}
        >
          <Plus size={24} color="white" />
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {citas.length > 0 ? (
          citas.map((cita) => {
            const statusStyle = getStatusStyle(cita.estado);
            return (
              <div key={cita.id} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', backgroundColor: 'var(--bg)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        {new Date(cita.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary)' }}>
                        {new Date(cita.fecha).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px', textTransform: 'none', fontStyle: 'normal' }}>{cita.servicio?.nombre}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{cita.vehiculo?.marca} {cita.vehiculo?.modelo} • {cita.vehiculo?.placa}</p>
                    </div>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '10px', backgroundColor: statusStyle.bg, color: statusStyle.color, fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
                    {statusStyle.label}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{cita.hora_inicio.substring(0, 5)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <User size={14} />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{cita.empleado?.nombre?.split(' ')[0]}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} color="var(--border)" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', borderWidth: '2px', background: 'transparent' }}>
            <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '15px' }}>No tienes citas agendadas</p>
            <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '12px 24px', marginTop: '16px' }} onClick={() => setShowForm(true)}>
              + AGENDAR AHORA
            </button>
          </div>
        )}
      </div>

      {/* New Appointment Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(10px)' }}>
          <div className="card" style={{ width: '100%', borderBottomLeftRadius: '0', borderBottomRightRadius: '0', padding: '30px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PASO {currentStep} DE 4</span>
                <h2 style={{ fontSize: '22px', textTransform: 'none', color: 'var(--text)', marginTop: '4px' }}>Nueva Cita</h2>
              </div>
              <button onClick={() => { setShowForm(false); setCurrentStep(1); }} style={{ background: 'none', border: 'none', color: 'var(--text)' }}><X size={24} /></button>
            </div>

            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '700' }}>¿Para qué vehículo?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {vehiculos.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => { setFormData({...formData, vehiculoId: v.id}); setCurrentStep(2); }}
                      style={{ padding: '20px', backgroundColor: formData.vehiculoId === v.id ? 'rgba(61, 110, 245, 0.05)' : 'var(--bg)', borderRadius: '18px', border: formData.vehiculoId === v.id ? '2px solid var(--primary)' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Car size={20} color={formData.vehiculoId === v.id ? 'var(--primary)' : 'var(--text-muted)'} />
                        <div>
                          <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>{v.marca} {v.modelo}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{v.placa}</p>
                        </div>
                      </div>
                      {formData.vehiculoId === v.id && <Check size={20} color="var(--primary)" />}
                    </div>
                  ))}
                  {vehiculos.length === 0 && (
                    <button className="btn-secondary" onClick={() => navigate('/vehiculos')}>+ Agregar Vehículo</button>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '700' }}>¿Qué servicio necesitas?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {servicios.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { setFormData({...formData, servicioId: s.id}); setCurrentStep(3); }}
                      style={{ padding: '20px', backgroundColor: formData.servicioId === s.id ? 'rgba(61, 110, 245, 0.05)' : 'var(--bg)', borderRadius: '18px', border: formData.servicioId === s.id ? '2px solid var(--primary)' : '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>{s.nombre}</p>
                        <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>${Number(s.precio).toLocaleString()}</p>
                      </div>
                      {formData.servicioId === s.id && <Check size={20} color="var(--primary)" />}
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => setCurrentStep(1)}>Volver</button>
              </div>
            )}

            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '700' }}>¿Quién quieres que te atienda?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {empleados.map(e => (
                    <div 
                      key={e.id} 
                      onClick={() => { setFormData({...formData, empleadoId: e.id}); setCurrentStep(4); }}
                      style={{ padding: '20px', backgroundColor: formData.empleadoId === e.id ? 'rgba(61, 110, 245, 0.05)' : 'var(--bg)', borderRadius: '18px', border: formData.empleadoId === e.id ? '2px solid var(--primary)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                        {e.nombre.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>{e.nombre}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Especialista Senior</p>
                      </div>
                      {formData.empleadoId === e.id && <Check size={20} color="var(--primary)" />}
                    </div>
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => setCurrentStep(2)}>Volver</button>
              </div>
            )}

            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '700' }}>Fecha y Hora</p>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', fontSize: '15px', fontWeight: '600' }}
                />
                
                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>Buscando horarios...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {disponibilidad.map(slot => (
                      <div 
                        key={slot.hora} 
                        onClick={() => slot.disponible && setFormData({...formData, hora_inicio: slot.hora})}
                        style={{ 
                          padding: '12px', 
                          borderRadius: '12px', 
                          textAlign: 'center', 
                          backgroundColor: !slot.disponible ? 'var(--bg)' : (formData.hora_inicio === slot.hora ? 'var(--primary)' : 'var(--card-bg)'),
                          color: !slot.disponible ? 'var(--border)' : (formData.hora_inicio === slot.hora ? 'white' : 'var(--text)'),
                          border: '1px solid var(--border)',
                          fontSize: '13px',
                          fontWeight: '800',
                          opacity: slot.disponible ? 1 : 0.4,
                          cursor: slot.disponible ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {slot.hora.substring(0, 5)}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="btn-secondary" onClick={() => setCurrentStep(3)}>Volver</button>
                  <button className="btn-primary" onClick={handleSubmit} disabled={!formData.hora_inicio || !formData.fecha}>AGENDAR CITA</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;
