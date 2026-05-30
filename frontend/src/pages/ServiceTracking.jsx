import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ─── Constantes ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 'recepcion',   title: 'Recepción'   },
  { id: 'diagnostico', title: 'Diagnóstico' },
  { id: 'proceso',     title: 'En Proceso'  },
  { id: 'finalizado',  title: 'Finalizado'  },
];

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
    data = { text: backendStage.observation || '', photo: (backendStage.images || [])[0] || '' };
  } else if (id === 'proceso') {
    data = {
      updates: (backendStage.updates || []).map((u, i) => ({
        id: `${i}-${u.timestamp}`,
        text: u.text,
        at: u.timestamp,
      })),
    };
  }
  return { id, completed: backendStage.completed, data, updatedAt: backendStage.updatedAt };
};

// ─── Hook de API ───────────────────────────────────────────────────────────────

function useServiceStages(citaId) {
  const [rawStages, setRawStages] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const initStages = useCallback(async () => {
    const { data } = await axios.patch(`${API}/citas/${citaId}/stages/init`, {}, { headers: getHeaders() });
    setRawStages(data);
  }, [citaId]);

  const fetchStages = useCallback(async () => {
    if (!citaId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/citas/${citaId}/stages`, { headers: getHeaders() });
      if (Array.isArray(data) && data.length === 0) {
        await initStages();
      } else {
        setRawStages(data);
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        await initStages();
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [citaId, initStages]);

  const updateStage = useCallback(async (localId, payload) => {
    const stageKey = STAGE_MAP_REVERSE[localId];
    const { data } = await axios.patch(
      `${API}/citas/${citaId}/stages/${stageKey}`,
      payload,
      { headers: getHeaders() },
    );
    setRawStages((prev) => prev.map((s) => (s.stage === stageKey ? data : s)));
    return data;
  }, [citaId]);

  const addUpdate = useCallback(async (text) => {
    return updateStage('proceso', { updates: [{ text, timestamp: nowIso() }] });
  }, [updateStage]);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  // Convierte rawStages del backend → formato de stages local
  const stages = useMemo(() => {
    const TITLES = { recepcion: 'Recepción', diagnostico: 'Diagnóstico', proceso: 'En Proceso', finalizado: 'Finalizado' };
    const ORDER  = ['recepcion', 'diagnostico', 'proceso', 'finalizado'];

    if (!rawStages.length) {
      return ORDER.map((id, idx) => ({
        id, title: TITLES[id],
        status: idx === 0 ? 'active' : 'pending',
        completedAt: null,
        data: id === 'proceso' ? { updates: [] } : id === 'diagnostico' ? { text: '', photo: '' } : { photos: [], note: '' },
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
        data: b?.data || (id === 'proceso' ? { updates: [] } : id === 'diagnostico' ? { text: '', photo: '' } : { photos: [], note: '' }),
      };
    });
  }, [rawStages]);

  return { stages, loading, error, updateStage, addUpdate };
}

// ─── Componentes UI ────────────────────────────────────────────────────────────

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

const Toggle = ({ value, onChange }) => (
  <div className="inline-flex p-1 rounded-2xl bg-white/5 border border-white/10">
    {['cliente', 'empleado'].map((v) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className={`h-11 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
          value === v ? 'bg-gradient-to-r from-[#6366f1] to-[#3b82f6] text-white' : 'text-white/70 hover:text-white'
        }`}>
        Vista {v.charAt(0).toUpperCase() + v.slice(1)}
      </button>
    ))}
  </div>
);

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

const ProgressBar = ({ stages }) => {
  const lastDoneIndex = Math.max(-1, ...stages.map((s, i) => (s.status === 'done' ? i : -1)));
  const progressPct = stages.length > 1 && lastDoneIndex >= 0 ? (lastDoneIndex / (stages.length - 1)) * 100 : 0;
  return (
    <div className="border border-white/10 bg-[#1e293b]/60 rounded-3xl p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs font-black uppercase tracking-widest text-white/60">Progreso</div>
        <div className="text-xs font-black uppercase tracking-widest text-white/60">
          {stages.filter((s) => s.status === 'done').length}/{stages.length}
        </div>
      </div>
      <div className="mt-6 relative">
        <div className="absolute left-4 right-4 top-[18px] h-px bg-white/10" />
        <div className="absolute left-4 top-[18px] h-px bg-emerald-500/35 transition-all duration-500"
          style={{ width: `calc(${progressPct}% * (100% - 2rem) / 100)` }} />
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
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {images.map((src, idx) => (
        <div key={`${idx}-${src.slice(0, 16)}`}
          className="shrink-0 w-[220px] h-[130px] rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          <img src={src} alt="" className="w-full h-full object-cover" />
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

const SidebarContent = ({ stages }) => (
  <div className="space-y-4">
    <div className="text-xs font-black uppercase tracking-widest text-white/60">Resumen</div>
    <div className="space-y-3">
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
);

const MobileSummary = ({ stages, open, onToggle }) => (
  <div className="md:hidden mt-6 border border-white/10 bg-[#1e293b]/60 rounded-3xl overflow-hidden">
    <button type="button" onClick={onToggle}
      className="w-full h-12 px-5 flex items-center justify-between text-left">
      <div className="text-xs font-black uppercase tracking-widest text-white/70">Resumen</div>
      <svg className={`w-5 h-5 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </button>
    {open && <div className="px-5 pb-5"><SidebarContent stages={stages} /></div>}
  </div>
);

// ─── Componente principal ───────────────────────────────────────────────────────

export default function ServiceTracking({ citaId = 123, onBack }) {
  const { stages, loading, error, updateStage, addUpdate } = useServiceStages(citaId);

  const [mode, setMode]           = useState('cliente');
  const [entered, setEntered]     = useState(false);
  const [viewVisible, setViewVisible] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [saving, setSaving]       = useState(false);

  // Estado local formularios empleado
  const [recepcionNote, setRecepcionNote]     = useState('');
  const [recepcionPhotos, setRecepcionPhotos] = useState([]);
  const [diagText, setDiagText]               = useState('');
  const [diagPhoto, setDiagPhoto]             = useState('');
  const [procUpdate, setProcUpdate]           = useState('');
  const [procLog, setProcLog]                 = useState([]);
  const [finalNote, setFinalNote]             = useState('');
  const [finalPhotos, setFinalPhotos]         = useState([]);

  const recepcionRef = useRef(null);
  const diagRef      = useRef(null);
  const finalRef     = useRef(null);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => {
    setViewVisible(false);
    const t = setTimeout(() => setViewVisible(true), 10);
    return () => clearTimeout(t);
  }, [mode]);

  // Sincronizar formulario con datos ya guardados en backend
  useEffect(() => {
    const r = stages.find((s) => s.id === 'recepcion');
    if (r?.status === 'done') { setRecepcionNote(r.data.note || ''); setRecepcionPhotos(r.data.photos || []); }
  }, [stages]);
  useEffect(() => {
    const d = stages.find((s) => s.id === 'diagnostico');
    if (d?.status === 'done') { setDiagText(d.data.text || ''); setDiagPhoto(d.data.photo || ''); }
  }, [stages]);
  useEffect(() => {
    const p = stages.find((s) => s.id === 'proceso');
    if (p?.status === 'done') setProcLog(p.data.updates || []);
  }, [stages]);
  useEffect(() => {
    const f = stages.find((s) => s.id === 'finalizado');
    if (f?.status === 'done') { setFinalNote(f.data.note || ''); setFinalPhotos(f.data.photos || []); }
  }, [stages]);

  const handleBack = () => {
    if (typeof onBack === 'function') { onBack(); return; }
    window.history.back();
  };

  // ── Handlers archivos ──
  const handleRecepcionFiles = async (e) => {
    const urls = await readFilesAsDataUrls(e.target.files, 3);
    setRecepcionPhotos((prev) => [...prev, ...urls].slice(0, 3));
    e.target.value = '';
  };
  const handleDiagFile = async (e) => {
    const urls = await readFilesAsDataUrls(e.target.files, 1);
    setDiagPhoto(urls[0] || '');
    e.target.value = '';
  };
  const handleFinalFiles = async (e) => {
    const urls = await readFilesAsDataUrls(e.target.files, 3);
    setFinalPhotos((prev) => [...prev, ...urls].slice(0, 3));
    e.target.value = '';
  };

  // ── Guardar etapas en API ──
  const saveRecepcion = async () => {
    try { setSaving(true); await updateStage('recepcion', { observation: recepcionNote, images: recepcionPhotos, completed: true }); }
    catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };
  const saveDiagnostico = async () => {
    try { setSaving(true); await updateStage('diagnostico', { observation: diagText, images: diagPhoto ? [diagPhoto] : [], completed: true }); }
    catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };
  const addProcessUpdate = async () => {
    const text = procUpdate.trim();
    if (!text) return;
    try {
      setSaving(true);
      await addUpdate(text);
      setProcLog((prev) => [{ id: `${Date.now()}`, text, at: nowIso() }, ...prev]);
      setProcUpdate('');
    } catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };
  const saveProceso = async () => {
    try { setSaving(true); await updateStage('proceso', { completed: true }); }
    catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };
  const saveFinalizado = async () => {
    try { setSaving(true); await updateStage('finalizado', { observation: finalNote, images: finalPhotos, completed: true }); }
    catch (e) { alert('Error: ' + e.message); } finally { setSaving(false); }
  };

  const btnClass = `w-full h-11 rounded-2xl bg-gradient-to-r from-[#6366f1] to-[#3b82f6]
    disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all`;

  // ── Loading / Error ──
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

  // ── Vista Empleado ──
  const EmployeeView = () => (
    <div className={`mt-8 md:mt-10 transition-all duration-300 ${viewVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
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

              // RECEPCIÓN
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
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Fotos de llegada (1–3)</div>
                      <button type="button" onClick={() => recepcionRef.current?.click()}
                        className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
                        Subir fotos
                      </button>
                      <input ref={recepcionRef} type="file" accept="image/*" multiple className="hidden" onChange={handleRecepcionFiles} />
                    </div>
                    <Gallery images={recepcionPhotos} />
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Observación</div>
                      <textarea rows={4} value={recepcionNote} onChange={(e) => setRecepcionNote(e.target.value)}
                        placeholder="Ej. Rayón en carenado izquierdo, nivel de combustible bajo..."
                        className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                    </div>
                    <button type="button" onClick={saveRecepcion}
                      disabled={saving || recepcionPhotos.length === 0 || !recepcionNote.trim()} className={btnClass}>
                      {saving ? 'Guardando...' : 'Marcar recepción como completada'}
                    </button>
                  </div>
                );
              }

              // DIAGNÓSTICO
              if (s.id === 'diagnostico') {
                if (isDone) return (
                  <div className="mt-5 space-y-4">
                    {s.data.photo ? <Gallery images={[s.data.photo]} /> : null}
                    <div className="text-sm font-bold text-white/80 whitespace-pre-wrap">{s.data.text}</div>
                  </div>
                );
                return (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Diagnóstico técnico</div>
                      <textarea rows={6} value={diagText} onChange={(e) => setDiagText(e.target.value)}
                        placeholder="Describe hallazgos, causas probables, recomendaciones, repuestos..."
                        className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Foto opcional</div>
                      <button type="button" onClick={() => diagRef.current?.click()}
                        className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
                        Subir foto
                      </button>
                      <input ref={diagRef} type="file" accept="image/*" className="hidden" onChange={handleDiagFile} />
                    </div>
                    {diagPhoto ? <Gallery images={[diagPhoto]} /> : null}
                    <button type="button" onClick={saveDiagnostico}
                      disabled={saving || !diagText.trim()} className={btnClass}>
                      {saving ? 'Guardando...' : 'Marcar diagnóstico como completado'}
                    </button>
                  </div>
                );
              }

              // EN PROCESO
              if (s.id === 'proceso') {
                if (isDone) return (
                  <div className="mt-5 space-y-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                      <input value={procUpdate} onChange={(e) => setProcUpdate(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addProcessUpdate()}
                        placeholder="Ej. Se cambió el aceite, se revisaron frenos..."
                        className="h-11 rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors" />
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
                    <button type="button" onClick={saveProceso}
                      disabled={saving || procLog.length === 0} className={btnClass}>
                      {saving ? 'Guardando...' : 'Marcar en proceso como completado'}
                    </button>
                  </div>
                );
              }

              // FINALIZADO
              if (isDone) return (
                <div className="mt-5 space-y-4">
                  <Gallery images={s.data.photos} />
                  <div className="text-sm font-bold text-white/80">{s.data.note}</div>
                </div>
              );
              return (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Fotos del vehículo listo (1–3)</div>
                    <button type="button" onClick={() => finalRef.current?.click()}
                      className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
                      Subir fotos
                    </button>
                    <input ref={finalRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFinalFiles} />
                  </div>
                  <Gallery images={finalPhotos} />
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Observación final</div>
                    <textarea rows={4} value={finalNote} onChange={(e) => setFinalNote(e.target.value)}
                      placeholder="Ej. Prueba de ruta OK, se recomienda control a los 500 km..."
                      className="w-full rounded-2xl bg-[#0f172a]/60 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#6366f1]/50 transition-colors resize-none" />
                  </div>
                  <button type="button" onClick={saveFinalizado}
                    disabled={saving || finalPhotos.length === 0 || !finalNote.trim()} className={btnClass}>
                    {saving ? 'Guardando...' : 'Marcar finalizado como completado'}
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
            <SidebarContent stages={stages} />
          </div>
          <MobileSummary stages={stages} open={summaryOpen} onToggle={() => setSummaryOpen((v) => !v)} />
        </div>
      </div>
    </div>
  );

  // ── Vista Cliente ──
  const ClientView = () => (
    <div className={`mt-8 md:mt-10 transition-all duration-300 ${viewVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <ProgressBar stages={stages} />
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
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#93c5fd] text-[10px] font-black uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#60a5fa] opacity-50" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#60a5fa]" />
                        </span>
                        En vivo
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 1010 10" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <StatusPill state="active" />
                </div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-[#0f172a]/40 px-4 py-4 text-sm font-bold text-white/70">
                  El taller está trabajando en esta etapa. Verás novedades cuando se registren.
                </div>
              </CardShell>
            );

            // Completada
            const content = (() => {
              if (s.id === 'recepcion' || s.id === 'finalizado') return (
                <div className="mt-5 space-y-4">
                  <Gallery images={s.data.photos} />
                  <div className="text-sm font-bold text-white/80">{s.data.note}</div>
                </div>
              );
              if (s.id === 'diagnostico') return (
                <div className="mt-5 space-y-4">
                  {s.data.photo ? <Gallery images={[s.data.photo]} /> : null}
                  <div className="text-sm font-bold text-white/80 whitespace-pre-wrap">{s.data.text}</div>
                </div>
              );
              return (
                <div className="mt-5 space-y-3">
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
            <SidebarContent stages={stages} />
          </div>
          <MobileSummary stages={stages} open={summaryOpen} onToggle={() => setSummaryOpen((v) => !v)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-[#6366f1]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-28 w-[560px] h-[560px] rounded-full bg-[#3b82f6]/15 blur-3xl" />
      </div>

      <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 transition-opacity duration-500 ${entered ? 'opacity-100' : 'opacity-0'}`}>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={handleBack}
              className="h-11 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors">
              ← Volver
            </button>
            <div className="hidden md:block">
              <Toggle value={mode} onChange={setMode} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
              MotoExpert · Seguimiento
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Cita #{citaId}
            </div>
            <div className="md:hidden flex justify-center pt-1">
              <Toggle value={mode} onChange={setMode} />
            </div>
          </div>
        </div>

        {/* Progress bar (siempre visible) */}
        <div className="mt-8 md:mt-10">
          <ProgressBar stages={stages} />
        </div>

        {mode === 'empleado' ? <EmployeeView /> : <ClientView />}
      </div>
    </div>
  );
}