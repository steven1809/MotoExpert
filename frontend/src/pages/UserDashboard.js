import React, { Component, useEffect, useState } from 'react';
import { lightTheme, darkTheme } from '../styles/theme';
import carHeroImg from "../assets/images/1.png";
import expressImg from "../assets/services/express.jpeg";
import interiorImg from "../assets/services/limpiezap.jpeg";
import motorImg from "../assets/services/motor.jpeg";
import protectionImg from "../assets/services/proteccionc.jpeg";
import StarRating from '../components/StarRating';
import agendarIcon from '../assets/iconos/cita.png';
import vehiculoIcon from '../assets/iconos/coche.png';
import reseñasIcon from '../assets/iconos/resenas.png';
import coronaIcon from '../assets/iconos/corona.png';
import lanzaderaIcon from '../assets/iconos/lanzadera.png';
import finalizarIcon from '../assets/iconos/finalizar.png';
import notificacionIcon from '../assets/iconos/notificacion.png';

import { QRCodeCanvas } from 'qrcode.react';

import { API_BASE_URL } from '../apiConfig';

const TokenCodeModal = ({ isOpen, onClose, tokenCode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f1117] border border-[#2a2d3a] p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
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
            className="p-2 bg-[#1a1d27] border border-[#2a2d3a] text-[#94A3B8] hover:text-white hover:border-white/20 transition-all"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 text-center">
          <div className="px-6 py-4 bg-[#1a1d27] border border-[#2a2d3a]">
            <div className="text-4xl font-black tracking-[0.25em] text-[#F8FAFC] font-mono">
              {tokenCode || '------'}
            </div>
          </div>

          {tokenCode ? (
            <div className="flex justify-center">
              <div className="p-4 border border-white/10 bg-[#0b0d12]">
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

const getConditionStyle = (condition) => {
  switch (condition) {
    case 'optimal':
      return {
        label: 'ÓPTIMO',
        className: 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1D9E75]'
      };
    case 'attention':
      return {
        label: 'ATENCIÓN',
        className: 'bg-[#BA7517]/10 border-[#BA7517] text-[#BA7517]'
      };
    case 'urgent':
      return {
        label: 'URGENTE',
        className: 'bg-[#E24B4A]/10 border-[#E24B4A] text-[#E24B4A]'
      };
    default:
      return {
        label: '—',
        className: 'bg-[#2a2d3a] border-[#2a2d3a] text-[#94A3B8]'
      };
  }
};

const formatCompletedDateTime = (completedAt) => {
  if (!completedAt) return { date: '—', time: '—' };
  const d = new Date(completedAt);
  return {
    date: d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }),
    time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  };
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
      onMouseDown={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-[520px] max-h-[80vh] overflow-y-auto bg-[#0b1220] border border-white/10 shadow-2xl transform transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-lg font-black text-[#F8FAFC] truncate">
                  {report.servicio?.nombre || 'Servicio'}
                </h3>
                <span
                  className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${condition.className}`}
                >
                  {condition.label}
                </span>
              </div>
              <div className="text-sm text-[#94A3B8]">
                {report.vehiculo?.placa || '—'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="h-10 w-10 inline-flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Trabajo Realizado</div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">{report.report?.workPerformed || '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Piezas Utilizadas</div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">{report.report?.partsUsed || '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Observaciones</div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">{report.report?.observations || '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Fecha y Hora</div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">{date} • {time}</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="p-5 space-y-4">
          <div className="text-sm font-black text-[#F8FAFC] uppercase tracking-wider">Calificación</div>

          {isAlreadyRated ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Especialista</div>
                <StarRating value={rating?.specialistRating || 0} readOnly size="md" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Calidad del Servicio</div>
                <StarRating value={rating?.serviceRating || 0} readOnly size="md" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Especialista</div>
                <StarRating value={specialistRating} onChange={setSpecialistRating} size="md" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">Calidad del Servicio</div>
                <StarRating value={serviceRating} onChange={setServiceRating} size="md" />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!specialistRating || !serviceRating || isSubmitting}
                className="w-full py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#2563EB]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

class UserDashboard extends Component {
  constructor(props) {
    super(props);
    const userId = localStorage.getItem('userId');
    const onboardingSeen = localStorage.getItem(`onboarding_seen_${userId}`) === 'true';
    
    this.state = {
      loading: true,
      servicios: [],
      misVehiculos: [],
      citas: [],
      previousCitas: [],
      onboardingSeen,
      ratings: [],
      activeReportCitaId: null,
      userProfile: null,
      notifications: [],
      tokenModalOpen: false,
      tokenModalCode: '',
    };
    this.pollingInterval = null;
  }

  componentDidMount() {
    this.fetchInitialFormData();
    this.fetchCitas();
    this.fetchUserProfile();
    this.fetchNotifications();
    this.pollingInterval = setInterval(() => {
      this.fetchCitas();
      this.fetchUserProfile();
      this.fetchNotifications();
    }, 12000);
  }

  fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        this.setState({ notifications: data });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/notificaciones/${id}/marcar-leida`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        this.setState(prev => ({
          notifications: prev.notifications.map(n => n.id === id ? { ...n, leida: true } : n)
        }));
        window.dispatchEvent(new CustomEvent('motoexpert:refresh_notifications'));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        const lastSeenLevelKey = `last_seen_level_${userId}`;
        const lastSeenLevel = parseInt(localStorage.getItem(lastSeenLevelKey), 10) || 1;
        if (userData.level > lastSeenLevel) {
          const newBonus = userData.bonuses?.[userData.bonuses.length - 1];
          if (newBonus && this.props.showToast) {
            this.props.showToast(
              `¡Felicidades! Subiste al Nivel ${userData.level}. Has ganado un bono: ${newBonus.code}`,
              'success'
            );
          }
          localStorage.setItem(lastSeenLevelKey, userData.level);
        } else if (!localStorage.getItem(lastSeenLevelKey)) {
          localStorage.setItem(lastSeenLevelKey, userData.level);
        }
        this.setState({ userProfile: userData });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  componentWillUnmount() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  checkAndUpdateOnboarding = (vehiculos, citas) => {
    const userId = localStorage.getItem('userId');
    const hasVehicles = vehiculos && vehiculos.length > 0;
    const hasCompletedCitas = citas && citas.some(c => c.estado === 'FINALIZADO');
    if (hasVehicles && hasCompletedCitas) {
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
      if (!this.state.onboardingSeen) this.setState({ onboardingSeen: true });
    }
  };

  fetchInitialFormData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [serviciosRes, vehiculosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers })
      ]);
      if (serviciosRes.ok && vehiculosRes.ok) {
        const [serviciosData, vehiculosData] = await Promise.all([
          serviciosRes.json(),
          vehiculosRes.json()
        ]);
        this.setState({ servicios: serviciosData.data || serviciosData, misVehiculos: vehiculosData, loading: false });
        this.checkAndUpdateOnboarding(vehiculosData, this.state.citas);
      } else {
        this.setState({ loading: false });
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      this.setState({ loading: false });
    }
  };

  fetchCitas = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (response.ok) {
        const data = await response.json();
        const citasArray = data.data || data;
        this.checkForStatusChanges(citasArray);
        this.setState(prev => ({ citas: citasArray, previousCitas: prev.citas }));
        this.checkAndUpdateOnboarding(this.state.misVehiculos, citasArray);
        this.fetchRatingsForCitas(citasArray, headers);
      }
    } catch (err) {
      console.error('Error fetching citas:', err);
    }
  };

  fetchRatingsForCitas = async (citas, headers) => {
    const ratings = [];
    for (const cita of citas.filter(c => c.estado === 'FINALIZADO')) {
      try {
        const response = await fetch(`${API_BASE_URL}/ratings/cita/${cita.id}`, { headers });
        if (response.ok) {
          const rating = await response.json();
          if (rating) ratings.push(rating);
        }
      } catch (err) {
        console.error(`Error fetching rating for cita ${cita.id}:`, err);
      }
    }
    this.setState({ ratings });
  };

  submitRating = async ({ citaId, specialistRating, serviceRating, comment }) => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ citaId, specialistRating, serviceRating, comment }),
      });
      if (response.ok) {
        const newRating = await response.json();
        this.setState(prev => ({
          ratings: [...prev.ratings, newRating],
          citas: prev.citas.map(c => c.id === citaId ? { ...c, rated: true } : c)
        }));
        if (this.props.showToast) this.props.showToast('Thank you for your feedback!', 'success');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  checkForStatusChanges = (newCitas) => {
    const { previousCitas } = this.state;
    const { showToast } = this.props;
    if (!showToast) return;
    newCitas.forEach(newCita => {
      const oldCita = previousCitas.find(c => c.id === newCita.id);
      if (oldCita && oldCita.estado !== newCita.estado) {
        if (oldCita.estado === 'PENDIENTE' && newCita.estado === 'EN PROCESO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha comenzado. ¡Estamos trabajando en tu vehículo!`, 'info');
        } else if (oldCita.estado === 'EN PROCESO' && newCita.estado === 'FINALIZADO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha sido completado. ¡Tu vehículo está listo!`, 'success');
        }
      }
    });
  };

  handleSaberMas = (servicio) => {
    const slug = servicio.nombre.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    window.location.hash = slug;
    this.props.setView('servicios');
  };

  handleAgendarServicio = (servicio) => {
    const { misVehiculos } = this.state;
    const { setView } = this.props;
    localStorage.setItem('selectedServiceId', servicio.id);
    if (misVehiculos && misVehiculos.length > 0) {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('citas');
    } else {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('vehiculos');
    }
  };

  handleOpenReport = (reportId) => this.setState({ activeReportCitaId: reportId });
  handleCloseReport = () => this.setState({ activeReportCitaId: null });

  render() {
    const { servicios, loading, citas, misVehiculos, ratings } = this.state;
    const { setView } = this.props;
    
    const userNameRaw = (localStorage.getItem('userName') || '').trim();
    const userName = userNameRaw || 'Usuario';
    const firstName = userName.split(' ')[0] || userName;

    const normalizeEstado = (estado) =>
      (estado || '').toString().toLowerCase().trim().replace(/\s+/g, '_');

    const isActiveAppointment = (cita) => {
      const estado = normalizeEstado(cita?.estado);
      return estado !== 'finalizado' && estado !== 'cancelado';
    };

    const parseAppointmentStart = (cita) => {
      const fecha = cita?.fecha;
      const hora = cita?.hora_inicio || cita?.horaInicio || cita?.hora;
      if (!fecha || !hora) return null;
      const d = new Date(`${fecha}T${hora}`);
      return Number.isFinite(d.getTime()) ? d : null;
    };

    const formatDateLong = (date) => {
      if (!date) return '—';
      try {
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' });
      } catch { return date.toLocaleDateString(); }
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return '—';
      const d = new Date(`1970-01-01T${timeStr}`);
      if (!Number.isFinite(d.getTime())) return timeStr;
      try { return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
      catch { return timeStr; }
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

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sortedActive = (Array.isArray(citas) ? citas : [])
      .filter(isActiveAppointment)
      .map((cita) => ({ cita, start: parseAppointmentStart(cita) }))
      .filter((x) => x.start)
      .filter((x) => {
        if (normalizeEstado(x.cita.estado) === 'en_proceso') return true;
        const diffMs = x.start - now;
        return diffMs >= -oneDayMs;
      })
      .sort((a, b) => {
        const statusA = normalizeEstado(a.cita.estado);
        const statusB = normalizeEstado(b.cita.estado);
        if (statusA === 'en_proceso' && statusB !== 'en_proceso') return -1;
        if (statusA !== 'en_proceso' && statusB === 'en_proceso') return 1;
        return a.start - b.start;
      });

    const upcomingCita = sortedActive[0]?.cita;
    const recommendedServices = (Array.isArray(servicios) ? servicios : []).slice(0, 4);
    const vehiclesPreview = (Array.isArray(misVehiculos) ? misVehiculos : []).slice(0, 2);
    const latestRatings = (Array.isArray(ratings) ? ratings : [])
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 2);

    const serviceImageForIndex = [expressImg, interiorImg, protectionImg, motorImg];
    const getServiceImage = (idx) => serviceImageForIndex[idx % serviceImageForIndex.length];

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );

    return (
      <div className="animate-in fade-in duration-700 pb-24 bg-[#F4F6FA] dark:bg-[#020617]">
        {/* SIN max-w ni px — ocupa el 100% */}
        <div className="w-full">
          {/* HERO (no padding-top to stick to navbar) */}
          <section className="relative overflow-hidden bg-gradient-to-r from-[#022873] via-[#0468BF] to-[#05AFF2] -mt-20">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.22),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.16),transparent_55%)]" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 pt-24 md:p-10 md:pt-28">
              <div className="space-y-4">
                <div className="text-3xl md:text-4xl font-black text-white">
                  ¡ Bienvenido, {firstName} !
                </div>
                <div className="text-sm md:text-base text-white/80">
                  Bienvenido de vuelta. Al mejor sistema de automatizacion de citas.
                </div>
              </div>
              <div className="relative h-40 md:h-56 lg:h-full min-h-[180px]">
                <div className="absolute inset-0 overflow-hidden border border-white/20 bg-white/5 rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-l from-[#05AFF2]/25 via-transparent to-transparent" />
                  <div className="absolute top-0 right-10 h-full w-[2px] bg-gradient-to-b from-transparent via-white/60 to-transparent opacity-80" />
                  <div className="absolute top-0 right-20 h-full w-[2px] bg-gradient-to-b from-transparent via-white/50 to-transparent opacity-70" />
                  <img
                    src={carHeroImg}
                    alt="Vehículo"
                    className="absolute right-0 bottom-0 h-full w-auto object-contain opacity-95 drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-6 pt-8">
            <div className="lg:col-span-8 space-y-6">

              {/* Accesos rápidos */}
              <section className="space-y-3">
                <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Accesos rápidos</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Agendar cita', sub: 'Nueva cita', icon: <img src={agendarIcon} alt="agendar" className="w-5 h-5"/>, view: 'citas' },
                    { label: 'Mis vehículos', sub: 'Ver y gestionar', icon: <img src={vehiculoIcon} alt="vehiculo" className="w-5 h-5"/>, view: 'vehiculos' },
                    { label: 'Mis citas', sub: 'Ver historial', icon: <img src={finalizarIcon} alt="citas" className="w-5 h-5"/>, view: 'citas' },
                    { label: 'Mis reseñas', sub: 'Deja tu opinión', icon: <img src={reseñasIcon} alt="reseñas" className="w-5 h-5"/>, view: 'resenas' },
                  ].map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setView(item.view)}
                      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none p-4 text-left hover:shadow-md dark:hover:bg-white/10 transition-shadow"
                    >
                      <div className="h-10 w-10 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-[#94A3B8] flex items-center justify-center rounded-lg">
                        {item.icon}
                      </div>
                      <div className="mt-4 text-sm font-black text-gray-900 dark:text-white">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-[#94A3B8]">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Próxima cita */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none overflow-hidden">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Próxima cita</div>
                  <div className="text-xs text-[#0468BF] cursor-pointer" onClick={() => setView('citas')} role="button" tabIndex={0}>...</div>
                </div>
                <div className="p-5 pt-4">
                  {upcomingCita ? (
                    <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-[#022873] via-[#0468BF] to-[#05AFF2]">
                      <div className="absolute inset-0">
                        <img src={protectionImg} alt="" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#022873]/80 via-[#0468BF]/60 to-transparent" />
                      </div>
                      <div className="relative z-10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white/20 border border-white/30 rounded-lg flex flex-col items-center justify-center">
                            <div className="text-[10px] text-white/80 font-black uppercase">
                              {parseAppointmentStart(upcomingCita)?.toLocaleDateString('es-ES', { month: 'short' })}
                            </div>
                            <div className="text-lg text-white font-black">
                              {parseAppointmentStart(upcomingCita)?.toLocaleDateString('es-ES', { day: '2-digit' })}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-black text-white">
                              {formatDateLong(parseAppointmentStart(upcomingCita))}
                            </div>
                            <div className="text-xs text-white/80">
                              {formatTime(upcomingCita?.hora_inicio)} - {formatTime(upcomingCita?.hora_fin)}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-black border border-white/30 rounded-full">
                                {upcomingCita?.estado || 'Confirmada'}
                              </span>
                              <span className="text-[10px] text-white/70">
                                {upcomingCita?.servicio?.nombre || 'Servicio'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setView('citas')}
                            className="h-10 px-4 bg-[#0468BF] hover:bg-[#035ca8] text-white text-xs font-black transition-colors rounded-lg"
                          >
                            Ver detalles
                          </button>
                          {upcomingCita?.payment?.tokenCode && !upcomingCita?.payment?.tokenUsed && (
                            <button
                              type="button"
                              onClick={() => this.setState({ tokenModalOpen: true, tokenModalCode: upcomingCita.payment.tokenCode })}
                              className="h-10 px-4 bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors border border-white/30 rounded-lg"
                            >
                              Ver código
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-6 text-sm text-gray-500 dark:text-[#94A3B8]">
                      No tienes citas próximas. Agenda una nueva cuando quieras.
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setView('citas')}
                          className="h-10 px-4 bg-[#0468BF] hover:bg-[#035ca8] text-white text-xs font-black transition-colors rounded-lg"
                        >
                          + Agendar cita
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Mis vehículos */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Mis vehículos</div>
                  <button type="button" onClick={() => setView('vehiculos')} className="text-xs text-[#0468BF] hover:text-[#035ca8] transition-colors">Ver todos</button>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehiclesPreview.map((v, idx) => (
                    <button
                      key={v?.id || `${v?.placa || 'veh'}-${idx}`}
                      type="button"
                      onClick={() => setView('vehiculos')}
                      className="group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none text-left hover:shadow-md transition-shadow"
                    >
                      <div className="absolute inset-0">
                        <img
                          src={v?.imagen || carHeroImg}
                          alt=""
                          className={`w-full h-full object-cover transition-opacity duration-500 ${v?.imagen ? 'opacity-70' : 'opacity-40'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                      </div>
                      <div className="relative z-10 p-4 space-y-2">
                        <div className="text-xs text-white/80">{v?.placa || '—'}</div>
                        <div className="text-sm font-black text-white">
                          {(v?.marca || '').trim()} {(v?.modelo || '').trim()} {v?.anio ? String(v.anio) : ''}
                        </div>
                        <div className="inline-flex px-2.5 py-1 bg-[#0468BF]/20 text-[#0468BF] text-[10px] font-black border border-[#0468BF]/30 rounded-full">
                          Principal
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setView('vehiculos')}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-6 text-gray-700 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-12 w-12 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center text-xl rounded-lg">+</div>
                    <div className="text-xs font-black">Agregar vehículo</div>
                  </button>
                </div>
              </section>

              {/* Servicios recomendados */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Servicios recomendados</div>
                  <button type="button" onClick={() => setView('servicios')} className="text-xs text-[#0468BF] hover:text-[#035ca8] transition-colors">Ver todos</button>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedServices.map((s, idx) => (
                    <button
                      key={s?.id || `svc-${idx}`}
                      type="button"
                      onClick={() => this.handleAgendarServicio(s)}
                      className="group overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none text-left hover:shadow-md transition-shadow"
                    >
                      <div className="h-24 w-full overflow-hidden rounded-t-2xl">
                        <img src={getServiceImage(idx)} alt={s?.nombre || 'Servicio'} className="h-full w-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-sm font-black text-gray-900 dark:text-white">{s?.nombre || 'Servicio'}</div>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#94A3B8]">
                          <div>{(s?.duration_minutes ?? s?.duracion) ? `${s.duration_minutes ?? s.duracion} min` : '—'}</div>
                          <div className="text-[#0468BF] font-black">
                            {typeof s?.precio === 'number' ? `$${s.precio}` : s?.precio ? `$${s.precio}` : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">

              {/* Nivel */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black flex items-center gap-2 text-gray-900 dark:text-[#F8FAFC]">
                      <img src={coronaIcon} alt="corona" className="w-5 h-5"/>
                      Cliente {this.state.userProfile?.rank || 'Silver'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#94A3B8]">Nivel {this.state.userProfile?.level || 1}</div>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-black">
                    {this.state.userProfile?.points || 0} / 1000 pts
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0468BF] to-[#05AFF2] rounded-full"
                      style={{ width: `${((this.state.userProfile?.points || 0) / 1000) * 100}%` }}
                    />
                  </div>
                  <div className="mt-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                    Te faltan {Math.max(0, 1000 - (this.state.userProfile?.points || 0))} pts para llegar al siguiente nivel
                  </div>
                </div>
              </section>

              {/* Notificaciones */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Notificaciones</div>
                  <button type="button" onClick={() => setView('citas')} className="text-xs text-[#0468BF] hover:text-[#035ca8] transition-colors">Ver todas</button>
                </div>
                <div className="p-5 pt-4 space-y-3">
                  {this.state.notifications.length > 0 ? (
                    this.state.notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.leida && this.markAsRead(n.id)}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          !n.leida ? 'bg-blue-50 dark:bg-white/10 border-blue-100 dark:border-white/20' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'
                        }`}
                      >
                        <div className={`h-10 w-10 border rounded-lg flex items-center justify-center flex-shrink-0 ${
                          n.tipo === 'service_started'
                            ? 'bg-[#0468BF]/10 border-[#0468BF]/20 text-[#0468BF]'
                            : n.tipo === 'service_completed'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-500 dark:text-[#94A3B8]'
                        }`}>
                          {n.tipo === 'service_started' ? (
                            <img src={lanzaderaIcon} alt="lanzadera" className="w-5 h-5"/>
                          ) : n.tipo === 'service_completed' ? (
                            <img src={finalizarIcon} alt="finalizar" className="w-5 h-5"/>
                          ) : (
                            <img src={notificacionIcon} alt="notificacion" className="w-5 h-5"/>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-black truncate ${!n.leida ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-white/70'}`}>{n.titulo}</div>
                          <div className="text-[11px] text-gray-500 dark:text-[#94A3B8] truncate">{n.mensaje}</div>
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-white/40">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-6 text-center text-xs text-gray-500 dark:text-[#94A3B8] italic">
                      No hay notificaciones aún
                    </div>
                  )}
                </div>
              </section>

              {/* Reseñas recientes */}
              <section className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E293B] shadow-sm dark:shadow-none">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900 dark:text-[#F8FAFC]">Reseñas recientes</div>
                  <button type="button" onClick={() => setView('resenas')} className="text-xs text-[#0468BF] hover:text-[#035ca8] transition-colors">Ver todas</button>
                </div>
                <div className="p-5 pt-4 space-y-4">
                  {latestRatings.length > 0 ? (
                    latestRatings.map((r) => {
                      const ratingValue = Math.round(((r?.specialistRating || 0) + (r?.serviceRating || 0)) / 2) || 0;
                      const who = r?.usuario?.nombre || userName;
                      const createdAt = r?.createdAt ? new Date(r.createdAt) : null;
                      const timeAgo = createdAt && Number.isFinite(createdAt.getTime())
                        ? createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                        : '';
                      return (
                        <div key={r?.id || `${who}-${timeAgo}`} className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-xs font-black text-gray-900 dark:text-white truncate">{who}</div>
                              <div className="mt-1"><StarRating value={ratingValue} readOnly size="sm" /></div>
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-white/40">{timeAgo}</div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                            {r?.comment || 'Excelente servicio, 100% recomendado.'}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-6 text-xs text-gray-500 dark:text-[#94A3B8]">
                      Aún no hay reseñas. Cuando califiques un servicio aparecerán aquí.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {this.state.activeReportCitaId && (
          <ServiceReportModal
            report={citas.find(c => c.id === this.state.activeReportCitaId)}
            rating={ratings.find(r => r.citaId === this.state.activeReportCitaId)}
            onClose={this.handleCloseReport}
            onSubmitRating={this.submitRating}
          />
        )}

        <TokenCodeModal
          isOpen={this.state.tokenModalOpen}
          tokenCode={this.state.tokenModalCode}
          onClose={() => this.setState({ tokenModalOpen: false, tokenModalCode: '' })}
        />
      </div>
    );
  }
}

export default UserDashboard;