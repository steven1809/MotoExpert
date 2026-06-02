import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import ServiceCompletionModal from '../components/ServiceCompletionModal';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STAGE_MAP_REVERSE = {
  recepcion:   'RECEPCION',
  diagnostico: 'DIAGNOSTICO',
  proceso:     'EN_PROCESO',
  finalizado:  'FINALIZADO',
};

// ─── Utilidades ────────────────────────────────────────────────────────────────

const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};

const nowIso = () => new Date().toISOString();

const readFilesAsDataUrls = async (fileList, limit) => {
  const files = Array.from(fileList || []).slice(0, Math.max(0, limit));
  const results = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
          reader.readAsDataURL(file);
        }),
    ),
  );
  return results.filter(Boolean);
};

// Convierte stage del backend → formato local
const backendToLocal = (backendStage) => {
  const MAP = { RECEPCION: 'recepcion', DIAGNOSTICO: 'diagnostico', EN_PROCESO: 'proceso', FINALIZADO: 'finalizado' };
  const id = MAP[backendStage.stage];
  let data = {};
  if (id === 'recepcion' || id === 'finalizado') {
    data = { photos: backendStage.images || [], note: backendStage.observation || '' };
  } else if (id === 'diagnostico') {
    data = { text: backendStage.observation || '', media: backendStage.images || [] };
  } else if (id === 'proceso') {
    data = {
      updates: (backendStage.updates || []).map((u, i) => ({
        id: `${i}-${u.timestamp}`,
        text: u.text,
        at: u.timestamp,
      })),
      media: backendStage.images || [],
    };
  }
  return {
    id,
    completed: backendStage.completed,
    data,
    createdAt: backendStage.createdAt,
    updatedAt: backendStage.updatedAt,
  };
};

// ─── Hook de API ───────────────────────────────────────────────────────────────

