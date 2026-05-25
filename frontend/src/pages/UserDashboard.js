import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import premiumImg from "../assets/services/premium.jpg";
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const REPORTS_PER_PAGE = 6;

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

const ServiceIcon = ({ name }) => {
  const n = (name || '').toLowerCase();
  const wrapperClassName =
    'w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#7b9cff]';

  if (n.includes('lavado')) {
    return (
      <div className={wrapperClassName} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.25c.31 0 .61.16.75.43 2.25 4.34 6 7.2 6 11.07a6.75 6.75 0 11-13.5 0c0-3.87 3.75-6.73 6-11.07.14-.27.44-.43.75-.43z" />
        </svg>
      </div>
    );
  }

  if (n.includes('mantenimiento') || n.includes('preventivo') || n.includes('aceite') || n.includes('cambio')) {
    return (
      <div className={wrapperClassName} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 0114.79-8.36.75.75 0 01.16 1.17l-2.1 2.1a.75.75 0 00-.18.76l.8 2.4a.75.75 0 01-.48.95l-2.4.8a.75.75 0 00-.48.48l-.8 2.4a.75.75 0 01-.95.48l-2.4-.8a.75.75 0 00-.76.18l-2.1 2.1a.75.75 0 01-1.17-.16A9.708 9.708 0 012.25 12zm10.06 2.31a.75.75 0 01.53.22l6.44 6.44a1.5 1.5 0 102.12-2.12l-6.44-6.44a.75.75 0 10-1.06 1.06z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  if (n.includes('detailing') || n.includes('pulido') || n.includes('encerado')) {
    return (
      <div className={wrapperClassName} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.25c.31 0 .6.2.7.5l.86 2.63c.1.3.33.53.63.63l2.63.86c.3.1.5.39.5.7s-.2.6-.5.7l-2.63.86c-.3.1-.53.33-.63.63l-.86 2.63c-.1.3-.39.5-.7.5s-.6-.2-.7-.5l-.86-2.63a.87.87 0 00-.63-.63l-2.63-.86a.75.75 0 010-1.4l2.63-.86c.3-.1.53-.33.63-.63l.86-2.63c.1-.3.39-.5.7-.5z" />
          <path d="M5.25 13.5c.31 0 .6.2.7.5l.46 1.4c.1.3.33.53.63.63l1.4.46c.3.1.5.39.5.7s-.2.6-.5.7l-1.4.46c-.3.1-.53.33-.63.63l-.46 1.4c-.1.3-.39.5-.7.5s-.6-.2-.7-.5l-.46-1.4a.87.87 0 00-.63-.63l-1.4-.46a.75.75 0 010-1.4l1.4-.46c.3-.1.53-.33.63-.63l.46-1.4c.1-.3.39-.5.7-.5z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={wrapperClassName} aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M6.75 3A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0019.5 18.75V9.621a2.25 2.25 0 00-.659-1.591l-3.371-3.37A2.25 2.25 0 0013.879 4.5H6.75zm6.75 1.5v3.75A1.5 1.5 0 0015 9.75h3.75V18.75a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75H13.5z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

const getVisiblePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const visible = Math.min(maxVisible, safeTotalPages);
  const half = Math.floor(visible / 2);

  let start = safeCurrentPage - half;
  let end = start + visible - 1;

  if (start < 1) {
    start = 1;
    end = visible;
  }

  if (end > safeTotalPages) {
    end = safeTotalPages;
    start = Math.max(1, end - visible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const ServiceReportsPanel = ({ items, onOpenReport }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const sectionTopRef = useRef(null);
  const hasMountedRef = useRef(false);

  const totalResults = items.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / REPORTS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    sectionTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentPage]);

  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
  const endIndexExclusive = Math.min(startIndex + REPORTS_PER_PAGE, totalResults);
  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndexExclusive),
    [items, startIndex, endIndexExclusive]
  );

  const visiblePages = useMemo(
    () => getVisiblePageNumbers(currentPage, totalPages, 5),
    [currentPage, totalPages]
  );

  const showingFrom = totalResults === 0 ? 0 : startIndex + 1;
  const showingTo = totalResults === 0 ? 0 : endIndexExclusive;

  const goToPage = (page) => {
    const next = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(next);
  };

  return (
    <div ref={sectionTopRef} className="space-y-6">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-hidden">
        <div className="divide-y divide-white/5">
          {visibleItems.map((cita) => {
            const condition = getConditionStyle(cita.report?.condition);
            const { date, time } = formatCompletedDateTime(cita.completedAt || cita.fecha);
            return (
              <button
                key={cita.id}
                type="button"
                onClick={() => onOpenReport?.(cita.id)}
                className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ServiceIcon name={cita.servicio?.nombre} />

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-[#F8FAFC] truncate">
                    {cita.servicio?.nombre || 'Servicio'}
                  </div>
                  <div className="text-xs text-[#94A3B8] truncate">
                    {cita.vehiculo?.placa || '—'}
                  </div>
                </div>

                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${condition.className}`}
                  >
                    {condition.label}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">{date}</div>
                    <div className="text-xs text-[#94A3B8]">{time}</div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-white/40"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M8.22 19.28a.75.75 0 010-1.06L14.44 12 8.22 5.78a.75.75 0 111.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 01-1.06 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
          Showing {showingFrom}–{showingTo} of {totalResults} results
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M15.78 4.72a.75.75 0 010 1.06L9.56 12l6.22 6.22a.75.75 0 11-1.06 1.06l-6.75-6.75a.75.75 0 010-1.06l6.75-6.75a.75.75 0 011.06 0z" clipRule="evenodd" />
            </svg>
          </button>

          {visiblePages.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`h-10 min-w-10 px-3 inline-flex items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M8.22 19.28a.75.75 0 010-1.06L14.44 12 8.22 5.78a.75.75 0 111.06-1.06l6.75 6.75a.75.75 0 010 1.06l-6.75 6.75a.75.75 0 01-1.06 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
      onMouseDown={() => onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl bg-[#0b1220] border border-white/10 shadow-2xl transform transition-all duration-200 ${
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
                  className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${condition.className}`}
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
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
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
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                Trabajo Realizado
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">
                {report.report?.workPerformed || '—'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                Piezas Utilizadas
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">
                {report.report?.partsUsed || '—'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                Observaciones
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">
                {report.report?.observations || '—'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                Fecha y Hora
              </div>
              <div className="text-sm text-[#F8FAFC] leading-relaxed">
                {date} • {time}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="p-5 space-y-4">
          <div className="text-sm font-black text-[#F8FAFC] uppercase tracking-wider">
            Calificación
          </div>

          {isAlreadyRated ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                  Especialista
                </div>
                <StarRating value={rating?.specialistRating || 0} readOnly size="md" />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                  Calidad del Servicio
                </div>
                <StarRating value={rating?.serviceRating || 0} readOnly size="md" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                  Especialista
                </div>
                <StarRating value={specialistRating} onChange={setSpecialistRating} size="md" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#6b7080]">
                  Calidad del Servicio
                </div>
                <StarRating value={serviceRating} onChange={setServiceRating} size="md" />
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
    };
    this.pollingInterval = null;
  }

  componentDidMount() {
    this.fetchInitialFormData();
    this.fetchCitas();
    this.fetchUserProfile();
    this.fetchNotifications();
    // Poll every 12 seconds
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        this.setState(prev => ({
          notifications: prev.notifications.map(n => n.id === id ? { ...n, leida: true } : n)
        }));
        // Notify the bell to refresh
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
         const lastSeenLevel =
           parseInt(localStorage.getItem(lastSeenLevelKey), 10) || 1;
 
         // Check for level up (either during session or since last login)
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
           // First time setting the level
           localStorage.setItem(lastSeenLevelKey, userData.level);
         }
 
         this.setState({ userProfile: userData });
       }
     } catch (err) {
       console.error('Error fetching user profile:', err);
     }
   };

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  checkAndUpdateOnboarding = (vehiculos, citas) => {
    const userId = localStorage.getItem('userId');
    const hasVehicles = vehiculos && vehiculos.length > 0;
    const hasCompletedCitas = citas && citas.some(c => c.estado === 'FINALIZADO');
    
    if (hasVehicles && hasCompletedCitas) {
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
      if (!this.state.onboardingSeen) {
        this.setState({ onboardingSeen: true });
      }
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
        this.setState({ servicios: serviciosData, misVehiculos: vehiculosData, loading: false });
        // Check onboarding after we have data
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
        this.checkForStatusChanges(data);
        this.setState(prev => ({ 
          citas: data, 
          previousCitas: prev.citas 
        }));
        // Check onboarding after we have citas
        this.checkAndUpdateOnboarding(this.state.misVehiculos, data);
        // Fetch ratings for citas
        this.fetchRatingsForCitas(data, headers);
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
        this.setState(prev => ({ 
          ratings: [...prev.ratings, newRating],
          citas: prev.citas.map(c => 
            c.id === citaId ? { ...c, rated: true } : c
          )
        }));
        if (this.props.showToast) {
          this.props.showToast('Thank you for your feedback!', 'success');
        }
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
        // Status changed!
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
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/\s+/g, '-') // Espacios por guiones
      .replace(/[^\w-]/g, ''); // Quitar caracteres especiales
    
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

  handleOpenReport = (reportId) => {
    this.setState({ activeReportCitaId: reportId });
  };

  handleCloseReport = () => {
    this.setState({ activeReportCitaId: null });
  };

  render() {
    const { servicios, loading, citas, misVehiculos, ratings } = this.state;
    const { setView } = this.props;
    const showReports = process.env.REACT_APP_ENABLE_REPORTS === 'true';
    
    const userNameRaw = (localStorage.getItem('userName') || '').trim();
    const userName = userNameRaw || 'Usuario';
    const firstName = userName.split(' ')[0] || userName;

    const normalizeEstado = (estado) =>
      (estado || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_');

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
        return date.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
        });
      } catch {
        return date.toLocaleDateString();
      }
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return '—';
      const d = new Date(`1970-01-01T${timeStr}`);
      if (!Number.isFinite(d.getTime())) return timeStr;
      try {
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return timeStr;
      }
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

    const upcomingCita = (Array.isArray(citas) ? citas : [])
      .filter(isActiveAppointment)
      .map((cita) => ({ cita, start: parseAppointmentStart(cita) }))
      .filter((x) => x.start)
      .sort((a, b) => a.start - b.start)[0]?.cita;

    const recommendedServices = (Array.isArray(servicios) ? servicios : []).slice(0, 4);
    const vehiclesPreview = (Array.isArray(misVehiculos) ? misVehiculos : []).slice(0, 2);
    const latestRatings = (Array.isArray(ratings) ? ratings : [])
      .slice()
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 2);

    const serviceImageForIndex = [expressImg, premiumImg, interiorImg, motorImg, protectionImg];
    const getServiceImage = (idx) => serviceImageForIndex[idx % serviceImageForIndex.length];

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
      <div className="animate-in fade-in duration-700 pb-24 bg-white dark:bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1220]">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#0b1220] to-[#0b1220]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.22),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.16),transparent_55%)]" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-10">
              <div className="space-y-4">
                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                  ¡ Bienvenido, {firstName} !
                </div>
                <div className="text-slate-600 dark:text-[#94A3B8] text-sm md:text-base">
                  Bienvenido de vuelta. Al mejor sistema de automatizacion de citas.
                </div>
              </div>

              <div className="relative h-40 md:h-56 lg:h-full min-h-[180px]">
                <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <div className="absolute inset-0 bg-gradient-to-l from-[#2563EB]/25 via-transparent to-transparent" />
                  <div className="absolute top-0 right-10 h-full w-[2px] bg-gradient-to-b from-transparent via-[#38BDF8]/60 to-transparent opacity-80" />
                  <div className="absolute top-0 right-20 h-full w-[2px] bg-gradient-to-b from-transparent via-[#2563EB]/50 to-transparent opacity-70" />
                  <img
                    src={carHeroImg}
                    alt="Vehículo"
                    className="absolute right-0 bottom-0 h-full w-auto object-contain opacity-95 drop-shadow-[0_20px_40px_rgba(37,99,235,0.25)]"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="space-y-3">
                <div className="text-sm font-black text-slate-900 dark:text-white">Accesos rápidos</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    type="button"
                    onClick={() => setView('citas')}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-white/10 text-[#94A3B8] flex items-center justify-center border border-white/10">          
                      <img src={agendarIcon} alt="agendar" className="w-5 h-5" bg="white"/>
                    </div>
                    <div className="mt-4 text-sm font-black text-slate-900 dark:text-white">Agendar cita</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">Nueva cita</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('vehiculos')}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-white/10 text-[#94A3B8] flex items-center justify-center border border-white/10">
                      <img src={vehiculoIcon} alt="vehiculo" className="w-5 h-5" bg="white"/>
                    </div>
                    <div className="mt-4 text-sm font-black text-slate-900 dark:text-white">Mis vehículos</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">Ver y gestionar</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('citas')}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-white/10 text-[#94A3B8] flex items-center justify-center border border-white/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.5 2.25A.75.75 0 018.25 3v1.5h7.5V3a.75.75 0 011.5 0v1.5h.75A2.25 2.25 0 0121 6.75v12A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-12A2.25 2.25 0 015.25 4.5H6V3a.75.75 0 011.5 0v1.5zM4.5 9.75h15V6.75a.75.75 0 00-.75-.75H5.25a.75.75 0 00-.75.75v3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mt-4 text-sm font-black text-slate-900 dark:text-white">Mis citas</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">Ver historial</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('resenas')}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 text-left hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-white/10 text-[#94A3B8] flex items-center justify-center border border-white/10">
                      <img src={reseñasIcon} alt="reseñas" className="w-5 h-5" bg="white"/>
                    </div>
                    <div className="mt-4 text-sm font-black text-slate-900 dark:text-white">Mis reseñas</div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">Deja tu opinión</div>
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 text-white">Próxima cita</div>
                  <div className="text-xs text-[#60A5FA] cursor-pointer" onClick={() => setView('citas')} role="button" tabIndex={0}>
                    ...
                  </div>
                </div>

                <div className="p-5 pt-4">
                  {upcomingCita ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]">
                      <div className="absolute inset-0">
                        <img src={premiumImg} alt="" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/90 to-transparent" />
                      </div>
                      <div className="relative z-10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                            <div className="text-[10px] text-[#94A3B8] font-black uppercase">
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
                            <div className="text-xs text-[#94A3B8]">
                              {formatTime(upcomingCita?.hora_inicio)} - {formatTime(upcomingCita?.hora_fin)}
                            </div>
                            <div className="mt-2 inline-flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-[#2563EB]/15 text-[#60A5FA] text-[10px] font-black border border-[#2563EB]/20">
                                {upcomingCita?.estado || 'Confirmada'}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {upcomingCita?.servicio?.nombre || 'Servicio'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setView('citas')}
                          className="h-10 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black transition-colors"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6 text-sm text-slate-600 dark:text-[#94A3B8]">
                      No tienes citas próximas. Agenda una nueva cuando quieras.
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setView('citas')}
                          className="h-10 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black transition-colors"
                        >
                          + Agendar cita
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 dark:text-white">Mis vehículos</div>
                  <button
                    type="button"
                    onClick={() => setView('vehiculos')}
                    className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehiclesPreview.map((v, idx) => (
                    <button
                      key={v?.id || `${v?.placa || 'veh'}-${idx}`}
                      type="button"
                      onClick={() => setView('vehiculos')}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] text-left"
                    >
                      <div className="absolute inset-0">
                        <img 
                          src={v?.imagen || carHeroImg} 
                          alt="" 
                          className={`w-full h-full object-cover transition-opacity duration-500 ${v?.imagen ? 'opacity-40' : 'opacity-10'}`} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/80 to-transparent" />
                      </div>
                      <div className="relative z-10 p-4 space-y-2">
                        <div className="text-xs text-white/60">{v?.placa || '—'}</div>
                        <div className="text-sm font-black text-white">
                          {(v?.marca || '').trim()} {(v?.modelo || '').trim()} {v?.anio ? String(v.anio) : ''}
                        </div>
                        <div className="inline-flex px-2.5 py-1 rounded-full bg-[#2563EB]/15 text-[#60A5FA] text-[10px] font-black border border-[#2563EB]/20">
                          Principal
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setView('vehiculos')}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6 text-slate-700 dark:text-white/80 hover:bg-white dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl">
                      +
                    </div>
                    <div className="text-xs font-black">Agregar vehículo</div>
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 dark:text-white">Servicios recomendados</div>
                  <button
                    type="button"
                    onClick={() => setView('servicios')}
                    className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommendedServices.map((s, idx) => (
                    <button
                      key={s?.id || `svc-${idx}`}
                      type="button"
                      onClick={() => this.handleAgendarServicio(s)}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="h-24 w-full overflow-hidden">
                        <img src={getServiceImage(idx)} alt={s?.nombre || 'Servicio'} className="h-full w-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform" />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-sm font-black text-white">{s?.nombre || 'Servicio'}</div>
                        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                          <div>{(s?.duration_minutes ?? s?.duracion) ? `${s.duration_minutes ?? s.duracion} min` : '—'}</div>
                          <div className="text-[#60A5FA] font-black">
                            {typeof s?.precio === 'number' ? `$${s.precio}` : s?.precio ? `$${s.precio}` : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                     <img src={coronaIcon} alt="corona" className="w-5 h-5" bg="white"/>
                      Cliente {this.state.userProfile?.rank || 'Silver'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8]">Nivel {this.state.userProfile?.level || 1}</div>
                  </div>
                  <div className="text-[10px] text-white/60 font-black">
                    {this.state.userProfile?.points || 0} / 1000 pts
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8]"
                      style={{
                        width: `${
                          ((this.state.userProfile?.points || 0) / 1000) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-[#94A3B8]">
                    Te faltan {Math.max(0, 1000 - (this.state.userProfile?.points || 0))} pts para llegar al siguiente nivel
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 dark:text-white">Notificaciones</div>
                  <button
                    type="button"
                    onClick={() => setView('citas')}
                    className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="p-5 pt-4 space-y-3">
                  {this.state.notifications.length > 0 ? (
                    this.state.notifications.slice(0, 3).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.leida && this.markAsRead(n.id)}
                        className={`flex items-start gap-3 rounded-xl border border-white/10 p-3 cursor-pointer transition-colors ${
                          !n.leida ? 'bg-white/10 border-white/20' : 'bg-white/5'
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-2xl border flex items-center justify-center flex-shrink-0 ${
                            n.tipo === 'service_started'
                              ? 'bg-[#2563EB]/15 border-[#2563EB]/20 text-[#60A5FA]'
                              : n.tipo === 'service_completed'
                                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-500'
                                : 'bg-white/10 border-white/10 text-white/70'
                          }`}
                        >
                          {n.tipo === 'service_started' ? (
                            <img src={lanzaderaIcon} alt="lanzadera" className="w-5 h-5" bg="white"/>
                          ) : n.tipo === 'service_completed' ? (
                            <img src={finalizarIcon} alt="finalizar" className="w-5 h-5" bg="white"/>
                          ) : (
                            <img src={notificacionIcon} alt="notificacion" className="w-5 h-5" bg="white"/>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-black truncate ${!n.leida ? 'text-white' : 'text-white/70'}`}>
                            {n.titulo}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] truncate">{n.mensaje}</div>
                        </div>
                        <div className="text-[10px] text-white/50">{formatRelativeTime(n.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-[#94A3B8] italic">
                      No hay notificaciones aún
                    </div>
                  )}
                </div>
              </section>

              <section className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="absolute inset-0">
                  <img src={premiumImg} alt="" className="w-full h-full object-cover opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220] via-[#0b1220]/90 to-transparent" />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                <div className="px-5 pt-5 flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900 dark:text-white">Reseñas recientes</div>
                  <button
                    type="button"
                    onClick={() => setView('resenas')}
                    className="text-xs text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="p-5 pt-4 space-y-4">
                  {latestRatings.length > 0 ? (
                    latestRatings.map((r) => {
                      const ratingValue = Math.round(((r?.specialistRating || 0) + (r?.serviceRating || 0)) / 2) || 0;
                      const who = r?.usuario?.nombre || userName;
                      const createdAt = r?.createdAt ? new Date(r.createdAt) : null;
                      const timeAgo =
                        createdAt && Number.isFinite(createdAt.getTime())
                          ? createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                          : '';
                      return (
                        <div key={r?.id || `${who}-${timeAgo}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-xs font-black text-white truncate">{who}</div>
                              <div className="mt-1">
                                <StarRating value={ratingValue} readOnly size="sm" />
                              </div>
                            </div>
                            <div className="text-[10px] text-white/50">{timeAgo}</div>
                          </div>
                          <div className="mt-3 text-xs text-[#94A3B8]">
                            {r?.comment || 'Excelente servicio, 100% recomendado.'}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 p-6 text-xs text-slate-600 dark:text-[#94A3B8]">
                      Aún no hay reseñas. Cuando califiques un servicio aparecerán aquí.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        {showReports && (
          <div className="hidden">
            <ServiceReportsPanel items={[]} onOpenReport={() => {}} />
            <ServiceReportModal report={null} rating={null} onClose={() => {}} onSubmitRating={() => {}} />
          </div>
        )}
      </div>
    );
  }
}

export default UserDashboard;
