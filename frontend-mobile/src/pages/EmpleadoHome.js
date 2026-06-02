import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, Calendar, ChevronRight, Activity, TrendingUp, Star, MapPin } from 'lucide-react';
import api from '../services/api';
import '../styles/global.css';

const EmpleadoHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    completed: 0,
    pending: 0,
    rating: 4.9
  });
  const [currentService, setCurrentService] = useState(null);
  const [todayTimeline, setTodayTimeline] = useState([]);

  const fetchEmpleadoData = useCallback(async () => {
    try {
      const response = await api.get('/citas');
      const allCitas = response.data.data || response.data;
      
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const todayApts = allCitas.filter(c => {
        const citaFecha = c.fecha.includes('T') ? c.fecha.split('T')[0] : c.fecha;
        return citaFecha === todayStr;
      });

      const completed = todayApts.filter(c => c.estado === 'FINALIZADO').length;
      const inProgress = todayApts.find(c => c.estado === 'EN PROCESO');
      
      setStats({
        today: todayApts.length,
        completed: completed,
        pending: todayApts.length - completed,
        rating: 4.9
      });

      if (inProgress) {
        setCurrentService({
          id: inProgress.id,
          nombre: inProgress.servicio?.nombre,
          vehiculo: `${inProgress.vehiculo?.marca} ${inProgress.vehiculo?.modelo}`,
          placa: inProgress.vehiculo?.placa,
          horario: inProgress.hora_inicio.substring(0, 5),
          cliente: inProgress.usuario?.nombre
        });
      }

      setTodayTimeline(todayApts.map(c => ({
        time: c.hora_inicio.substring(0, 5),
        service: c.servicio?.nombre,
        status: c.estado
      })).sort((a, b) => a.time.localeCompare(b.time)));

    } catch (err) {
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmpleadoData();
  }, [fetchEmpleadoData]);

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
        <p style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Panel de Especialista</p>
        <h1 style={{ fontSize: '26px', color: '#0F172A', fontStyle: 'italic' }}>Mi Jornada</h1>
      </header>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
        <div className="card" style={{ padding: '20px', backgroundColor: '#EFF6FF', border: 'none' }}>
          <TrendingUp size={20} color="#2563EB" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '24px', fontWeight: '900', color: '#1E40AF' }}>{stats.today}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#3B82F6', textTransform: 'uppercase' }}>Asignados Hoy</p>
        </div>
        <div className="card" style={{ padding: '20px', backgroundColor: '#ECFDF5', border: 'none' }}>
          <CheckCircle2 size={20} color="#059669" style={{ marginBottom: '10px' }} />
          <p style={{ fontSize: '24px', fontWeight: '900', color: '#065F46' }}>{stats.completed}</p>
          <p style={{ fontSize: '10px', fontWeight: '800', color: '#10B981', textTransform: 'uppercase' }}>Completados</p>
        </div>
      </div>

      {/* Current Task */}
      <section style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '12px', color: '#64748B', marginBottom: '15px', letterSpacing: '0.1em' }}>Servicio Actual</h3>
        {currentService ? (
          <div className="card" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: 'none', padding: '25px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
              <Activity size={100} color="white" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', padding: '6px 12px', backgroundColor: 'rgba(37, 99, 235, 0.2)', borderRadius: '100px', border: '1px solid rgba(37, 99, 235, 0.3)', marginBottom: '15px' }}>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#60A5FA', textTransform: 'uppercase' }}>En Proceso • {currentService.horario}</span>
              </div>
              <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '5px', textTransform: 'none', fontStyle: 'normal' }}>{currentService.nombre}</h2>
              <p style={{ color: '#94A3B8', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>{currentService.vehiculo} • {currentService.placa}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{currentService.cliente}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '30px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>No tienes servicios en proceso</p>
          </div>
        )}
      </section>

      {/* Timeline */}
      <section>
        <h3 style={{ fontSize: '12px', color: '#64748B', marginBottom: '15px', letterSpacing: '0.1em' }}>Mi Cronograma</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {todayTimeline.length > 0 ? (
            todayTimeline.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '900', color: '#0F172A' }}>{item.time}</span>
                  <div style={{ width: '2px', flex: 1, backgroundColor: '#E2E8F0', margin: '5px 0' }} />
                </div>
                <div className="card" style={{ flex: 1, padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #F1F5F9' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A' }}>{item.service}</p>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: item.status === 'FINALIZADO' ? '#059669' : '#EA580C', textTransform: 'uppercase' }}>{item.status}</span>
                  </div>
                  <ChevronRight size={18} color="#CBD5E1" />
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px' }}>Sin actividades para hoy</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default EmpleadoHome;