function useServiceStages(citaId, { allowInit } = { allowInit: false }) {
  const [rawStages, setRawStages] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const hasLoadedRef = useRef(false);
  const socketRef = useRef(null);
  const badgeTimeoutRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const hasEverConnectedRef = useRef(false);
  const hasJoinedRoomRef = useRef(false);

  const [socketStatus, setSocketStatus] = useState('connecting');
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [showSyncedBadge, setShowSyncedBadge] = useState(false);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const initStages = useCallback(async () => {
    const { data } = await axios.patch(`${API}/citas/${citaId}/stages/init`, {}, { headers: getHeaders() });
    setRawStages(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaId]);

  const fetchStages = useCallback(async ({ silent } = { silent: false }) => {
    if (!citaId) return;
    try {
      if (!silent && !hasLoadedRef.current) setLoading(true);
      const { data } = await axios.get(`${API}/citas/${citaId}/stages`, { headers: getHeaders() });
      if (Array.isArray(data) && data.length === 0) {
        if (allowInit) await initStages();
        else setRawStages([]);
      } else {
        setRawStages(data);
      }
      hasLoadedRef.current = true;
    } catch (e) {
      if (e?.response?.status === 404) {
        if (allowInit) await initStages();
        else setRawStages([]);
      } else {
        setError(e.message);
      }
    } finally {
      if (!silent || hasLoadedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaId, initStages, allowInit]);

  const fetchCurrentStatus = useCallback(async () => {
    if (!citaId) return false;
    try {
      const { data } = await axios.get(`${API}/api/appointments/${citaId}/current-status`, { headers: getHeaders() });
      if (Array.isArray(data?.stages)) { setRawStages(data.stages); hasLoadedRef.current = true; return true; }
      return false;
    } catch {
      try {
        const { data } = await axios.get(`${API}/citas/${citaId}/current-status`, { headers: getHeaders() });
        if (Array.isArray(data?.stages)) { setRawStages(data.stages); hasLoadedRef.current = true; return true; }
      } catch {}
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaId]);

  const updateStage = useCallback(async (localId, payload) => {
    const stageKey = STAGE_MAP_REVERSE[localId];
    const { data } = await axios.patch(
      `${API}/citas/${citaId}/stages/${stageKey}`,
      payload,
      { headers: getHeaders() },
    );
    setRawStages((prev) => prev.map((s) => (s.stage === stageKey ? data : s)));
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaId]);

  const addUpdate = useCallback(async (text) => {
    return updateStage('proceso', { updates: [{ text, timestamp: nowIso() }] });
  }, [updateStage]);

  // Carga inicial
  useEffect(() => {
    if (!citaId) return;
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        const ok = await fetchCurrentStatus();
        if (cancelled) return;
        if (!ok) await fetchStages({ silent: false });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [citaId, fetchCurrentStatus, fetchStages]);

  // Polling solo para el cliente (no empleado)
  useEffect(() => {
    if (!citaId || allowInit) return;
    const interval = setInterval(() => fetchStages({ silent: true }), 4000);
    return () => clearInterval(interval);
  }, [citaId, fetchStages, allowInit]);

  // ─── WebSocket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !citaId) return;

    const showUpdated = () => {
      setShowUpdatedBadge(true);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
      badgeTimeoutRef.current = setTimeout(() => setShowUpdatedBadge(false), 2000);
    };

    const showSynced = () => {
      setShowSyncedBadge(true);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => setShowSyncedBadge(false), 2000);
    };

    if (socketRef.current) {
      try { socketRef.current.disconnect(); } catch {}
      socketRef.current = null;
    }

    // ✅ FIX: Conectar al namespace /service-tracking para no colisionar con otros gateways
    const socket = io(`${API}/service-tracking`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const joinAppointment = () => {
      hasJoinedRoomRef.current = false;
      socket.emit('join-appointment', { appointmentId: Number(citaId) });
    };

    const onJoinedAppointment = (payload) => {
      if (Number(payload?.appointmentId) !== Number(citaId)) return;
      hasJoinedRoomRef.current = true;
      console.log('Joined appointment room:', payload.appointmentId);
    };

    const onStageUpdated = (payload) => {
      if (Number(payload?.citaId) !== Number(citaId)) return;
      const stage = payload?.stage;
      if (!stage?.stage) return;
      setRawStages((prev) => {
        const idx = prev.findIndex((s) => s.stage === stage.stage);
        if (idx === -1) {
          return [...prev, stage].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        }
        const next = [...prev];
        next[idx] = stage;
        return next;
      });
      showUpdated();
    };

    const onServiceUpdated = (payload) => {
      if (Number(payload?.appointmentId) !== Number(citaId)) return;
      fetchStages({ silent: true });
      showUpdated();
    };

    const onConnect = () => {
      hasEverConnectedRef.current = true;
      setSocketStatus('connected');
      console.log('Socket conectado:', socket.id);
      joinAppointment();
    };

    const onDisconnect = () => {
      if (!hasEverConnectedRef.current) return;
      setSocketStatus('reconnecting');
    };

    const onConnectError = () => {
      if (!hasEverConnectedRef.current) return;
      setSocketStatus('reconnecting');
    };

    const onReconnect = async () => {
      setSocketStatus('connected');
      try {
        const ok = await fetchCurrentStatus();
        if (!ok) fetchStages({ silent: true });
        showSynced();
      } catch {
        fetchStages({ silent: true });
      } finally {
        joinAppointment();
      }
    };

    const onReconnectFailed = () => setSocketStatus('failed');

    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('disconnect', onDisconnect);
    socket.on('service_stage_updated', onStageUpdated);
    socket.on('service-updated', onServiceUpdated);
    socket.on('joined-appointment', onJoinedAppointment);
    socket.io.on('reconnect', onReconnect);
    socket.io.on('reconnect_failed', onReconnectFailed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
      socket.off('disconnect', onDisconnect);
      socket.off('service_stage_updated', onStageUpdated);
      socket.off('service-updated', onServiceUpdated);
      socket.off('joined-appointment', onJoinedAppointment);
      socket.io.off('reconnect', onReconnect);
      socket.io.off('reconnect_failed', onReconnectFailed);
      socket.disconnect();
      socketRef.current = null;
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [citaId, fetchStages, fetchCurrentStatus]);

  const stages = useMemo(() => {
    const TITLES = { recepcion: 'Recepción', diagnostico: 'Diagnóstico', proceso: 'En Proceso', finalizado: 'Finalizado' };
    const ORDER  = ['recepcion', 'diagnostico', 'proceso', 'finalizado'];

    if (!rawStages.length) {
      return ORDER.map((id, idx) => ({
        id, title: TITLES[id],
        status: idx === 0 ? 'active' : 'pending',
        completedAt: null,
        data: id === 'proceso' ? { updates: [], media: [] } : id === 'diagnostico' ? { text: '', media: [] } : { photos: [], note: '' },
      }));
    }

    const byId = {};
    rawStages.forEach((s) => { const l = backendToLocal(s); byId[l.id] = l; });

    let foundActive = false;
    return ORDER.map((id) => {
      const b = byId[id];
      const completed = b?.completed || false;
      let status;
      if (completed) { status = 'done'; }
      else if (!foundActive) { status = 'active'; foundActive = true; }
      else { status = 'pending'; }
      return {
        id, title: TITLES[id], status,
        completedAt: completed ? b?.updatedAt : null,
        data: b?.data || (id === 'proceso' ? { updates: [], media: [] } : id === 'diagnostico' ? { text: '', media: [] } : { photos: [], note: '' }),
      };
    });
  }, [rawStages]);

  return { stages, rawStages, loading, error, updateStage, addUpdate, socketStatus, showUpdatedBadge, showSyncedBadge };
}

function useCita(citaId) {
  const [cita, setCita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !citaId) return;
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/citas/${citaId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!data) { setCita(null); setError('No autorizado o cita no encontrada'); return; }
        setCita(data);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Error al cargar la cita');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [citaId]);

  return { cita, loading, error };
}

// ─── Componentes UI ─────────────────────────────────────────────────────────────

const StageIcon = ({ id }) => {
  const base = 'w-5 h-5';
  if (id === 'recepcion') return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h6M7 15h10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12a2 2 0 012 2v16l-4-3-4 3-4-3-4 3V5a2 2 0 012-2z" />
    </svg>
  );
  if (id === 'diagnostico') return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 109 9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12h-3" />
    </svg>
  );
  if (id === 'proceso') return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-9-9" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" />
    </svg>
  );
};

const StatusPill = ({ state }) => {
  const base = 'text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border';
  if (state === 'done')   return <div className={`${base} bg-emerald-500/10 border-emerald-500/30 text-emerald-300`}>Completada</div>;
  if (state === 'active') return <div className={`${base} bg-[#3b82f6]/10 border-[#3b82f6]/35 text-[#93c5fd]`}>Activa</div>;
  return <div className={`${base} bg-white/5 border-white/10 text-white/40`}>Pendiente</div>;
};

const Dot = ({ state }) => {
  if (state === 'done') return (
    <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L19 8" />
      </svg>
    </div>
  );
  if (state === 'active') return (
    <div className="relative w-9 h-9 rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/35 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full animate-ping bg-[#3b82f6]/20" />
      <div className="relative w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
    </div>
  );
  return <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10" />;
};

const ProgressBar = ({ stages, live }) => {
  const lastDoneIndex = Math.max(-1, ...stages.map((s, i) => (s.status === 'done' ? i : -1)));
  const progressPct = stages.length > 1 && lastDoneIndex >= 0 ? (lastDoneIndex / (stages.length - 1)) * 100 : 0;
  return (
    <div className="border border-white/10 bg-[#1e293b]/60 rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="text-xs font-black uppercase tracking-widest text-white/60">Progreso</div>
          <div className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`} />
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-white/60">
          {stages.filter((s) => s.status === 'done').length}/{stages.length}
        </div>
      </div>
      <div className="mt-6 relative">
        <div className="absolute left-4 right-4 top-[18px] h-px bg-white/10" />
        <div className="absolute left-4 top-[18px] h-px bg-emerald-500/35 transition-all duration-500"
          style={{ width: `calc(${progressPct}% * (100% - 2rem) / 100%)` }} />
        <div className="grid grid-cols-4 gap-3 md:gap-6">
          {stages.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <Dot state={s.status} />
              <div className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest text-center ${
                s.status === 'done' ? 'text-emerald-400' : s.status === 'active' ? 'text-[#93c5fd]' : 'text-white/35'
              }`}>{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Gallery = ({ images }) => {
  if (!images?.length) return null;
  const isVideo = (src) =>
    typeof src === 'string' &&
    (src.startsWith('data:video') || /\.(mp4|webm|ogg)(\?|#|$)/i.test(src));
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {images.map((src, idx) => (
        <div key={`${idx}-${src.slice(0, 16)}`}
          className="shrink-0 w-[220px] h-[130px] rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          {isVideo(src) ? (
            <video src={src} controls className="w-full h-full object-cover" />
          ) : (
            <img src={src} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
};

const CardShell = ({ state, children }) => {
  const cls = state === 'active'  ? 'border-[#3b82f6] bg-[#1e293b]/60'
            : state === 'done'    ? 'border-emerald-500/25 bg-[#1e293b]/60'
            : 'border-white/10 bg-white/5 opacity-50';
  return <div className={`rounded-3xl border p-5 md:p-6 transition-colors md:hover:bg-[#1e293b]/70 ${cls}`}>{children}</div>;
};

const SidebarContent = ({ stages, cita, startedAt, elapsed }) => {
  const phoneRaw = cita?.usuario?.telefono || '';
  const phoneDigits = String(phoneRaw).replace(/[^\d]/g, '');
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits}` : null;
  const telLink = phoneDigits ? `tel:${phoneDigits}` : null;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-[#1e293b]/60 p-5">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Resumen</div>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Cliente</div>
            <div className="text-sm font-black text-white">{cita?.usuario?.nombre || '—'}</div>
            <div className="text-xs font-bold text-white/60">{phoneRaw || 'Sin teléfono'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Vehículo</div>
            <div className="text-sm font-black text-white">{(cita?.vehiculo?.placa || '—').toUpperCase()}</div>
            <div className="text-xs font-bold text-white/60">{cita?.vehiculo?.marca || '—'} {cita?.vehiculo?.modelo || ''}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Servicio</div>
            <div className="text-sm font-black text-white">{cita?.servicio?.nombre || '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Inicio</div>
              <div className="mt-1 text-xs font-black text-white">{startedAt ? formatDateTime(startedAt) : '—'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/45">Tiempo</div>
              <div className="mt-1 text-xs font-black text-white">{elapsed || '—'}</div>
            </div>
          </div>
          {(waLink || telLink) && (
            <div className="grid grid-cols-2 gap-3">
              <a href={waLink || '#'} target="_blank" rel="noreferrer"
                className={`h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest ${waLink ? 'text-white' : 'text-white/30 pointer-events-none'}`}>
                WhatsApp
              </a>
              <a href={telLink || '#'}
                className={`h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest ${telLink ? 'text-white' : 'text-white/30 pointer-events-none'}`}>
                Llamar
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#1e293b]/60 p-5">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Etapas</div>
        <div className="mt-4 space-y-3">
          {stages.map((s, idx) => (
            <div key={s.id} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-black text-white truncate">{idx + 1}. {s.title}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  {s.status === 'done' ? 'Completada' : s.status === 'active' ? 'Activa' : 'Pendiente'}
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 shrink-0">
                {s.completedAt ? formatDateTime(s.completedAt) : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MobileSummary = ({ stages, cita, startedAt, elapsed, open, onToggle }) => (
  <div className="md:hidden mt-6 border border-white/10 bg-[#1e293b]/60 rounded-3xl overflow-hidden">
    <button type="button" onClick={onToggle}
      className="w-full h-11 px-5 flex items-center justify-between text-left">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/70">Resumen</div>
      <svg className={`w-5 h-5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </button>
    {open && <div className="px-5 pb-5"><SidebarContent stages={stages} cita={cita} startedAt={startedAt} elapsed={elapsed} /></div>}
  </div>
);

// ─── Vista Empleado ────────────────────────────────────────────────────────────

const EmployeeView = ({ citaId, stages, cita, startedAt, elapsed, updateStage, addUpdate, showToast }) => {
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [recepcionNote, setRecepcionNote] = useState('');
  const [recepcionMedia, setRecepcionMedia] = useState([]);
  const [diagText, setDiagText] = useState('');
  const [diagMedia, setDiagMedia] = useState([]);
  const [procUpdate, setProcUpdate] = useState('');
  const [procLog, setProcLog] = useState([]);
  const [procMedia, setProcMedia] = useState([]);
  const [finalNote, setFinalNote] = useState('');
  const [finalMedia, setFinalMedia] = useState([]);

  const recepcionRef = useRef(null);
  const diagRef = useRef(null);
  const procRef = useRef(null);
  const finalRef = useRef(null);

  const recepcionDirtyRef = useRef(false);
  const diagDirtyRef = useRef(false);
  const procDirtyRef = useRef(false);
  const finalDirtyRef = useRef(false);

  useEffect(() => {
    const r = stages.find((s) => s.id === 'recepcion');
    if (r?.status === 'done' && !recepcionDirtyRef.current) {
      setRecepcionNote(r.data.note || '');
      setRecepcionMedia(r.data.photos || []);
    }
  }, [stages]);

  useEffect(() => {
    const d = stages.find((s) => s.id === 'diagnostico');
    if (d?.status === 'done' && !diagDirtyRef.current) {
      setDiagText(d.data.text || '');
      setDiagMedia(d.data.media || []);
    }
  }, [stages]);

  useEffect(() => {
    const p = stages.find((s) => s.id === 'proceso');
    if (!p || procDirtyRef.current) return;
    const serverMedia = Array.isArray(p.data?.media) ? p.data.media : [];
    const serverUpdates = Array.isArray(p.data?.updates) ? p.data.updates : [];
    if (p.status === 'done') {
      if (serverMedia.length > 0) setProcMedia(serverMedia);
      if (serverUpdates.length > 0) setProcLog(serverUpdates);
    } else if (p.status === 'active') {
      if (serverMedia.length > 0) setProcMedia((prev) => (prev.length > 0 ? prev : serverMedia));
      if (serverUpdates.length > 0) setProcLog((prev) => (prev.length > 0 ? prev : serverUpdates));
    }
  }, [stages]);

  useEffect(() => {
    const f = stages.find((s) => s.id === 'finalizado');
    if (f?.status === 'done' && !finalDirtyRef.current) {
      setFinalNote(f.data.note || '');
      setFinalMedia(f.data.photos || []);
    }
  }, [stages]);

  // ✅ FIX: Handlers de archivos sin dependencia de socketReady
  const handleRecepcionFiles = async (e) => {
    recepcionDirtyRef.current = true;
    const urls = await readFilesAsDataUrls(e.target.files, 4);
    setRecepcionMedia((prev) => [...prev, ...urls].slice(0, 4));
    e.target.value = '';
  };
  const handleDiagFile = async (e) => {
    diagDirtyRef.current = true;
    const urls = await readFilesAsDataUrls(e.target.files, 1);
    setDiagMedia(urls[0] ? [urls[0]] : []);
    e.target.value = '';
  };
  const handleProcFiles = async (e) => {
    procDirtyRef.current = true;
    const urls = await readFilesAsDataUrls(e.target.files, 4);
    setProcMedia((prev) => [...prev, ...urls].slice(0, 4));
    e.target.value = '';
  };
  const handleFinalFiles = async (e) => {
    finalDirtyRef.current = true;
    const urls = await readFilesAsDataUrls(e.target.files, 4);
    setFinalMedia((prev) => [...prev, ...urls].slice(0, 4));
    e.target.value = '';
  };

  const saveRecepcion = async () => {
    try {
      setSaving(true);
      // ✅ Asegurar que los stages existen antes de guardar
      try { await axios.patch(`${API}/citas/${citaId}/stages/init`, {}, { headers: getHeaders() }); } catch {}
      await updateStage('recepcion', { observation: recepcionNote, images: recepcionMedia, completed: true });
      recepcionDirtyRef.current = false;
    } catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };

  const saveDiagnostico = async () => {
    try {
      setSaving(true);
      await updateStage('diagnostico', { observation: diagText, images: diagMedia, completed: true });
      diagDirtyRef.current = false;
    } catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };

  const addProcessUpdate = async () => {
    const text = procUpdate.trim();
    if (!text) return;
    try {
      setSaving(true);
      await addUpdate(text);
      procDirtyRef.current = true;
      setProcLog((prev) => [{ id: `${Date.now()}`, text, at: nowIso() }, ...prev]);
      setProcUpdate('');
    } catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };

  const saveProceso = async () => {
    try {
      setSaving(true);
      await updateStage('proceso', { images: procMedia, completed: true });
      procDirtyRef.current = false;
    } catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };

  const confirmFinalizar = async () => {
    try {
      setSaving(true);
      await updateStage('finalizado', { observation: finalNote, images: finalMedia, completed: true });
      finalDirtyRef.current = false;
      setShowCompletionModal(true);
    } catch (e) {
      alert('Error: ' + (e?.response?.data?.message || e.message));
    } finally { setSaving(false); }
  };

  const btnClass = `w-full h-11 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6]
    disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all`;

  // Clase para botones secundarios (subir fotos)
  const uploadBtnClass = `h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:text-white/30
    disabled:cursor-not-allowed border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors`;

  return (
    <div className="mt-8 md:mt-10">
      {showCompletionModal && cita ? (
        <ServiceCompletionModal
          cita={cita}
          onClose={() => setShowCompletionModal(false)}
          onSuccess={() => {
            setShowCompletionModal(false);
            try { window.dispatchEvent(new CustomEvent('motoexpert:refresh_notifications')); } catch {}
          }}
          showToast={showToast || (() => {})}
        />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        <div className="md:col-span-8 space-y-5 md:space-y-6">
          {stages.map((s) => {
            const isActive = s.status === 'active';
            const isDone   = s.status === 'done';

            const header = (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                    <StageIcon id={s.id} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm md:text-base font-black text-white uppercase tracking-wide truncate">{s.title}</div>
                    <div className="text-xs font-bold text-white/60">
                      {isDone ? `Completado · ${formatDateTime(s.completedAt)}` : isActive ? 'Etapa activa' : 'Pendiente'}
                    </div>
                  </div>
                </div>
                <StatusPill state={isDone ? 'done' : isActive ? 'active' : 'pending'} />
              </div>
            );

            const body = (() => {
              if (!isActive && !isDone) return (
                <div className="mt-5 text-sm font-bold text-white/50">Completa la etapa anterior para habilitar esta sección.</div>
              );

              // ── RECEPCIÓN ──────────────────────────────────────────────────
              if (s.id === 'recepcion') {
                if (isDone) return (
                  <div className="mt-5 space-y-4">
                    <Gallery images={s.data.photos} />
                    <div className="text-sm font-bold text-white/80">{s.data.note}</div>
                  </div>
                );
                return (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Fotos / video de llegada (opcional, máx. 4)</div>
                      {/* ✅ FIX: onClick sin socketReady, disabled solo por saving */}
                      <button type="button" onClick={() => recepcionRef.current?.click()}
                        disabled={saving} className={uploadBtnClass}>
                        Subir fotos
                      </button>
                      <input ref={recepcionRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleRecepcionFiles} />
                    </div>
                    <Gallery images={recepcionMedia} />
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Observación</div>
                      <textarea rows={4} value={recepcionNote}
                        onChange={(e) => { recepcionDirtyRef.current = true; setRecepcionNote(e.target.value); }}
                        placeholder="Ej. Rayón en carenado izquierdo, nivel de combustible bajo..."
                        className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                    </div>
                    {/* ✅ FIX: Solo requiere nota, fotos opcionales, sin socketReady */}
                    <button type="button" onClick={saveRecepcion}
                      disabled={saving || !recepcionNote.trim()} className={btnClass}>
                      {saving ? 'Guardando...' : 'Avanzar a siguiente etapa'}
                    </button>
                  </div>
                );
              }

              // ── DIAGNÓSTICO ────────────────────────────────────────────────
              if (s.id === 'diagnostico') {
                if (isDone) return (
                  <div className="mt-5 space-y-4">
                    <Gallery images={s.data.media} />
                    <div className="text-sm font-bold text-white/80 whitespace-pre-wrap">{s.data.text}</div>
                  </div>
                );
                return (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Diagnóstico técnico</div>
                      <textarea rows={6} value={diagText}
                        onChange={(e) => { diagDirtyRef.current = true; setDiagText(e.target.value); }}
                        placeholder="Describe hallazgos, causas probables, recomendaciones, repuestos..."
                        className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Foto o video opcional</div>
                      {/* ✅ FIX: sin socketReady */}
                      <button type="button" onClick={() => diagRef.current?.click()}
                        disabled={saving} className={uploadBtnClass}>
                        Subir
                      </button>
                      <input ref={diagRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleDiagFile} />
                    </div>
                    <Gallery images={diagMedia} />
                    {/* ✅ FIX: sin socketReady */}
                    <button type="button" onClick={saveDiagnostico}
                      disabled={saving || !diagText.trim()} className={btnClass}>
                      {saving ? 'Guardando...' : 'Avanzar a siguiente etapa'}
                    </button>
                  </div>
                );
              }

              // ── EN PROCESO ─────────────────────────────────────────────────
              if (s.id === 'proceso') {
                if (isDone) return (
                  <div className="mt-5 space-y-3">
                    <Gallery images={s.data.media} />
                    {s.data.updates?.map((u) => (
                      <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-xs font-black text-white/70 uppercase tracking-widest">Update</div>
                          <div className="text-[10px] font-black text-white/40">{formatDateTime(u.at)}</div>
                        </div>
                        <div className="mt-2 text-sm font-bold text-white/80">{u.text}</div>
                      </div>
                    ))}
                  </div>
                );
                return (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Fotos o videos (0–4)</div>
                      {/* ✅ FIX: sin socketReady */}
                      <button type="button" onClick={() => procRef.current?.click()}
                        disabled={saving} className={uploadBtnClass}>
                        Subir
                      </button>
                      <input ref={procRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleProcFiles} />
                    </div>
                    <Gallery images={procMedia} />
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <input value={procUpdate}
                        onChange={(e) => { procDirtyRef.current = true; setProcUpdate(e.target.value); }}
                        onKeyDown={(e) => e.key === 'Enter' && addProcessUpdate()}
                        placeholder="Ej. Se cambió el aceite, se revisaron frenos..."
                        className="h-11 rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors" />
                      {/* ✅ FIX: sin socketReady */}
                      <button type="button" onClick={addProcessUpdate} disabled={saving}
                        className="h-11 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
                        Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {procLog.length === 0
                        ? <div className="text-sm font-bold text-white/50">Aún no hay updates.</div>
                        : procLog.map((u) => (
                          <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <div className="text-xs font-black text-white/70 uppercase tracking-widest">Update</div>
                              <div className="text-[10px] font-black text-white/40">{formatDateTime(u.at)}</div>
                            </div>
                            <div className="mt-2 text-sm font-bold text-white/80">{u.text}</div>
                          </div>
                        ))
                      }
                    </div>
                    {/* ✅ FIX: sin socketReady */}
                    <button type="button" onClick={saveProceso}
                      disabled={saving || procLog.length === 0} className={btnClass}>
                      {saving ? 'Guardando...' : 'Avanzar a siguiente etapa'}
                    </button>
                  </div>
                );
              }

              // ── FINALIZADO ─────────────────────────────────────────────────
              if (isDone) return (
                <div className="mt-5 space-y-4">
                  <Gallery images={s.data.photos} />
                  <div className="text-sm font-bold text-white/80">{s.data.note}</div>
                </div>
              );
              return (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Fotos o video del resultado (opcional, máx. 4)</div>
                    {/* ✅ FIX: sin socketReady */}
                    <button type="button" onClick={() => finalRef.current?.click()}
                      disabled={saving} className={uploadBtnClass}>
                      Subir fotos
                    </button>
                    <input ref={finalRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFinalFiles} />
                  </div>
                  <Gallery images={finalMedia} />
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Observación final</div>
                    <textarea rows={4} value={finalNote}
                      onChange={(e) => { finalDirtyRef.current = true; setFinalNote(e.target.value); }}
                      placeholder="Ej. Prueba de ruta OK, se recomienda control a los 500 km..."
                      className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                  </div>
                  {/* ✅ FIX: sin socketReady, fotos opcionales */}
                  <button type="button" onClick={confirmFinalizar}
                    disabled={saving || !finalNote.trim()} className={btnClass}>
                    {saving ? 'Guardando...' : 'Confirmar y Finalizar'}
                  </button>
                </div>
              );
            })();

            return (
              <CardShell key={s.id} state={isDone ? 'done' : isActive ? 'active' : 'locked'}>
                {header}{body}
              </CardShell>
            );
          })}
        </div>

        <div className="md:col-span-4">
          <div className="hidden md:block md:sticky md:top-24 border border-white/10 bg-[#1e293b]/60 rounded-3xl p-6">
            <SidebarContent stages={stages} cita={cita} startedAt={startedAt} elapsed={elapsed} />
            <div className="mt-5">
              {/* ✅ FIX: FINALIZAR SERVICIO sin socketReady */}
              <button type="button" onClick={() => setShowCompletionModal(true)}
                disabled={!cita || (cita?.estado || '').toString().toUpperCase() !== 'EN PROCESO'}
                className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors">
                FINALIZAR SERVICIO
              </button>
            </div>
          </div>
          <MobileSummary stages={stages} cita={cita} startedAt={startedAt} elapsed={elapsed} open={summaryOpen} onToggle={() => setSummaryOpen((v) => !v)} />
        </div>
      </div>
    </div>
  );
};

// ─── Vista Cliente ─────────────────────────────────────────────────────────────

const ClientView = ({ stages, cita, startedAt, elapsed, live }) => {
  const [summaryOpen, setSummaryOpen] = useState(false);

  return (
    <div className="mt-8 md:mt-10">
      <ProgressBar stages={stages} live={live} />
      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        <div className="md:col-span-8 space-y-5 md:space-y-6">
          {stages.map((s) => {
            if (s.status === 'pending') return (
              <CardShell key={s.id} state="locked">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shrink-0">
                      <StageIcon id={s.id} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-black text-white/70 uppercase tracking-wide truncate">{s.title}</div>
                      <div className="text-xs font-bold text-white/45">Aún no inicia</div>
                    </div>
                  </div>
                  <StatusPill state="pending" />
                </div>
                <div className="mt-5 h-10 rounded-2xl bg-white/5" />
              </CardShell>
            );

            if (s.status === 'active') return (
              <CardShell key={s.id} state="active">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#3b82f6]/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <StageIcon id={s.id} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-black text-white uppercase tracking-wide truncate">{s.title}</div>
                      {live ? (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#93c5fd] text-[10px] font-black uppercase tracking-widest">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60a5fa] opacity-50" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#60a5fa]" />
                          </span>
                          EN VIVO
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <StatusPill state="active" />
                </div>
                {(() => {
                  if (s.id === 'recepcion' || s.id === 'finalizado') {
                    const hasContent = (s.data?.photos || []).length > 0 || String(s.data?.note || '').trim().length > 0;
                    if (!hasContent) return (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-4 text-sm font-bold text-white/70">
                        El taller está trabajando en esta etapa. Verás novedades cuando se registren.
                      </div>
                    );
                    return (
                      <div className="mt-5 space-y-4">
                        <Gallery images={s.data.photos} />
                        {String(s.data.note || '').trim() ? <div className="text-sm font-bold text-white/80">{s.data.note}</div> : null}
                      </div>
                    );
                  }
                  if (s.id === 'diagnostico') {
                    const hasContent = (s.data?.media || []).length > 0 || String(s.data?.text || '').trim().length > 0;
                    if (!hasContent) return (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-4 text-sm font-bold text-white/70">
                        El taller está trabajando en esta etapa. Verás novedades cuando se registren.
                      </div>
                    );
                    return (
                      <div className="mt-5 space-y-4">
                        <Gallery images={s.data.media} />
                        {String(s.data.text || '').trim() ? <div className="text-sm font-bold text-white/80 whitespace-pre-wrap">{s.data.text}</div> : null}
                      </div>
                    );
                  }
                  const hasMedia = (s.data?.media || []).length > 0;
                  const hasUpdates = (s.data?.updates || []).length > 0;
                  if (!hasMedia && !hasUpdates) return (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-4 text-sm font-bold text-white/70">
                      El taller está trabajando en esta etapa. Verás novedades cuando se registren.
                    </div>
                  );
                  return (
                    <div className="mt-5 space-y-3">
                      <Gallery images={s.data.media} />
                      {s.data.updates?.map((u) => (
                        <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-black text-white/70 uppercase tracking-widest">Update</div>
                            <div className="text-[10px] font-black text-white/40">{formatDateTime(u.at)}</div>
                          </div>
                          <div className="mt-2 text-sm font-bold text-white/80">{u.text}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardShell>
            );

            // Etapa completada (done)
            const content = (() => {
              if (s.id === 'recepcion' || s.id === 'finalizado') return (
                <div className="mt-5 space-y-4">
                  <Gallery images={s.data.photos} />
                  <div className="text-sm font-bold text-white/80">{s.data.note}</div>
                </div>
              );
              if (s.id === 'diagnostico') return (
                <div className="mt-5 space-y-4">
                  <Gallery images={s.data.media} />
                  <div className="text-sm font-bold text-white/80 whitespace-pre-wrap">{s.data.text}</div>
                </div>
              );
              return (
                <div className="mt-5 space-y-3">
                  <Gallery images={s.data.media} />
                  {s.data.updates?.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xs font-black text-white/70 uppercase tracking-widest">Update</div>
                        <div className="text-[10px] font-black text-white/40">{formatDateTime(u.at)}</div>
                      </div>
                      <div className="mt-2 text-sm font-bold text-white/80">{u.text}</div>
                    </div>
                  ))}
                </div>
              );
            })();

            return (
              <CardShell key={s.id} state="done">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-300 shrink-0">
                      <StageIcon id={s.id} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm md:text-base font-black text-white uppercase tracking-wide truncate">{s.title}</div>
                      <div className="text-xs font-bold text-white/60">Completado · {formatDateTime(s.completedAt)}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">✓ OK</div>
                </div>
                {content}
              </CardShell>
            );
          })}
        </div>

        <div className="md:col-span-4">
          <div className="hidden md:block md:sticky md:top-24 border border-white/10 bg-[#1e293b]/60 rounded-3xl p-6">
            <SidebarContent stages={stages} cita={cita} startedAt={startedAt} elapsed={elapsed} />
          </div>
          <MobileSummary stages={stages} cita={cita} startedAt={startedAt} elapsed={elapsed} open={summaryOpen} onToggle={() => setSummaryOpen((v) => !v)} />
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ───────────────────────────────────────────────────────

export default function ServiceTracking({ citaId = 123, userRole = 'cliente', onBack, showToast }) {
  const isEmployee = userRole === 'empleado' || userRole === 'trabajador';
  const {
    stages, rawStages,
    loading: stagesLoading, error: stagesError,
    updateStage, addUpdate,
    socketStatus, showUpdatedBadge, showSyncedBadge,
  } = useServiceStages(citaId, { allowInit: isEmployee });

  const { cita, loading: citaLoading, error: citaError } = useCita(citaId);
  const [entered, setEntered] = useState(false);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => { const t = setTimeout(() => setEntered(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => { const i = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(i); }, []);

  const handleBack = () => {
    if (typeof onBack === 'function') { onBack(); return; }
    window.history.back();
  };

  const startedAt = useMemo(() => {
    const rec = rawStages?.find?.((s) => s?.stage === 'RECEPCION')?.createdAt;
    const iso = rec || rawStages?.[0]?.createdAt;
    const d = iso ? new Date(iso) : null;
    return d && Number.isFinite(d.getTime()) ? d.toISOString() : null;
  }, [rawStages]);

  const elapsed = useMemo(() => {
    if (!startedAt) return null;
    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return null;
    const diff = Math.max(0, tick - startMs);
    const totalSeconds = Math.floor(diff / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [startedAt, tick]);

  const loading = stagesLoading || citaLoading;
  const error = stagesError || citaError;

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-white text-lg animate-pulse">Cargando seguimiento...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="text-red-400 text-center px-6">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Banners de estado del socket */}
      {socketStatus === 'reconnecting' && (
        <div className="fixed top-16 left-0 right-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-200">
              ⚠️ Conexión perdida. Reconectando...
            </div>
          </div>
        </div>
      )}
      {socketStatus === 'failed' && (
        <div className="fixed top-16 left-0 right-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-4">
              <div className="text-sm font-bold text-red-200">❌ No se pudo reconectar. Por favor recarga la página.</div>
              <button type="button" onClick={() => window.location.reload()}
                className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest transition-colors">
                Recargar
              </button>
            </div>
          </div>
        </div>
      )}
      {showUpdatedBadge && (
        <div className="fixed top-24 right-4 z-50">
          <div className="px-3 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-black uppercase tracking-widest">
            ✅ Actualizado
          </div>
        </div>
      )}
      {showSyncedBadge && (
        <div className="fixed top-24 right-4 z-50">
          <div className="px-3 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs font-black uppercase tracking-widest">
            ✅ Sincronizado
          </div>
        </div>
      )}

      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[#6366f1]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-28 w-[560px] h-[560px] rounded-full bg-[#3b82f6]/15 blur-3xl" />
      </div>

      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 transition-opacity duration-500 ${entered ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <div className="space-y-4">
          <button type="button" onClick={handleBack}
            className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
            ← Volver
          </button>
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
              MotoExpert · Seguimiento
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Cita #{citaId}
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-10">
          {isEmployee ? (
            <EmployeeView
              citaId={citaId}
              stages={stages}
              cita={cita}
              startedAt={startedAt}
              elapsed={elapsed}
              updateStage={updateStage}
              addUpdate={addUpdate}
              showToast={showToast}
            />
          ) : (
            <ClientView
              stages={stages}
              cita={cita}
              startedAt={startedAt}
              elapsed={elapsed}
              live={socketStatus === 'connected'}
            />
          )}
        </div>
      </div>
    </div>
  );
}