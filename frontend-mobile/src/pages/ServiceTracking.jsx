import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, Car } from 'lucide-react';
import api from '../services/api';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ServiceTracking = () => {
  const { citaId } = useParams();
  const navigate = useNavigate();
  
  const [cita, setCita] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchCita = useCallback(async () => {
    try {
      const response = await api.get(`/citas/${citaId}`);
      setCita(response.data);
    } catch (e) {
      setError(e.message || 'Error al cargar la cita');
    }
  }, [citaId]);

  const fetchStages = useCallback(async () => {
    try {
      const response = await fetch(`${API}/citas/${citaId}/stages`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      setStages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading stages:', e);
    }
  }, [citaId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCita(), fetchStages()]);
      setLoading(false);
    };
    if (citaId) {
      loadData();
    }
  }, [citaId, fetchCita, fetchStages]);

  // Polling para actualizar el estado
  useEffect(() => {
    if (!citaId) return;
    const interval = setInterval(fetchStages, 4000);
    return () => clearInterval(interval);
  }, [citaId, fetchStages]);

  const normalizedStages = useMemo(() => {
    const TITLES = { 
      RECEPCION: 'Recepción', 
      DIAGNOSTICO: 'Diagnóstico', 
      EN_PROCESO: 'En Proceso', 
      FINALIZADO: 'Finalizado' 
    };
    const ORDER = ['RECEPCION', 'DIAGNOSTICO', 'EN_PROCESO', 'FINALIZADO'];

    const byStageId = {};
    stages.forEach(s => { byStageId[s.stage] = s; });

    let foundActive = false;
    return ORDER.map(stageId => {
      const s = byStageId[stageId];
      const completed = s?.completed || false;
      let status;
      if (completed) {
        status = 'done';
      } else if (!foundActive) {
        status = 'active';
        foundActive = true;
      } else {
        status = 'pending';
      }

      return {
        id: stageId,
        title: TITLES[stageId],
        status,
        completed: completed,
        completedAt: s?.updatedAt || null,
      };
    });
  }, [stages]);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader" />
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div className="page-container">
        <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none' }}>
            <ChevronLeft size={28} />
          </button>
          <h1 style={{ fontSize: '24px', fontStyle: 'italic', textTransform: 'none' }}>Error</h1>
        </header>
        <p style={{ textAlign: 'center', color: '#64748B' }}>{error || 'Cita no encontrada'}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none' }}>
          <ChevronLeft size={28} />
        </button>
        <h1 style={{ fontSize: '24px', fontStyle: 'italic', textTransform: 'none' }}>Seguimiento</h1>
      </header>

      {/* Resumen de la cita */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: '#f0f9ff', borderColor: '#bfdbfe' }}>
        <h3 style={{ fontSize: '14px', color: '#0369a1', marginBottom: '16px', textTransform: 'uppercase', fontWeight: '800' }}>
          {cita.servicio?.nombre}
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <Car size={22} color="#0369a1" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
              {cita.vehiculo?.marca} {cita.vehiculo?.modelo}
            </p>
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
              {cita.vehiculo?.placa}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1' }}>
            <Calendar size={16} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>
              {new Date(cita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1' }}>
            <Clock size={16} />
            <span style={{ fontSize: '11px', fontWeight: '700' }}>
              {cita.hora_inicio?.substring(0, 5)}
            </span>
          </div>
        </div>
      </div>

      {/* Línea de progreso */}
      <div style={{ marginBottom: '12px' }}>
        {normalizedStages.map((stage, index) => (
          <div key={stage.id} style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'flex-start',
            position: 'relative',
            marginBottom: index < normalizedStages.length - 1 ? '0' : '0'
          }}>
            {/* Nodo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', flexShrink: 0 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: stage.status === 'done' ? 'none' : stage.status === 'active' ? '3px solid #2563EB' : '2px solid #E2E8F0',
                backgroundColor: stage.status === 'done' ? '#10B981' : 'white',
                zIndex: 1,
              }}>
                {stage.status === 'done' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L19 8" />
                  </svg>
                ) : stage.status === 'active' ? (
                  <div style={{ width: '14px', height: '14px', backgroundColor: '#2563EB', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                ) : null}
              </div>
              {/* Línea vertical */}
              {index < normalizedStages.length - 1 && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  minHeight: '60px',
                  backgroundColor: stage.status === 'done' ? '#10B981' : '#E2E8F0',
                  marginTop: '4px',
                }} />
              )}
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, paddingBottom: index < normalizedStages.length - 1 ? '24px' : '0' }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: '800',
                color: stage.status === 'done' ? '#0F172A' : stage.status === 'active' ? '#2563EB' : '#94A3B8',
                marginBottom: '4px',
              }}>
                {stage.title}
              </h4>
              <p style={{
                fontSize: '11px',
                color: stage.status === 'done' ? '#10B981' : stage.status === 'active' ? '#2563EB' : '#94A3B8',
                fontWeight: '700',
                marginBottom: '4px',
              }}>
                {stage.status === 'done' ? 'Completado' : stage.status === 'active' ? 'En curso' : 'Pendiente'}
              </p>
              {stage.completedAt && (
                <p style={{ fontSize: '10px', color: '#64748B', fontWeight: '600' }}>
                  {new Date(stage.completedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceTracking;