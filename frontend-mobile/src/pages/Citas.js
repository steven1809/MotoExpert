import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, Plus, ChevronLeft, Check, Car, User, Settings } from 'lucide-react';
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
        hora_fin: "00:00:00", // Will be calculated by backend usually
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
    switch (status) {
      case 'FINALIZADO': return { bg: '#ECFDF5', text: '#059669', label: 'Completado' };
      case 'EN PROCESO': return { bg: '#EFF6FF', text: '#2563EB', label: 'En Proceso' };
      case 'CANCELADO': return { bg: '#FEF2F2', text: '#EF4444', label: 'Cancelado' };
      default: return { bg: '#FFF7ED', text: '#EA580C', label: 'Pendiente' };
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
    const steps = ['Vehículo', 'Servicio', 'Especialista', 'Horario', 'Confirmar'];
    const selectedVehicle = vehiculos.find(v => String(v.id) === String(formData.vehiculoId));
    const selectedService = servicios.find(s => String(s.id) === String(formData.servicioId));
    const selectedEmployee = empleados.find(e => String(e.id) === String(formData.empleadoId));

    return (
      <div className="page-container" style={{ backgroundColor: 'white' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => currentStep > 1 ? setCurrentStep(c => c - 1) : setShowForm(false)} style={{ background: 'none', border: 'none', color: '#0F172A' }}>
            <ChevronLeft size={28} />
          </button>
          <h1 style={{ fontSize: '24px', fontStyle: 'italic', textTransform: 'none' }}>Nueva Cita</h1>
        </header>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', backgroundColor: '#F1F5F9', zIndex: 0 }} />
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                backgroundColor: currentStep > i + 1 ? '#2563EB' : currentStep === i + 1 ? '#2563EB' : '#F1F5F9',
                color: currentStep >= i + 1 ? 'white' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '900',
                border: currentStep === i + 1 ? '4px solid #DBEAFE' : 'none'
              }}>
                {currentStep > i + 1 ? <Check size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: currentStep >= i + 1 ? '#0F172A' : '#94A3B8' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ minHeight: '400px' }}>
          {currentStep === 1 && (
            <div className="animate-in slide-in-from-right-4">
              <h3 style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Selecciona tu vehículo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {vehiculos.map(v => (
                  <div key={v.id} onClick={() => { setFormData({ ...formData, vehiculoId: String(v.id) }); setCurrentStep(2); }} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '15px', 
                      padding: '20px', 
                      borderRadius: '24px', 
                      backgroundColor: formData.vehiculoId === String(v.id) ? '#EFF6FF' : '#F8FAFC',
                      border: formData.vehiculoId === String(v.id) ? '2px solid #2563EB' : '1px solid #F1F5F9'
                    }}>
                    <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Car size={24} color="#2563EB" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{v.marca} {v.modelo}</p>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>{v.placa}</p>
                    </div>
                    {formData.vehiculoId === String(v.id) && <Check size={20} color="#2563EB" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-4">
              <h3 style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Selecciona el servicio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {servicios.map(s => (
                  <div key={s.id} onClick={() => { setFormData({ ...formData, servicioId: String(s.id) }); setCurrentStep(3); }} 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '24px', 
                      backgroundColor: formData.servicioId === String(s.id) ? '#EFF6FF' : '#F8FAFC',
                      border: formData.servicioId === String(s.id) ? '2px solid #2563EB' : '1px solid #F1F5F9'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{s.nombre}</p>
                      <p style={{ fontSize: '15px', fontWeight: '900', color: '#2563EB' }}>${Number(s.precio).toLocaleString()}</p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{s.descripcion || 'Servicio profesional de detallado.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-in slide-in-from-right-4">
              <h3 style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Selecciona especialista</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                {empleados.map(e => (
                  <div key={e.id} onClick={() => { setFormData({ ...formData, empleadoId: String(e.id) }); setCurrentStep(4); }} 
                    style={{ 
                      padding: '20px', 
                      borderRadius: '24px', 
                      backgroundColor: formData.empleadoId === String(e.id) ? '#EFF6FF' : '#F8FAFC',
                      border: formData.empleadoId === String(e.id) ? '2px solid #2563EB' : '1px solid #F1F5F9',
                      textAlign: 'center'
                    }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '20px' }}>
                      👤
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{e.nombre}</p>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase' }}>{e.cargo || 'Especialista'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-in slide-in-from-right-4">
              <h3 style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Selecciona fecha y hora</h3>
              <input 
                type="date" 
                value={formData.fecha} 
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value, hora_inicio: '' })}
                style={{ width: '100%', padding: '18px', borderRadius: '18px', border: '1px solid #E2E8F0', fontSize: '16px', fontWeight: '700', marginBottom: '25px', color: '#0F172A' }}
              />

              {formData.fecha && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {loadingSlots ? (
                    <p style={{ gridColumn: 'span 3', textAlign: 'center', padding: '20px', color: '#64748B' }}>Cargando horarios...</p>
                  ) : disponibilidad.length > 0 ? (
                    disponibilidad.map(slot => (
                      <button 
                        key={slot.hora}
                        disabled={!slot.disponible}
                        onClick={() => { setFormData({ ...formData, hora_inicio: slot.hora }); setCurrentStep(5); }}
                        style={{ 
                          padding: '12px', 
                          borderRadius: '14px', 
                          border: formData.hora_inicio === slot.hora ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          backgroundColor: formData.hora_inicio === slot.hora ? '#2563EB' : slot.disponible ? 'white' : '#F1F5F9',
                          color: formData.hora_inicio === slot.hora ? 'white' : slot.disponible ? '#0F172A' : '#CBD5E1',
                          fontSize: '13px',
                          fontWeight: '800',
                          opacity: slot.disponible ? 1 : 0.5
                        }}
                      >
                        {slot.hora.substring(0, 5)}
                      </button>
                    ))
                  ) : (
                    <p style={{ gridColumn: 'span 3', textAlign: 'center', padding: '20px', color: '#64748B' }}>No hay horarios para este día</p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="animate-in slide-in-from-right-4">
              <h3 style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Resumen de tu cita</h3>
              <div className="card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', border: 'none', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={20} color="#2563EB" />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Vehículo</p>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{selectedVehicle?.marca} {selectedVehicle?.modelo}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Settings size={20} color="#2563EB" />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Servicio</p>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{selectedService?.nombre}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} color="#2563EB" />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Fecha y Hora</p>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{formData.fecha} • {formData.hora_inicio.substring(0, 5)}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="#2563EB" />
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>Especialista</p>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>{selectedEmployee?.nombre}</p>
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>Total a pagar</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#2563EB' }}>${Number(selectedService?.precio).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                className="btn-primary" 
                style={{ width: '100%', marginTop: '30px', height: '60px' }}
              >
                Confirmar Reserva
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Mis Citas</h1>
        <button onClick={() => setShowForm(true)} style={{ width: '48px', height: '48px', backgroundColor: '#2563EB', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'white', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)' }}>
          <Plus size={24} />
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {citas.length > 0 ? (
          citas.map((cita) => {
            const status = getStatusStyle(cita.estado);
            return (
              <div key={cita.id} className="card" style={{ padding: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#F8FAFC', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '9px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' }}>
                        {new Date(cita.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A' }}>
                        {new Date(cita.fecha).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A', textTransform: 'none', fontStyle: 'normal', marginBottom: '2px' }}>
                        {cita.servicio?.nombre}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                        {cita.vehiculo?.marca} {cita.vehiculo?.modelo} • {cita.vehiculo?.placa}
                      </p>
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '9px', 
                    fontWeight: '900', 
                    padding: '6px 10px', 
                    backgroundColor: status.bg, 
                    color: status.text, 
                    borderRadius: '100px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {status.label}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '15px', paddingTop: '15px', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
                    <Clock size={14} />
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{cita.hora_inicio.substring(0, 5)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
                    <MapPin size={14} />
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>AutoClean Center</span>
                  </div>
                </div>

                <button 
                  style={{ 
                    position: 'absolute', 
                    right: '20px', 
                    bottom: '18px', 
                    backgroundColor: 'none', 
                    border: 'none', 
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '800',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/tracking/${cita.id}`)}
                >
                  Detalles <ChevronRight size={14} />
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
            <Calendar size={48} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <p style={{ fontWeight: '600' }}>No tienes citas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Citas;
