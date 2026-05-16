import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import premiumImg from "../assets/services/premium.jpg";
import StarRating from '../components/StarRating';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
    };
    this.pollingInterval = null;
  }

  componentDidMount() {
    this.fetchInitialFormData();
    this.fetchCitas();
    // Poll every 12 seconds
    this.pollingInterval = setInterval(this.fetchCitas, 12000);
  }

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
    const { servicios, loading, citas, onboardingSeen, activeReportCitaId, ratings } = this.state;
    const { setView } = this.props;
    
    // Get latest completed citas with reports
    const completedCitasWithReports = citas
      .filter(c => c.estado === 'FINALIZADO' && c.report && c.report.workPerformed)
      .sort((a, b) => new Date(b.completedAt || b.fecha) - new Date(a.completedAt || a.fecha));

    const activeReport = activeReportCitaId ? citas.find(c => c.id === activeReportCitaId) : null;
    const activeRating = activeReport ? ratings.find(r => r?.cita?.id === activeReport.id) : null;

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
      <div className="space-y-24 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        {/* ENCABEZADO DE BIENVENIDA PREMIUM */}
        <header className="relative min-h-[34vh] md:min-h-[40vh] flex items-center justify-center overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=1920" 
              className="w-full h-full object-cover opacity-30"
              alt="Welcome background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-[#020617]/80 to-[#020617]" />
          </div>

          <div className="relative z-10 text-center space-y-6 px-6">
            <div className="inline-block px-4 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-bottom duration-700">
              Panel de Control Premium
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-[#F8FAFC] sans tracking-tighter italic uppercase leading-none">
              Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-blue-400">MotoExpert</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Gestiona tu flota personal y agenda servicios de detailing con el estándar más alto de la industria.
            </p>
          </div>
        </header>

        {/* SERVICIOS PREMIUM CAROUSEL */}
        <section className="py-20 relative overflow-hidden">
          <div className="relative px-6">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{ clickable: true, dynamicBullets: true }}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-20"
            >
              {servicios.map((s, idx) => {
                const mockImages = [
                  premiumImg,
                ];
                const bgImage = mockImages[idx % mockImages.length];

                return (
                  <SwiperSlide key={s.id}>
                    <div
                      className="group relative h-[360px] w-full overflow-hidden rounded-[3rem] bg-slate-100 dark:bg-[#111827] shadow-2xl transition-all duration-700 border border-slate-200 dark:border-white/5 hover:border-[#2563EB]/40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    >
                      <div className="absolute inset-0 z-10 bg-[#020617]/30" />
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020617]/85 via-[#020617]/30 to-transparent" />
                      <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                        <div className="space-y-6 transform transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                          <h4 className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">{s.nombre}</h4>
                          <p className="text-slate-500 dark:text-[#94A3B8] text-sm line-clamp-2 leading-relaxed font-medium">{s.descripcion}</p>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={() => this.handleAgendarServicio(s)}
                              className="flex-1 py-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#2563EB]/20 active:scale-95"
                            >
                              Agendar Ahora
                            </button>
                            <button 
                              onClick={() => this.handleSaberMas(s)}
                              className="flex-1 py-5 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 backdrop-blur-xl transition-all active:scale-95"
                            >
                              Saber Más
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div className="swiper-button-prev-custom absolute left-10 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-2xl bg-white dark:bg-[#020617]/50 p-5 text-white backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:bg-[#2563EB] transition-all hidden lg:flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </div>
            <div className="swiper-button-next-custom absolute right-10 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-2xl bg-white dark:bg-[#020617]/50 p-5 text-white backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:bg-[#2563EB] transition-all hidden lg:flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          </div>
        </section>

        {/* LAYOUT DE INSTRUCCIONES PREMIUM OR LATEST SERVICE REPORTS */}
        <div className="container mx-auto px-6">
          {!onboardingSeen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LADO IZQUIERDO: VEHÍCULOS */}
              <div className="bg-slate-100 dark:bg-[#111827] p-10 rounded-[2.5rem] transition-all flex flex-col h-full group border border-slate-200 dark:border-white/5 hover:border-purple-500/20 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-xl shadow-inner">1</div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">Mi Flota Personal</h2>
                </div>
                <ul className="space-y-4 mb-10 flex-grow text-slate-500 dark:text-[#94A3B8] font-medium">
                  {[
                    "Añade un nuevo vehículo a tu perfil.",
                    "Especifica placa, marca y modelo.",
                    "Sincroniza el historial de servicios.",
                    "Administra múltiples vehículos."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start space-x-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600/10 text-purple-500 rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => this.props.setView('vehiculos')}
                  className="w-full py-5 bg-slate-200 dark:bg-[#1e293b] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl transition-all active:scale-95"
                >
                  Mis Vehículos
                </button>
              </div>
              {/* LADO DERECHO: CITAS */}
              <div className="bg-slate-100 dark:bg-[#111827] p-10 rounded-[2.5rem] transition-all flex flex-col h-full group border border-slate-200 dark:border-white/5 hover:border-[#2563EB]/20 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-xl shadow-inner">2</div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">Gestión de Citas</h2>
                </div>
                <ul className="space-y-4 mb-10 flex-grow text-slate-500 dark:text-[#94A3B8] font-medium">
                  {[
                    "Selecciona tu vehículo registrado.",
                    "Elige el servicio premium deseado.",
                    "Define fecha y hora en tiempo real.",
                    "Confirma y recibe tu código VIP."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start space-x-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#2563EB]/10 text-[#2563EB] rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => this.props.setView('citas')}
                  className="w-full py-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-95"
                >
                  Agendar Cita
                </button>
              </div>
            </div>
          ) : (
            /* LATEST SERVICE REPORTS SECTION */
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">
                  Latest Service Reports
                </h2>
              </div>

              {completedCitasWithReports.length > 0 ? (
                <ServiceReportsPanel
                  items={completedCitasWithReports}
                  onOpenReport={this.handleOpenReport}
                />
              ) : (
                <div className="bg-slate-100 dark:bg-[#111827] p-12 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5 text-center">
                  <div className="text-4xl mb-4 opacity-30">📋</div>
                  <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">
                    No service reports yet. Your completed services will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <ServiceReportModal
          report={activeReport}
          rating={activeRating}
          onClose={this.handleCloseReport}
          onSubmitRating={this.submitRating}
        />
      </div>
    );
  }
}

export default UserDashboard;
