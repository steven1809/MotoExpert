import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, Calendar, Activity, TrendingUp, Star, Award, Zap, RefreshCcw, PlayCircle, ChevronRight } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const EmpleadoHome = () => {
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedCitaForStart, setSelectedCitaForStart] = useState(null);
  const [stats, setStats] = useState({
    today: 0,
    completed: 0,
    pending: 0,
    rating: 4.9,
    completedPercent: 0
  });
  const [currentService, setCurrentService] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [todayTimeline, setTodayTimeline] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  const fetchEmpleadoData = useCallback(async () => {
    try {
      const response = await api.get('/citas');
      let allCitas = [];
      if (Array.isArray(response.data)) {
        allCitas = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        allCitas = response.data.data;
      }
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      const todayApts = allCitas.filter(c => {
        if (!c.fecha) return false;
        const citaFecha = c.fecha.includes('T') ? c.fecha.split('T')[0] : c.fecha;
        return citaFecha === todayStr;
      });

      const completed = todayApts.filter(c => c.estado?.toUpperCase() === 'FINALIZADO').length;
      const inProgress = allCitas.find(c => c.estado?.toUpperCase() === 'EN PROCESO');
      
      setStats({
        today: todayApts.length,
        completed: completed,
        pending: todayApts.length - completed,
        rating: 4.9,
        completedPercent: todayApts.length > 0 ? Math.round((completed / todayApts.length) * 100) : 0
      });

      if (inProgress) {
        setCurrentService({
          id: inProgress.id,
          nombre: inProgress.servicio?.nombre || 'Servicio General',
          vehiculo: `${inProgress.vehiculo?.marca || ''} ${inProgress.vehiculo?.modelo || ''}`,
          placa: inProgress.vehiculo?.placa || 'Sin Placa',
          horario: `${inProgress.hora_inicio.substring(0, 5)} - ${inProgress.hora_fin?.substring(0, 5) || '...' }`,
          cliente: inProgress.usuario?.nombre || 'Cliente'
        });

        if (tasks.length === 0) {
          setTasks([
            { id: 1, name: 'Diagnóstico inicial', status: 'completed' },
            { id: 2, name: 'Desarmado / Limpieza', status: 'in-progress' },
            { id: 3, name: 'Reparación / Cambio de piezas', status: 'pending' },
            { id: 4, name: 'Prueba de funcionamiento', status: 'pending' },
            { id: 5, name: 'Limpieza final', status: 'pending' }
          ]);
        }
      } else {
        setCurrentService(null);
        setTasks([]);
      }

      setTodayTimeline(todayApts.map(c => ({
        id: c.id,
        time: c.hora_inicio.substring(0, 5),
        service: c.servicio?.nombre,
        vehicle: `${c.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`,
        status: c.estado
      })).sort((a, b) => a.time.localeCompare(b.time)));

      setUpcomingServices(allCitas
        .filter(c => c.estado?.toUpperCase() === 'PENDIENTE')
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          time: c.hora_inicio.substring(0, 5),
          name: c.servicio?.nombre,
          vehicle: c.vehiculo?.modelo,
          date: c.fecha.split('T')[0]
        })));

      setRecentHistory(allCitas
        .filter(c => c.estado?.toUpperCase() === 'FINALIZADO')
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          name: c.servicio?.nombre,
          vehicle: c.vehiculo?.modelo,
          rating: '5.0'
        })));

    } catch (err) {
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  }, [tasks.length]);

  useEffect(() => {
    fetchEmpleadoData();
  }, [fetchEmpleadoData]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado: status });
      fetchEmpleadoData();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const toggleTask = (taskId) => {
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const openStartConfirmation = (cita) => {
    setSelectedCitaForStart(cita);
    setShowStartModal(true);
  };

  const confirmStartService = () => {
    if (selectedCitaForStart) {
      handleUpdateStatus(selectedCitaForStart.id, 'EN PROCESO');
      setShowStartModal(false);
      setSelectedCitaForStart(null);
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
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      <style>{`
        @keyframes vitalPulse {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; text-shadow: 0 0 15px var(--primary); }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .vital-icon-pulse {
          animation: vitalPulse 2s infinite ease-in-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .modal-overlay {
          animation: modalFadeIn 0.3s ease-out;
        }
        .modal-content {
          animation: modalSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>ESPECIALISTA / DASHBOARD</p>
          <h1 style={{ fontSize: '28px', color: 'var(--text)', fontStyle: 'italic', letterSpacing: '-0.02em' }}>Mi Jornada</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {
              setLoading(true);
              fetchEmpleadoData();
            }}
            style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}
          >
            <RefreshCcw size={20} color="var(--text-muted)" />
          </button>
          <div className="vital-icon-pulse" style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'rgba(61, 110, 245, 0.1)', border: '1px solid rgba(61, 110, 245, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="var(--primary)" />
          </div>
        </div>
      </header>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)', lineHeight: '1', marginBottom: '6px' }}>{stats.today}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ASIGNADOS</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontSize: '32px', fontWeight: '900', color: 'var(--status-success)', lineHeight: '1', marginBottom: '6px' }}>{stats.completedPercent}%</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EFICIENCIA</p>
        </div>
      </div>

      {/* Current Task */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SERVICIO EN CURSO</h3>
          {currentService && <div className="vital-icon-pulse" style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }}></div>}
        </div>
        
        {currentService ? (
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', background: 'var(--gradient-primary)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '800', marginBottom: '6px', textTransform: 'none', fontStyle: 'normal' }}>{currentService.nombre}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: '600' }}>{currentService.vehiculo} • {currentService.placa}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>
                  {currentService.horario}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.8 }}>PROGRESO DE TAREAS</span>
                <span style={{ fontSize: '10px', fontWeight: '900' }}>{tasks.filter(t => t.status === 'completed').length}/{tasks.length}</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(tasks.filter(t => t.status === 'completed').length / (tasks.length || 1)) * 100}%`, height: '100%', backgroundColor: 'white', transition: 'width 0.5s ease' }}></div>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map((task) => {
                const isCompleted = task.status === 'completed';
                return (
                  <div 
                    key={task.id} 
                    onClick={() => toggleTask(task.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '16px', 
                      backgroundColor: 'var(--bg)', 
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1px solid var(--border)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '8px', 
                      border: `2px solid ${isCompleted ? 'var(--status-success)' : 'var(--border)'}`,
                      backgroundColor: isCompleted ? 'var(--status-success)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isCompleted && <CheckCircle2 size={16} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      color: isCompleted ? 'var(--text-muted)' : 'var(--text)',
                      textDecoration: isCompleted ? 'line-through' : 'none'
                    }}>{task.name}</span>
                  </div>
                );
              })}
              
              <button 
                onClick={() => handleUpdateStatus(currentService.id, 'FINALIZADO')}
                className="btn-primary"
                style={{ marginTop: '10px' }}
              >
                FINALIZAR SERVICIO
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '50px 20px', borderStyle: 'dashed', borderWidth: '2px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: 'var(--bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Clock size={30} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '700' }}>Sin servicios activos</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Inicia una cita de tu cronograma</p>
          </div>
        )}
      </section>

      {/* Mi Cronograma Hoy */}
      <section style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>CRONOGRAMA DIARIO</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todayTimeline.length > 0 ? (
            todayTimeline.map((item, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '18px' }}>
                <div style={{ width: '50px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: '900', color: 'var(--text)' }}>{item.time}</p>
                </div>
                <div style={{ width: '1px', height: '30px', backgroundColor: 'var(--border)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)' }}>{item.service}</p>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>{item.vehicle}</p>
                </div>
                {item.status?.toUpperCase() === 'PENDIENTE' ? (
                  <button 
                    onClick={() => openStartConfirmation(item)}
                    style={{ 
                      backgroundColor: 'rgba(61, 110, 245, 0.1)', 
                      color: 'var(--primary)', 
                      border: '1px solid rgba(61, 110, 245, 0.2)', 
                      borderRadius: '12px', 
                      padding: '10px 16px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}
                  >
                    <PlayCircle size={16} />
                    INICIAR
                  </button>
                ) : (
                  <div className={`badge ${item.status?.toUpperCase() === 'FINALIZADO' ? 'badge-success' : 'badge-pending'}`}>
                    {item.status}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sin actividades programadas</p>
            </div>
          )}
        </div>
      </section>

      {/* Start Service Modal */}
      {showStartModal && (
        <div className="modal-overlay" style={{
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
          <div className="modal-content card" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '40px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(61, 110, 245, 0.1)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'var(--primary)'
            }}>
              <PlayCircle size={40} />
            </div>
            <h2 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '12px', textTransform: 'none', fontStyle: 'normal', fontWeight: '800' }}>¿Iniciar Servicio?</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.5' }}>
              Comenzarás el cronómetro para el servicio de <strong>{selectedCitaForStart?.service}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn-primary" onClick={confirmStartService}>SÍ, COMENZAR AHORA</button>
              <button className="btn-secondary" onClick={() => setShowStartModal(false)}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpleadoHome;
