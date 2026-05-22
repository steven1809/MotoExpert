import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useVehicleGuard } from '../hooks/useVehicleGuard';
import NoVehicleWarning from '../components/NoVehicleWarning';
import DuplicateBookingWarning from '../components/DuplicateBookingWarning';
import AppointmentsSearchAndFilter from '../components/AppointmentsSearchAndFilter';
import CustomSelect from '../components/CustomSelect';
import { QRCodeCanvas } from 'qrcode.react';
import carHeroImg from '../assets/images/1.png';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const getConditionStyle = (condition) => {
  switch (condition?.toLowerCase()) {
    case 'bueno':
    case 'good':
      return { className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Bueno' };
    case 'regular':
    case 'fair':
      return { className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Regular' };
    case 'critico':
    case 'critical':
      return { className: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Crítico' };
    default:
      return { className: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'Finalizado' };
  }
};

const formatCompletedDateTime = (dateStr) => {
  if (!dateStr) return { date: '—', time: '—' };
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return { date: '—', time: '—' };
  return {
    date: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
};

const StarRating = ({ value, onChange, readOnly = false, size = 'sm' }) => {
  const stars = [1, 2, 3, 4, 5];
  const sizeClasses = size === 'md' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <svg
            className={`${sizeClasses} ${s <= value ? 'text-amber-400' : 'text-white/10'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ServiceReportModal = ({ report, rating, onClose, onSubmitRating }) => {
  const [specialistRating, setSpecialistRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!report) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => setVisible(true));

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      setVisible(false);
      setSpecialistRating(0);
      setServiceRating(0);
      setIsSubmitting(false);
    };
  }, [report, onClose]);

  if (!report) return null;

  const condition = getConditionStyle(report.report?.condition);
  const { date, time } = formatCompletedDateTime(report.completedAt || report.fecha);
  const isAlreadyRated = Boolean(rating || report.rated);

  const handleSubmit = async () => {
    if (!specialistRating || !serviceRating || !onSubmitRating) return;
    setIsSubmitting(true);
    try {
      await onSubmitRating({
        citaId: report.id,
        specialistRating,
        serviceRating,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] bg-[#0b1220] border border-white/10 shadow-2xl transform transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-2xl font-black text-[#F8FAFC] truncate italic uppercase tracking-tighter">
                  {report.servicio?.nombre || 'Servicio'}
                </h3>
                <span
                  className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${condition.className}`}
                >
                  {condition.label}
                </span>
              </div>
              <div className="text-sm text-[#94A3B8] font-medium mt-1">
                {report.vehiculo?.placa || '—'} • {report.vehiculo?.modelo || '—'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="h-10 w-10 inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-8" />

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7080]">
                Trabajo Realizado
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed font-medium">
                {report.report?.workPerformed || '—'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7080]">
                Piezas Utilizadas
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed font-medium">
                {report.report?.partsUsed || '—'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7080]">
                Observaciones
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed font-medium">
                {report.report?.observations || '—'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7080]">
                Fecha y Hora
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed font-medium">
                {date} • {time}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-8" />

        <div className="p-8 space-y-6">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6b7080]">
            Tu Calificación
          </div>

          {isAlreadyRated ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">
                  Especialista
                </div>
                <StarRating value={rating?.specialistRating || 0} readOnly size="md" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">
                  Calidad del Servicio
                </div>
                <StarRating value={rating?.serviceRating || 0} readOnly size="md" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">
                    Especialista
                  </div>
                  <StarRating value={specialistRating} onChange={setSpecialistRating} size="md" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">
                    Calidad del Servicio
                  </div>
                  <StarRating value={serviceRating} onChange={setServiceRating} size="md" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!specialistRating || !serviceRating || isSubmitting}
                className="w-full py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#2563EB]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const limpiarTexto = (texto) => {
  if (!texto) return '';
  return String(texto)
    .replace(/♦/g, 'ó')
    .replace(/\?/g, 'ó')
    .replace(/â€™/g, "'")
    .replace(/Ã³/g, 'ó')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã­/g, 'í')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/\uFFFD/g, 'ó')
    .trim();
};

const getServicioDedupeKey = (nombre) => {
  const base = limpiarTexto(nombre);
  const normalized = (base || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const alnum = normalized.replace(/[^a-z0-9]/g, '');
  const consonants = alnum.replace(/[aeiou]/g, '');

  if (consonants.includes('lvd') && consonants.includes('bsc')) return 'lavado_basico';
  if (consonants.includes('lvd') && consonants.includes('xprs')) return 'lavado_express';
  if (consonants.includes('lvd') && consonants.includes('spcl')) return 'lavado_especial';
  if (consonants.includes('lvd') && consonants.includes('prmm')) return 'lavado_premium';

  return consonants;
};

const getServicioScore = (s) => {
  const descripcionLen = (s?.descripcion || '').toString().trim().length;
  const incluyeLen = Array.isArray(s?.incluye)
    ? s.incluye.length
    : (s?.incluye || '').toString().split(',').filter(Boolean).length;
  const beneficiosLen = Array.isArray(s?.beneficios)
    ? s.beneficios.length
    : (s?.beneficios || '').toString().split(',').filter(Boolean).length;
  const hasPrecio = Number.isFinite(Number(s?.precio)) && Number(s?.precio) > 0 ? 1 : 0;
  const hasDuracion = Number.isFinite(Number(s?.duracion)) && Number(s?.duracion) > 0 ? 1 : 0;
  return Math.min(descripcionLen, 120) + incluyeLen * 10 + beneficiosLen * 10 + hasPrecio * 5 + hasDuracion * 5;
};

const dedupeServicios = (list) => {
  const input = Array.isArray(list) ? list : [];
  const map = new Map();

  for (const servicio of input) {
    const nombreLimpio = limpiarTexto(servicio?.nombre);
    const key = getServicioDedupeKey(servicio?.nombre);
    if (!key) continue;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...servicio, nombre: nombreLimpio });
      continue;
    }

    const prevScore = getServicioScore(prev);
    const nextScore = getServicioScore(servicio);
    if (nextScore > prevScore) {
      map.set(key, { ...servicio, nombre: nombreLimpio });
      continue;
    }

    if (nextScore === prevScore) {
      const prevId = Number(prev?.id);
      const nextId = Number(servicio?.id);
      if (Number.isFinite(prevId) && Number.isFinite(nextId) && nextId > prevId) {
        map.set(key, { ...servicio, nombre: nombreLimpio });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
};

const TokenCodeModal = ({ isOpen, onClose, tokenCode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-[#2a2d3a] p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">
              Código de entrega
            </h2>
            <p className="text-[#94A3B8] text-sm font-medium mt-1">
              Muestra este código al empleado cuando retires tu vehículo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:text-white hover:border-white/20 transition-all"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 text-center">
          <div className="px-6 py-4 rounded-2xl bg-[#1a1d27] border border-[#2a2d3a]">
            <div className="text-4xl font-black tracking-[0.25em] text-[#F8FAFC] font-mono">
              {tokenCode || '------'}
            </div>
          </div>

          {tokenCode ? (
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl border border-white/10 bg-[#0b0d12]">
                <QRCodeCanvas
                  value={tokenCode}
                  size={176}
                  includeMargin
                  fgColor="#FFFFFF"
                  bgColor="#0b0d12"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const AppointmentChatModal = ({ isOpen, onClose, alert }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const listRef = useRef(null);
  const socketRef = useRef(null);

  const appointmentId = alert?.appointmentId;
  const headerService = (alert?.serviceName || 'Servicio').toUpperCase();
  const headerPlate = (alert?.vehiclePlate || '—').toUpperCase();
  const headerMinutes = Number(alert?.minutesOverdue || 0);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const senderBadge = useMemo(() => {
    if (role === 'admin' || role === 'empleado' || role === 'trabajador') return 'STAFF';
    return 'CLIENT';
  }, [role]);
  const isStaff = senderBadge === 'STAFF';

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('token');
    if (!token || !appointmentId) return;

    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE_URL}/citas/${appointmentId}/chat`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('token');
    if (!token || !appointmentId) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_chat', { appointmentId });

    const handleNewMessage = (payload) => {
      const pid = payload?.appointmentId ?? payload?.appointment_id ?? payload?.appointmentId;
      if (Number(pid) !== Number(appointmentId)) return;
      setMessages((prev) => {
        const id = payload?.id;
        if (id && prev.some((m) => m.id === id)) return prev;
        const msg = {
          id: payload?.id || `rt:${Date.now()}`,
          appointment_id: appointmentId,
          sender_id: payload?.senderId ?? payload?.sender_id,
          sender_role: payload?.senderRole ?? payload?.sender_role,
          message: payload?.message,
          created_at: payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
        };
        return [...prev, msg];
      });
    };

    socket.on('new_message', handleNewMessage);

    const handleResolved = (payload) => {
      if (Number(payload?.appointmentId) !== Number(appointmentId)) return;
      if (onClose) onClose();
    };
    socket.on('appointment_resolved', handleResolved);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('appointment_resolved', handleResolved);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, appointmentId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onGlobalResolved = (e) => {
      const appointmentIdFromEvent = e?.detail?.appointmentId;
      if (Number(appointmentIdFromEvent) !== Number(appointmentId)) return;
      if (onClose) onClose();
    };
    window.addEventListener('motoexpert:appointment_resolved', onGlobalResolved);
    return () => window.removeEventListener('motoexpert:appointment_resolved', onGlobalResolved);
  }, [isOpen, appointmentId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const send = () => {
    const socket = socketRef.current;
    const message = text.trim();
    if (!socket || !message || !appointmentId) return;
    socket.emit('send_message', { appointmentId, message });
    setText('');
  };

  const resolve = (resolutionType) => {
    const socket = socketRef.current;
    if (!socket || !appointmentId) return;
    socket.emit('resolve_appointment', { appointmentId, resolutionType });
    setShowResolve(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="w-full max-w-[560px] bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-black text-white">
              {headerService} — {headerPlate}
            </div>
            <div className="text-xs text-[#EF9F27] font-bold mt-1">
              {headerMinutes} minutes overdue
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowResolve((v) => !v)}
                  className="h-10 px-3 rounded-xl bg-[#EF9F27]/10 hover:bg-[#EF9F27]/15 border border-[#EF9F27]/25 text-[#EF9F27] text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Mark as Resolved
                </button>
                {showResolve && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
                    <button
                      type="button"
                      onClick={() => resolve('Completado')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Completado
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve('Reprogramado')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Reprogramado
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-sm text-white/60">Loading chat…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-white/60">No messages yet.</div>
          ) : (
            messages.map((m) => {
              const badge = (m.sender_role || '').toUpperCase() === 'STAFF' ? 'STAFF' : 'CLIENT';
              const badgeClass =
                badge === 'STAFF'
                  ? 'bg-[#2563EB]/15 text-[#7b9cff] border-[#2563EB]/25'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              const ts = m.created_at ? new Date(m.created_at).toLocaleString() : '';
              return (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgeClass}`}>
                      {badge}
                    </span>
                    <span className="text-[11px] text-white/50">{ts}</span>
                  </div>
                  <div className="text-sm text-white mt-3 whitespace-pre-wrap break-words">
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder={`Message as ${senderBadge}...`}
              className="flex-1 h-11 px-4 bg-[#0b1220] border border-white/10 rounded-xl text-white placeholder-white/40 outline-none focus:border-[#2563EB]/50"
            />
            <button
              type="button"
              onClick={send}
              className="h-11 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Citas = ({
  setView,
  overdueAlerts = [],
  onDismissOverdueAlert,
  onOpenOverdueChat,
  onViewOverdueAppointment,
}) => {
  const { hasVehicles, loading: loadingVehicles } = useVehicleGuard();
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingDuplicateBooking, setExistingDuplicateBooking] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    fromDate: '',
    toDate: '',
    serviceFilter: '',
    vehicleTypeFilter: '',
    statusFilters: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processedCitas, setProcessedCitas] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAlert, setChatAlert] = useState(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [tokenModalCode, setTokenModalCode] = useState('');
  const [paymentByAppointment, setPaymentByAppointment] = useState({});
  const [notes, setNotes] = useState('');
  const [activeReportCitaId, setActiveReportCitaId] = useState(null);
  const [ratings, setRatings] = useState([]);
  const formSectionRef = useRef(null);
  const pendingSectionRef = useRef(null);
  const historySectionRef = useRef(null);
  
  const dedupeServicios = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter((s) => {
      const duplicate = seen.has(s.id);
      seen.add(s.id);
      return !duplicate;
    });
  };

  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    vehiculoId: '',
    servicioId: '',
    empleadoId: ''
  });

  useEffect(() => {
    fetchInitialData();
    checkPendingAction();
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (loading) return;
    const focusCitaId = localStorage.getItem('focusCitaId');
    if (!focusCitaId) return;
    const el = document.getElementById(`cita-${focusCitaId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      localStorage.removeItem('focusCitaId');
    }
  }, [loading, citas]);

  const checkPendingAction = () => {
    const pendingAction = localStorage.getItem('pendingAction');
    const selectedServiceId = localStorage.getItem('selectedServiceId');

    if (pendingAction === 'agendar_cita') {
      setShowForm(true);
      if (selectedServiceId) {
        setFormData(prev => ({ ...prev, servicioId: selectedServiceId }));
      }
      // Limpiar para que no se abra solo la próxima vez
      localStorage.removeItem('pendingAction');
      localStorage.removeItem('selectedServiceId');
    }
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [citasRes, vehiculosRes, serviciosRes, empleadosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/citas`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers }),
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/empleados`, { headers })
      ]);

      if (citasRes.ok && vehiculosRes.ok && serviciosRes.ok && empleadosRes.ok) {
        const [citasData, vehiculosData, serviciosData, empleadosData] = await Promise.all([
          citasRes.json(),
          vehiculosRes.json(),
          serviciosRes.json(),
          empleadosRes.json()
        ]);
        setCitas(citasData);
        setVehiculos(vehiculosData);
        setServicios(dedupeServicios(serviciosData));
        setEmpleados(empleadosData.filter(e => e.estado === 'activo')); // Solo activos
        
        // Cargar calificaciones para el historial
        fetchRatingsForCitas(citasData, headers);
      } else {
        setError('Error al obtener datos iniciales');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchInitialData();
    };
    window.addEventListener('motoexpert:refresh_notifications', handleRefresh);
    return () => {
      window.removeEventListener('motoexpert:refresh_notifications', handleRefresh);
    };
  }, []);

  const fetchRatingsForCitas = async (citasArray, headers) => {
    const ratingsList = [];
    for (const cita of citasArray.filter(c => c.estado === 'FINALIZADO')) {
      try {
        const response = await fetch(`${API_BASE_URL}/ratings/cita/${cita.id}`, { headers });
        if (response.ok) {
          const rating = await response.json();
          if (rating) ratingsList.push(rating);
        }
      } catch (err) {
        console.error(`Error fetching rating for cita ${cita.id}:`, err);
      }
    }
    setRatings(ratingsList);
  };

  const submitRating = async ({ citaId, specialistRating, serviceRating, comment }) => {
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ citaId, specialistRating, serviceRating, comment }),
      });

      if (response.ok) {
        const newRating = await response.json();
        setRatings(prev => [...prev, newRating]);
        setCitas(prev => prev.map(c => 
          c.id === citaId ? { ...c, rated: true } : c
        ));
        // Si el usuario tiene la función showToast en props (aunque sea un componente funcional, 
        // a veces se pasan desde el contenedor)
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  const fetchDisponibilidad = useCallback(async (fecha, servicioId, empleadoId = null) => {
    if (!fecha || !servicioId) return;
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/citas/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`;
      if (empleadoId) url += `&empleadoId=${empleadoId}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDisponibilidad(data);
      }
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!showForm) return;
    if (!formData.fecha || !formData.servicioId || !formData.empleadoId) return;
    fetchDisponibilidad(formData.fecha, formData.servicioId, formData.empleadoId);
  }, [fetchDisponibilidad, formData.empleadoId, formData.fecha, formData.servicioId, showForm]);

  const getCitaTimeInfo = useCallback((cita) => {
    const citaDateStr = cita.fecha;
    const citaTimeStr = cita.hora_inicio?.substring(0, 5); // HH:MM
    const citaDateTimeStr = `${citaDateStr}T${citaTimeStr}`;
    const citaDateTime = new Date(citaDateTimeStr);
    const now = currentTime;
    
    const timeUntilStartMs = citaDateTime - now;
    const timePastStartMs = now - citaDateTime;
    const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
    
    return {
      citaDateTime,
      timeUntilStartMs,
      timePastStartMs,
      isOverdue: timePastStartMs > 0 && cita.estado === 'PENDIENTE',
      isInGracePeriod: timePastStartMs > 0 && timePastStartMs <= gracePeriodMs,
      isPastGracePeriod: timePastStartMs > gracePeriodMs && cita.estado === 'PENDIENTE',
      gracePeriodRemainingMs: gracePeriodMs - timePastStartMs,
    };
  }, [currentTime]);

  const cancelCita = useCallback(async (citaId) => {
    if (processedCitas.has(citaId)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/${citaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'CANCELADO' }),
      });
      
      if (response.ok) {
        setProcessedCitas(prev => new Set([...prev, citaId]));
        setCitas(prev => prev.map(c => 
          c.id === citaId ? { ...c, estado: 'CANCELADO' } : c
        ));
      }
    } catch (err) {
      console.error('Error canceling cita:', err);
    }
  }, [processedCitas]);

  useEffect(() => {
    // Check for overdue appointments
    citas.forEach(cita => {
      if (cita.estado !== 'PENDIENTE') return;
      
      const timeInfo = getCitaTimeInfo(cita);
      if (timeInfo.isPastGracePeriod && !processedCitas.has(cita.id)) {
        cancelCita(cita.id);
      }
    });
  }, [currentTime, citas, processedCitas, cancelCita, getCitaTimeInfo]);

  const handleDateChange = (e) => {
    const fecha = e.target.value;
    setFormData({ ...formData, fecha, hora_inicio: '' });
    setDisponibilidad([]);
  };

  const handleServicioChange = (e) => {
    const servicioId = e.target.value;
    setFormData({ ...formData, servicioId, hora_inicio: '' });
    setDisponibilidad([]);
  };

  const checkForDuplicateBooking = () => {
    // Find selected vehicle and service from state
    const selectedVehicle = vehiculos.find(v => v.id.toString() === formData.vehiculoId);
    const selectedService = servicios.find(s => s.id.toString() === formData.servicioId);

    if (!selectedVehicle || !selectedService) return null;

    // Look for duplicate in existing citas
    const duplicate = citas.find(cita => 
      cita.vehiculo?.id === selectedVehicle.id &&
      cita.servicio?.id === selectedService.id &&
      cita.fecha === formData.fecha &&
      cita.hora_inicio !== formData.hora_inicio
    );

    return duplicate;
  };

  const confirmSubmit = async () => {
    // Close the modal
    setShowDuplicateWarning(false);
    setExistingDuplicateBooking(null);

    // Proceed with original submit logic
    await doSubmit();
  };

  const doSubmit = async () => {
    if (!formData.hora_inicio) {
      alert('Por favor selecciona un horario disponible');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      const [hRaw, mRaw] = (formData.hora_inicio || '').split(':');
      const h = Number(hRaw);
      const m = (mRaw ?? '00').toString().padStart(2, '0');
      const horaInicio =
        formData.hora_inicio.length === 5 ? `${formData.hora_inicio}:00` : formData.hora_inicio;
      const horaFin = Number.isFinite(h)
        ? `${String((h + 1) % 24).padStart(2, '0')}:${m}:00`
        : horaInicio;

      // Validación y conversión robusta de IDs
      const vehiculoId = parseInt(formData.vehiculoId, 10);
      const servicioId = parseInt(formData.servicioId, 10);
      const usuarioId = parseInt(userId, 10);
      const empleadoId = formData.empleadoId ? parseInt(formData.empleadoId, 10) : null;

      console.log("[DEBUG] Validando IDs antes de enviar:", { vehiculoId, servicioId, usuarioId, empleadoId });

      if (isNaN(vehiculoId) || vehiculoId <= 0) {
        alert('Por favor, selecciona un vehículo válido.');
        return;
      }

      if (isNaN(servicioId) || servicioId <= 0) {
        alert('Por favor, selecciona un servicio válido.');
        return;
      }

      if (isNaN(usuarioId) || usuarioId <= 0) {
        alert('Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.');
        return;
      }

      const payload = {
        fecha: formData.fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        vehiculoId,
        servicioId,
        usuarioId,
        ...(empleadoId && !isNaN(empleadoId) && { empleadoId }),
      };

      console.log("[DEBUG] PAYLOAD FINAL ENVIADO AL BACKEND:", payload);

      const response = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("[DEBUG] Cita creada con éxito:", data);
        const appointmentId = data?.id;
        const selectedVehicle = vehiculos.find(
          (v) => v.id?.toString() === formData.vehiculoId?.toString(),
        );
        const selectedService = servicios.find(
          (s) => s.id?.toString() === formData.servicioId?.toString(),
        );

        setShowForm(false);
        setFormData({ fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '', empleadoId: '' });
        fetchInitialData();

        if (appointmentId) {
          try {
            window.history.pushState(
              {
                appointmentId,
                summary: {
                  fecha: payload.fecha,
                  hora_inicio: payload.hora_inicio,
                  servicio: selectedService?.nombre || 'Servicio',
                  vehiculo: selectedVehicle
                    ? `${selectedVehicle.placa || ''}${selectedVehicle.modelo ? ` - ${selectedVehicle.modelo}` : ''}`.trim()
                    : 'Vehículo',
                },
              },
              '',
              '/appointments/payment',
            );
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch {
            window.location.assign('/appointments/payment');
          }
        }
      } else {
        console.error("[DEBUG] Error del backend al crear cita:", data);
        const errorMsg = Array.isArray(data.message) 
          ? data.message.join(', ') 
          : (data.message || 'Error al agendar cita');
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('[DEBUG] Error de red al enviar formulario de cita:', err);
      alert('Error de conexión');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate first
    const duplicate = checkForDuplicateBooking();
    if (duplicate) {
      setExistingDuplicateBooking(duplicate);
      setShowDuplicateWarning(true);
      return;
    }

    // No duplicate, proceed normally
    await doSubmit();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchInitialData();
      } else {
        alert('Error al eliminar cita');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
      }, []);

      const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1);
      };

      const getFilteredCitas = useCallback((citasArray) => {
      let filtered = [...citasArray];

      // Search term filter (for history: service, vehicle, worker)
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();

        filtered = filtered.filter(cita => {
          const serviceName = cita.servicio?.nombre?.toLowerCase() || '';
          const vehiclePlate = cita.vehiculo?.placa?.toLowerCase() || '';
          const vehicleModel = cita.vehiculo?.modelo?.toLowerCase() || '';
          const workerName = cita.empleado?.nombre?.toLowerCase() || '';

          return (
            serviceName.includes(term) ||
            vehiclePlate.includes(term) ||
            vehicleModel.includes(term) ||
            workerName.includes(term)
          );
        });
      }

      // Date range filter
      if (filters.fromDate) {
        filtered = filtered.filter(
          cita => cita.fecha >= filters.fromDate
        );
      }

      if (filters.toDate) {
        filtered = filtered.filter(
          cita => cita.fecha <= filters.toDate
        );
      }

      // Service filter
      if (filters.serviceFilter) {
        filtered = filtered.filter(
          cita => cita.servicio?.nombre === filters.serviceFilter
        );
      }

      // Vehicle type filter
      if (filters.vehicleTypeFilter) {
        filtered = filtered.filter(
          cita => cita.vehiculo?.tipo === filters.vehicleTypeFilter
        );
      }

      // Status filter
      if (filters.statusFilters.length > 0) {
        filtered = filtered.filter(cita =>
          filters.statusFilters.includes(cita.estado)
        );
      }

      return filtered;
    }, [filters]);

    const citasPendientes = useMemo(
      () => citas.filter((cita) => cita.estado === "PENDIENTE" || cita.estado === "EN PROCESO"),
      [citas],
    );

    const citasPendientesKey = useMemo(
      () => citasPendientes.map((c) => c.id).join(','),
      [citasPendientes],
    );

    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      if (!citasPendientes.length) return;

      let cancelled = false;
      Promise.all(
        citasPendientes.map(async (cita) => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/payments/appointment/${cita.id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (!res.ok) return [cita.id, null];
            const data = await res.json().catch(() => null);
            return [cita.id, data?.payment ?? null];
          } catch {
            return [cita.id, null];
          }
        }),
      ).then((entries) => {
        if (cancelled) return;
        setPaymentByAppointment((prev) => ({
          ...prev,
          ...Object.fromEntries(entries),
        }));
      });

      return () => {
        cancelled = true;
      };
    }, [citasPendientes, citasPendientesKey]);

    const allHistorialServicios = citas.filter(
      cita => cita.estado === "FINALIZADO" || cita.estado === "CANCELADO"
    );

    const historialServicios = getFilteredCitas(allHistorialServicios);

    const getPaginatedHistory = useCallback(() => {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;

      return historialServicios.slice(start, end);
    }, [currentPage, rowsPerPage, historialServicios]);

    const getPageNumbers = useCallback(() => {
      const totalPages = Math.ceil(
        historialServicios.length / rowsPerPage
      );

      const pageNumbers = [];
      const maxVisible = 5;

      let start = Math.max(
        1,
        currentPage - Math.floor(maxVisible / 2)
      );

      let end = Math.min(
        totalPages,
        start + maxVisible - 1
      );

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      return pageNumbers;
    }, [currentPage, rowsPerPage, historialServicios]);

    const getAlerts = useCallback(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
      const alerts = [];

      citas.forEach(cita => {
        const citaDate = cita.fecha;
        const isToday = citaDate === today;
        const isTomorrow = citaDate === tomorrow;
        const isExpired = citaDate < today && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO');

        if (cita.estado === 'EN PROCESO') {
          alerts.push({
            id: `in-progress-${cita.id}`,
            type: 'in-progress',
            cita,
            priority: 1
          });
        } else if (isToday && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO')) {
          alerts.push({
            id: `today-${cita.id}`,
            type: 'today',
            cita,
            priority: 2
          });
        } else if (isTomorrow && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO')) {
          alerts.push({
            id: `upcoming-${cita.id}`,
            type: 'upcoming',
            cita,
            priority: 3
          });
        } else if (isExpired) {
          alerts.push({
            id: `expired-${cita.id}`,
            type: 'expired',
            cita,
            priority: 4
          });
        }
      });

      return alerts.sort((a, b) => a.priority - b.priority);
    }, [citas]);

    const handleViewAppointment = (cita) => {
      // Scroll to Citas Pendientes section
      const section = document.querySelector('.citas-pendientes-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const handleReschedule = (cita) => {
      setShowForm(true);
      setFormData({
        fecha: '',
        hora_inicio: '',
        vehiculoId: cita.vehiculo?.id.toString() || '',
        servicioId: cita.servicio?.id.toString() || '',
        empleadoId: ''
      });
    };

    const handleCancelAppointment = async (cita) => {
      if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/citas/${cita.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          fetchInitialData();
        }
      } catch (err) {
        console.error('Error canceling appointment:', err);
      }
    };

    const getAlertStyle = (type) => {
      switch (type) {
        case 'in-progress':
          return {
            bg: 'bg-[#1D9E75]/8',
            border: 'border-[#1D9E75]/25',
            color: '#1D9E75',
            iconBg: 'bg-[#1D9E75]/15'
          };
        case 'today':
          return {
            bg: 'bg-[#378ADD]/8',
            border: 'border-[#378ADD]/25',
            color: '#378ADD',
            iconBg: 'bg-[#378ADD]/15'
          };
        case 'upcoming':
          return {
            bg: 'bg-[#EF9F27]/8',
            border: 'border-[#EF9F27]/25',
            color: '#EF9F27',
            iconBg: 'bg-[#EF9F27]/15'
          };
        case 'expired':
          return {
            bg: 'bg-[#E24B4A]/8',
            border: 'border-[#E24B4A]/25',
            color: '#E24B4A',
            iconBg: 'bg-[#E24B4A]/15'
          };
        default:
          return {
            bg: 'bg-[#2a2d3a]/8',
            border: 'border-[#2a2d3a]/25',
            color: '#94A3B8',
            iconBg: 'bg-[#2a2d3a]/15'
          };
      }
    };

    const getAlertIcon = (type) => {
      switch (type) {
        case 'in-progress':
          return (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          );
        case 'today':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'upcoming':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'expired':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
        default:
          return null;
      }
    };

    const getAlertTitle = (type, cita) => {
      const isToday = cita.fecha === new Date().toISOString().split('T')[0];
      switch (type) {
        case 'in-progress':
          return 'Service in progress';
        case 'today':
          return 'You have a service today';
        case 'upcoming':
          return isToday ? 'Upcoming service today' : 'Upcoming service tomorrow';
        case 'expired':
          return 'Expired appointment';
        default:
          return '';
      }
    };

    const getAlertMessage = (type, cita) => {
      const serviceName = cita.servicio?.nombre || 'Service';
      const plate = cita.vehiculo?.placa || 'vehicle';
      const date = new Date(cita.fecha).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = cita.hora_inicio?.substring(0, 5) || '';

      switch (type) {
        case 'in-progress':
          return `Your ${serviceName} for ${plate} is currently being performed by your specialist.`;
        case 'today':
          return `${serviceName} for ${plate} at ${time}. Your specialist will be ready for you.`;
        case 'upcoming':
          return `${serviceName} for vehicle ${plate} is scheduled for ${date} at ${time}.`;
        case 'expired':
          return `Your ${serviceName} appointment for ${plate} on ${date} was not completed. Would you like to reschedule?`;
        default:
          return '';
      }
    };

    const hasActiveFilters =
      filters.searchTerm ||
      filters.fromDate ||
      filters.toDate ||
      filters.serviceFilter ||
      filters.vehicleTypeFilter ||
      filters.statusFilters.length > 0;

    const filteredPendientes = getFilteredCitas(citasPendientes);
    const completedCitas = citas.filter((cita) => cita.estado === 'FINALIZADO');

    const nextCita = [...citasPendientes]
      .map((cita) => {
        const fecha = cita?.fecha;
        const hora = cita?.hora_inicio;
        const d = fecha && hora ? new Date(`${fecha}T${hora}`) : null;
        return { cita, d };
      })
      .filter((x) => x.d && Number.isFinite(x.d.getTime()))
      .sort((a, b) => a.d - b.d)[0]?.cita;

    const totalSpent = completedCitas.reduce((sum, cita) => {
      const raw = cita?.servicio?.precio;
      const n = typeof raw === 'number' ? raw : raw ? Number(raw) : 0;
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const selectedServicio = servicios.find((s) => String(s.id) === String(formData.servicioId)) || null;
    const selectedEmpleado = empleados.find((e) => String(e.id) === String(formData.empleadoId)) || null;
    const currentStepIndex = !formData.vehiculoId
      ? 0
      : !formData.servicioId
        ? 1
        : !formData.empleadoId
          ? 2
          : !formData.hora_inicio
            ? 3
            : 4;
    const canContinue = Boolean(formData.vehiculoId && formData.servicioId && formData.empleadoId && formData.fecha && formData.hora_inicio);

  if (loading || loadingVehicles) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasVehicles) {
    return <NoVehicleWarning setView={setView} />;
  }

  return (
    <>
      <ServiceReportModal
        report={citas.find((c) => c.id === activeReportCitaId)}
        rating={ratings.find((r) => r.citaId === activeReportCitaId)}
        onClose={() => setActiveReportCitaId(null)}
        onSubmitRating={submitRating}
      />
      {showDuplicateWarning && existingDuplicateBooking && (
        <DuplicateBookingWarning 
          existingBooking={existingDuplicateBooking} 
          onConfirm={confirmSubmit}
          onCancel={() => {
            setShowDuplicateWarning(false);
            setExistingDuplicateBooking(null);
          }}
        />
      )}
      <div className="min-h-screen bg-white dark:bg-[#020617] pb-24 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white">Citas</div>
            <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
              Gestiona tus citas, agenda nuevos servicios y revisa tu historial.
            </div>
          </div>

          <AppointmentChatModal
            isOpen={chatOpen}
            alert={chatAlert}
            onClose={() => {
              setChatOpen(false);
              setChatAlert(null);
            }}
          />

          <TokenCodeModal
            isOpen={tokenModalOpen}
            tokenCode={tokenModalCode}
            onClose={() => {
              setTokenModalOpen(false);
              setTokenModalCode('');
            }}
          />

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {overdueAlerts.length > 0 && (
            <div className="space-y-3">
              {overdueAlerts.map((a) => {
                const serviceName = (a.serviceName || 'Servicio').toUpperCase();
                const plate = (a.vehiclePlate || '—').toUpperCase();
                const minutes = Number(a.minutesOverdue || 0);
                return (
                  <div
                    key={a.appointmentId}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-[#EF9F27]/10 border border-[#EF9F27]/25"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EF9F27]/10 border border-[#EF9F27]/25 flex items-center justify-center text-[#EF9F27] flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-[#EF9F27]">
                          {serviceName} — {plate} ({minutes} min)
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          Expected end: {a.expectedEndTime ? new Date(a.expectedEndTime).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setChatAlert(a);
                          setChatOpen(true);
                          if (onOpenOverdueChat) onOpenOverdueChat(a);
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onViewOverdueAppointment) onViewOverdueAppointment(a.appointmentId);
                          const el = document.getElementById(`cita-${a.appointmentId}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 transition-all active:scale-95"
                      >
                        Ver cita
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissOverdueAlert && onDismissOverdueAlert(a.appointmentId)}
                        className="w-10 h-10 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                        aria-label="Cerrar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1220] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                      <path d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5h.75A2.25 2.25 0 0121 6.75v12A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-12A2.25 2.25 0 015.25 4.5H6V3a.75.75 0 01.75-.75zM4.5 9.75h15V6.75a.75.75 0 00-.75-.75H5.25a.75.75 0 00-.75.75v3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">Mis citas</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      Control y programación de servicios.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="relative w-full sm:w-[280px]">
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                      setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                    }}
                    className="w-full sm:w-auto h-11 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    + Agendar cita
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => pendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                      Citas pendientes
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5h.75A2.25 2.25 0 0121 6.75v12A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-12A2.25 2.25 0 015.25 4.5H6V3a.75.75 0 01.75-.75z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                    {filteredPendientes.length}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-[#94A3B8]">Ver todas →</div>
                </button>

                <button
                  type="button"
                  onClick={() => historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                      Servicios realizados
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm13.36-1.47a.75.75 0 10-1.22-.9l-3.2 4.33-1.6-1.6a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.14-.08l3.69-4.96z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                    {completedCitas.length}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-[#94A3B8]">Ver historial →</div>
                </button>

                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                      Próxima cita
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 8.25a.75.75 0 01.75.75v3.69l2.28 1.32a.75.75 0 11-.76 1.3l-2.65-1.54a.75.75 0 01-.37-.65V9a.75.75 0 01.75-.75z" />
                        <path fillRule="evenodd" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75 2.25 17.385 2.25 12 6.615 2.25 12 2.25zm0 1.5A8.25 8.25 0 1012 20.25 8.25 8.25 0 0012 3.75z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                    {nextCita?.fecha ? new Date(nextCita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '—'}
                    {nextCita?.hora_inicio ? `, ${nextCita.hora_inicio.substring(0, 5)}` : ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-[#94A3B8] truncate">
                    {nextCita?.servicio?.nombre || '—'}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                      Total gastado
                    </div>
                    <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75S17.385 21.75 12 21.75 2.25 17.385 2.25 12 6.615 2.25 12 2.25zm0 1.5A8.25 8.25 0 1012 20.25 8.25 8.25 0 0012 3.75zm.75 4.5a.75.75 0 00-1.5 0v.44c-.95.22-1.75.93-1.75 2.06 0 1.21.8 1.82 1.75 2.13l.43.14c.84.28 1.07.47 1.07.93 0 .52-.44.86-1.14.86-.73 0-1.18-.32-1.45-.57a.75.75 0 00-1.02 1.1c.34.31.86.64 1.61.83v.47a.75.75 0 001.5 0v-.41c1.14-.2 2-.97 2-2.28 0-1.33-.92-1.9-1.97-2.25l-.44-.14c-.78-.26-.84-.47-.84-.79 0-.4.34-.68.93-.68.6 0 .98.24 1.2.43a.75.75 0 10.98-1.13 3.1 3.1 0 00-1.4-.66v-.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                    {(() => {
                      try {
                        return new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          maximumFractionDigits: 0,
                        }).format(totalSpent);
                      } catch {
                        return `$${totalSpent.toLocaleString()}`;
                      }
                    })()}
                  </div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-[#94A3B8]">Ver detalle →</div>
                </div>
              </div>

              {getAlerts().length > 0 && (
                <div className="space-y-2">
                  {getAlerts().map((alert) => {
                    const style = getAlertStyle(alert.type);
                    return (
                      <div key={alert.id} className={`flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border ${style.bg} ${style.border}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${style.iconBg}`} style={{ color: style.color }}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-black" style={{ color: style.color }}>
                              {getAlertTitle(alert.type, alert.cita)}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                              {getAlertMessage(alert.type, alert.cita)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:justify-end">
                          {alert.type === 'in-progress' ? null : alert.type === 'expired' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReschedule(alert.cita)}
                                className="h-10 px-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                              >
                                Reprogramar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelAppointment(alert.cita)}
                                className="h-10 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleViewAppointment(alert.cita)}
                              className="h-10 px-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                            >
                              Ver detalles
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div ref={formSectionRef} />

              {showForm && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8">
                    <div className="rounded-3xl border border-white/10 bg-[#0b1220] overflow-hidden">
                      <div className="px-5 py-4 flex flex-col gap-4 border-b border-white/10">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-black text-white">Agendar nueva cita</div>
                            <div className="text-xs text-[#94A3B8]">Completa la información para agendar tu servicio.</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(false);
                              setNotes('');
                            }}
                            className="h-10 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                          >
                            Cerrar formulario
                          </button>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { label: 'Vehículo' },
                            { label: 'Servicio' },
                            { label: 'Trabajador' },
                            { label: 'Horario' },
                            { label: 'Confirmación' },
                          ].map((s, idx) => {
                            const isActive = idx === currentStepIndex;
                            const isDone = idx < currentStepIndex;
                            return (
                              <div key={s.label} className="flex items-center gap-2">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black border ${
                                  isDone
                                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                    : isActive
                                      ? 'bg-[#2563EB]/10 border-[#2563EB]/40 text-[#60A5FA]'
                                      : 'bg-white/5 border-white/10 text-white/40'
                                }`}>
                                  {idx + 1}
                                </div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${
                                  isActive || isDone ? 'text-white' : 'text-white/40'
                                }`}>
                                  {s.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                            Vehículo
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {vehiculos.slice(0, 3).map((v) => {
                              const isSelected = String(v.id) === String(formData.vehiculoId);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setFormData((prev) => ({ ...prev, vehiculoId: String(v.id) }))}
                                  className={`rounded-2xl border transition-colors overflow-hidden text-left ${
                                    isSelected
                                      ? 'border-[#2563EB]/50 bg-[#2563EB]/10'
                                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="relative h-20 bg-[#0b1220]">
                                    <img 
                                      src={v.imagen || carHeroImg} 
                                      alt="" 
                                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${v.imagen ? 'opacity-40' : 'opacity-15'}`} 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/80 to-transparent" />
                                    {isSelected && (
                                      <div className="absolute top-2 right-2 h-7 w-7 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                          <path fillRule="evenodd" d="M20.03 6.28a.75.75 0 01.19 1.05l-9 12a.75.75 0 01-1.09.12l-5-4.5a.75.75 0 111-1.12l4.39 3.95 8.5-11.33a.75.75 0 011.05-.17z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    <div className="text-xs font-black text-white truncate">
                                      {(v.marca || '').trim()} {(v.modelo || '').trim()} {v.anio ? String(v.anio) : ''}
                                    </div>
                                    <div className="text-[11px] text-white/50 truncate">{v.placa || '—'}</div>
                                  </div>
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => setView('vehiculos')}
                              className="rounded-2xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 flex flex-col items-center justify-center text-center"
                            >
                              <div className="h-12 w-12 rounded-3xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center text-2xl">
                                +
                              </div>
                              <div className="mt-3 text-xs font-black text-white">Agregar vehículo</div>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                            Servicio
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-10">
                              <CustomSelect
                                value={formData.servicioId}
                                onChange={(val) => handleServicioChange({ target: { name: 'servicioId', value: val } })}
                                options={servicios.map(s => ({
                                  value: s.id,
                                  label: limpiarTexto(s.nombre),
                                  sublabel: s.categoria || (s.precio ? `$${Number(s.precio).toLocaleString()}` : '')
                                }))}
                                placeholder="Selecciona el servicio"
                              />
                              {selectedServicio?.descripcion && (
                                <div className="mt-2 text-xs text-white/50">
                                  {selectedServicio.descripcion}
                                </div>
                              )}
                            </div>
                            <div className="lg:col-span-2 flex items-center justify-between lg:justify-end">
                              <div className="text-sm font-black text-white">
                                {selectedServicio?.precio ? `$${Number(selectedServicio.precio).toLocaleString()}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                            Trabajador
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {empleados.slice(0, 4).map((e) => {
                              const isSelected = String(e.id) === String(formData.empleadoId);
                              const isAvailable = String(e.estado || '').toLowerCase() === 'activo';
                              return (
                                <button
                                  key={e.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, empleadoId: String(e.id), hora_inicio: '' }));
                                    setDisponibilidad([]);
                                  }}
                                  className={`rounded-2xl border p-4 text-left transition-colors ${
                                    isSelected
                                      ? 'border-[#2563EB]/50 bg-[#2563EB]/10'
                                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center font-black">
                                      {(e.nombre || 'E').trim().slice(0, 1).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-black text-white truncate">{e.nombre || 'Especialista'}</div>
                                      <div className="text-[11px] text-white/50 truncate">{e.cargo || e.especialidad || 'Especialista'}</div>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border ${
                                      isAvailable
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                    }`}>
                                      <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                      {isAvailable ? 'Disponible hoy' : 'Disponible'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                              Horario
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {selectedEmpleado?.nombre ? `Horarios disponibles con ${selectedEmpleado.nombre}` : ''}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                                Fecha
                              </div>
                              <input
                                type="date"
                                name="fecha"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.fecha}
                                onChange={handleDateChange}
                                className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#2563EB]/50 transition-colors"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                                Sede
                              </div>
                              <input
                                value="MotoExpert"
                                readOnly
                                className="w-full h-11 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            {(() => {
                              if (!formData.fecha || !formData.servicioId || !formData.empleadoId) {
                                return (
                                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
                                    Selecciona fecha, servicio y trabajador para ver horarios.
                                  </div>
                                );
                              }
                              if (loadingSlots) {
                                return (
                                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
                                    Consultando disponibilidad...
                                  </div>
                                );
                              }
                              const now = new Date();
                              const today = now.toISOString().split('T')[0];
                              const isToday = formData.fecha === today;
                              const nowMinutes = now.getHours() * 60 + now.getMinutes();
                              const slots = (disponibilidad || [])
                                .filter((slot) => {
                                  if (!isToday) return true;
                                  const t = String(slot?.hora || '').substring(0, 5);
                                  const [hh, mm] = t.split(':');
                                  const mins = (Number(hh) * 60) + Number(mm);
                                  return Number.isFinite(mins) ? mins >= nowMinutes : true;
                                });
                              if (slots.length === 0) {
                                return (
                                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
                                    No hay horarios disponibles para la selección actual.
                                  </div>
                                );
                              }
                              return slots.map((slot) => {
                                const timeLabel = String(slot.hora || '').substring(0, 5);
                                const isSelected = String(formData.hora_inicio).substring(0, 5) === timeLabel;
                                const isAvailable = Boolean(slot.disponible);
                                return (
                                  <button
                                    key={slot.hora}
                                    type="button"
                                    disabled={!isAvailable}
                                    onClick={() => setFormData((prev) => ({ ...prev, hora_inicio: slot.hora }))}
                                    className={`h-10 rounded-2xl border text-[11px] font-black transition-colors ${
                                      isSelected
                                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                                        : isAvailable
                                          ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                          : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                    }`}
                                  >
                                    {timeLabel}
                                  </button>
                                );
                              });
                            })()}
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-white/50">
                            <div className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              Disponible
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-white/30" />
                              Ocupado
                            </div>
                            <div className="inline-flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#60A5FA]" />
                              Seleccionado
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">
                            Notas adicionales (opcional)
                          </div>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ej. Peticiones especiales, enfoque en detalles específicos, etc."
                            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#2563EB]/50 transition-colors resize-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(false);
                              setNotes('');
                            }}
                            className="h-11 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={!canContinue}
                            className="h-11 px-6 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] disabled:bg-white/10 disabled:text-white/40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2"
                          >
                            Continuar a confirmación
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M13.28 4.22a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06L19.47 12l-6.19-6.72a.75.75 0 010-1.06z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-slate-900 dark:text-white">Próximas citas</div>
                          <span className="px-2 py-0.5 rounded-full bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] text-[10px] font-black">
                            {filteredPendientes.slice(0, 2).length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => pendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                        >
                          Ver calendario
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        {filteredPendientes.slice(0, 2).length > 0 ? (
                          filteredPendientes.slice(0, 2).map((cita) => {
                            const dateObj = cita?.fecha ? new Date(cita.fecha) : null;
                            const day = dateObj && Number.isFinite(dateObj.getTime()) ? dateObj.getDate() : null;
                            const month = dateObj && Number.isFinite(dateObj.getTime())
                              ? dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
                              : '—';
                            const time = cita?.hora_inicio ? cita.hora_inicio.substring(0, 5) : '—';
                            return (
                              <div key={cita.id} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1220] overflow-hidden">
                                <div className="p-4 flex gap-3">
                                  <div className="h-14 w-14 rounded-3xl bg-[#0b1220] border border-white/10 flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-white/50 font-black">{month}</div>
                                    <div className="text-xl text-white font-black">{day ?? '—'}</div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                                      {cita.servicio?.nombre || 'Servicio'}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-[#94A3B8] truncate">
                                      {cita.vehiculo?.modelo || '—'} · {cita.vehiculo?.placa || '—'}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                                      <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                                        <span className="text-[#60A5FA]">⏰</span>
                                        <span className="font-bold">{time}</span>
                                      </div>
                                      <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                                        <span className="text-[#60A5FA]">📍</span>
                                        <span className="font-bold">AutoClean Center</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="px-4 pb-4 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                    className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    Ver detalles
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReschedule(cita)}
                                    className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    Reprogramar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(cita.id)}
                                    className="flex-1 h-10 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-8 text-center">
                            <div className="text-sm text-slate-600 dark:text-[#94A3B8]">No hay próximas citas.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-black text-slate-900 dark:text-white">Historial de citas</div>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-600 dark:text-white/60 text-[10px] font-black">
                            {historialServicios.slice(0, 5).length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                        >
                          Ver todo
                        </button>
                      </div>

                      <div className="p-5 space-y-3">
                        {historialServicios.slice(0, 5).length > 0 ? (
                          historialServicios.slice(0, 5).map((cita) => {
                            const priceRaw = cita?.servicio?.precio;
                            const priceNum = typeof priceRaw === 'number' ? priceRaw : priceRaw ? Number(priceRaw) : 0;
                            const priceText = Number.isFinite(priceNum) && priceNum > 0 ? `$${priceNum.toLocaleString()}` : '—';
                            return (
                              <div key={cita.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b1220] px-4 py-3">
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-slate-900 dark:text-white truncate">{cita.servicio?.nombre || 'Servicio'}</div>
                                  <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] truncate">
                                    {cita.fecha ? new Date(cita.fecha).toLocaleDateString() : '—'} · {String(cita.hora_inicio || '').substring(0, 5) || '—'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    cita.estado === 'FINALIZADO'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : cita.estado === 'CANCELADO'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  }`}>
                                    {cita.estado}
                                  </span>
                                  <div className="text-xs font-black text-slate-900 dark:text-white">{priceText}</div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-8 text-center">
                            <div className="text-sm text-slate-600 dark:text-[#94A3B8]">No hay historial.</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!showForm && (
          <>
          <div ref={pendingSectionRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900 dark:text-white">
                Citas pendientes
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setTimeout(() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                }}
                className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
              >
                Agendar nueva →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPendientes.length > 0 ? (
                filteredPendientes.map((cita) => {
                  const payment = paymentByAppointment?.[cita.id] ?? cita.payment ?? null;
                  const tokenCode = payment?.tokenCode || '';
                  const tokenUsed = Boolean(payment?.tokenUsed);
                  const tokenExpiresAt = payment?.tokenExpiresAt;
                  const tokenExpired = tokenExpiresAt ? new Date(tokenExpiresAt).getTime() <= Date.now() : true;
                  const canViewToken = Boolean(tokenCode) && !tokenUsed && !tokenExpired;
                  const dateObj = cita?.fecha ? new Date(cita.fecha) : null;
                  const day = dateObj && Number.isFinite(dateObj.getTime()) ? dateObj.getDate() : null;
                  const month = dateObj && Number.isFinite(dateObj.getTime())
                    ? dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
                    : '—';
                  const time = cita?.hora_inicio ? cita.hora_inicio.substring(0, 5) : '—';

                  return (
                    <div
                      id={`cita-${cita.id}`}
                      key={cita.id}
                      className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden"
                    >
                      <div className="p-5 flex gap-4">
                        <div className="h-16 w-16 rounded-3xl bg-[#0b1220] border border-white/10 flex flex-col items-center justify-center">
                          <div className="text-[10px] text-white/50 font-black">{month}</div>
                          <div className="text-2xl text-white font-black">{day ?? '—'}</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                                {cita.servicio?.nombre || 'Servicio'}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-[#94A3B8] truncate">
                                {cita.vehiculo?.modelo || '—'} · {cita.vehiculo?.placa || '—'}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              cita.estado === 'EN PROCESO'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {cita.estado}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                              <span className="text-[#60A5FA]">⏰</span>
                              <span className="font-bold">{time}</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-2">
                              <span className="text-[#60A5FA]">📍</span>
                              <span className="font-bold">AutoClean Center</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <div className="relative h-28 rounded-2xl overflow-hidden border border-white/10 bg-[#0b1220]">
                          <img 
                            src={cita.vehiculo?.imagen || carHeroImg} 
                            alt="" 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cita.vehiculo?.imagen ? 'opacity-40' : 'opacity-15'}`} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/85 to-transparent" />
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveReportCitaId(cita.id)}
                            className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                          >
                            Ver detalles
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReschedule(cita)}
                            className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                          >
                            Reprogramar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cita.id)}
                            className="flex-1 h-10 rounded-2xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={!canViewToken}
                          onClick={() => {
                            if (!canViewToken) return;
                            setTokenModalCode(tokenCode);
                            setTokenModalOpen(true);
                          }}
                          className="mt-3 w-full h-10 rounded-2xl bg-[#2563EB]/10 hover:bg-[#2563EB]/15 disabled:bg-white/5 disabled:text-white/40 disabled:cursor-not-allowed border border-[#2563EB]/20 text-[#60A5FA] text-[11px] font-black uppercase tracking-widest transition-colors"
                        >
                          Ver código de entrega
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-10 text-center">
                  <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
                    No hay citas pendientes actualmente.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div ref={historySectionRef} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-black text-slate-900 dark:text-white">
                Historial de citas
              </div>
              <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                {hasActiveFilters ? `${historialServicios.length} / ${allHistorialServicios.length}` : ''}
              </div>
            </div>

            <AppointmentsSearchAndFilter 
              citas={citas} 
              onFilterChange={handleFilterChange}
              searchPlaceholder="Buscar en historial por servicio, vehículo o especialista..."
            />

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b1220]">
                      {["Fecha", "Vehículo", "Servicio", "Sede", "Estado", "Precio", "Acciones"].map((head) => (
                        <th key={head} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-[0.2em]">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {getPaginatedHistory().length > 0 ? (
                      getPaginatedHistory().map((cita) => {
                        const priceRaw = cita?.servicio?.precio;
                        const priceNum = typeof priceRaw === 'number' ? priceRaw : priceRaw ? Number(priceRaw) : 0;
                        const priceText = Number.isFinite(priceNum) && priceNum > 0 ? `$${priceNum.toLocaleString()}` : '—';
                        return (
                          <tr key={cita.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                              {cita.fecha ? new Date(cita.fecha).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-black text-slate-900 dark:text-white">
                                {cita.vehiculo?.modelo || '—'}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                                {cita.vehiculo?.placa || '—'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                              {cita.servicio?.nombre || '—'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-[#94A3B8]">
                              AutoClean Center
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                cita.estado === 'FINALIZADO'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : cita.estado === 'CANCELADO'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {cita.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">
                              {priceText}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => setActiveReportCitaId(cita.id)}
                                className="h-9 px-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-slate-600 dark:text-[#94A3B8] text-sm">
                          {hasActiveFilters ? 'No hay resultados para los filtros seleccionados.' : 'No hay servicios en el historial.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {historialServicios.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Mostrando {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, historialServicios.length)} de {historialServicios.length}
                  </div>

                  <div className="flex items-center gap-3 justify-end">
                    <CustomSelect
                      value={rowsPerPage}
                      onChange={(val) => handleRowsPerPageChange({ target: { value: val } })}
                      options={[
                        { value: 5, label: '5' },
                        { value: 7, label: '7' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' }
                      ]}
                      className="w-20"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="h-9 w-9 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Anterior"
                      >
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {getPageNumbers().map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`h-9 w-9 rounded-2xl border text-xs font-black transition-colors ${
                            page === currentPage
                              ? 'bg-[#2563EB] border-[#2563EB] text-white'
                              : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setCurrentPage((prev) => {
                          const totalPages = Math.ceil(historialServicios.length / rowsPerPage);
                          return Math.min(totalPages, prev + 1);
                        })}
                        disabled={currentPage === Math.ceil(historialServicios.length / rowsPerPage)}
                        className="h-9 w-9 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Siguiente"
                      >
                        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </>
  );
};

export default Citas;
