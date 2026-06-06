import { useState, useEffect, useCallback } from 'react';
import api from '../apiConfig';

export function useServiceStages(citaId) {
  const [stages, setStages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchStages = useCallback(async () => {
    if (!citaId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/citas/${citaId}/stages`);
      setStages(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [citaId]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  // Empleado inicializa las 4 etapas cuando arranca el servicio
  const initStages = async () => {
    const { data } = await api.patch(`/citas/${citaId}/stages/init`, {});
    setStages(data);
    return data;
  };

  // Empleado actualiza cualquier etapa (fotos, observación, completada)
  const updateStage = async (stage, payload) => {
    const { data } = await api.patch(`/citas/${citaId}/stages/${stage}`, payload);
    setStages(prev => prev.map(s => s.stage === stage ? data : s));
    return data;
  };

  // Empleado agrega un update de EN_PROCESO
  const addUpdate = async (text) => {
    return updateStage('EN_PROCESO', {
      updates: [{ text, timestamp: new Date().toISOString() }],
    });
  };

  // Helper para acceder a una etapa por nombre
  const getStage = (name) =>
    stages.find(s => s.stage === name) || {
      stage: name, completed: false,
      images: [], updates: [], observation: '',
    };

  return {
    stages, loading, error,
    initStages, updateStage, addUpdate,
    getStage, refetch: fetchStages,
  };
}