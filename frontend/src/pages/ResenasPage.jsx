import React, { useState, useEffect } from 'react';
import CustomSelect from '../components/CustomSelect';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';

import { API_BASE_URL } from '../apiConfig';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getColorForUser = (name) => {
  if (!name) return '#7b9cff';
  const colors = [
    '#7b9cff', '#1D9E75', '#EF9F27', '#7C3AED', '#E24B4A',
    '#378ADD', '#10B981', '#F59E0B', '#8B5CF6', '#DC2626'
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ResenasPage = () => {
  // Estados para datos del API
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ratingsHistory, setRatingsHistory] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  
  // Estados para el formulario
  const [activeFilter, setActiveFilter] = useState('all');
  const [helpfulMap, setHelpfulMap] = useState({});
  const [formRating, setFormRating] = useState(0);
  const [formServiceRating, setFormServiceRating] = useState(0);
  const [formText, setFormText] = useState('');
  const [formCitaId, setFormCitaId] = useState('');
  const [showFormSuccess, setShowFormSuccess] = useState(false);
  
  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingPending, setLoadingPending] = useState(false);
  const [error, setError] = useState(null);
  const [employeesError, setEmployeesError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Obtener usuario actual
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // Fetch de reseñas
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/ratings`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
          // Inicializar helpfulMap
          const helpMap = {};
          data.forEach(review => {
            helpMap[review.id] = false;
          });
          setHelpfulMap(helpMap);
        } else {
          throw new Error('Error al cargar las reseñas');
        }
      } catch (err) {
        setError(err.message || 'Error al conectar con el servidor');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Fetch de citas pendientes de calificar
  useEffect(() => {
    if (!userId || !token) return;

    const fetchPending = async () => {
      try {
        setLoadingPending(true);
        const response = await fetch(`${API_BASE_URL}/citas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const resData = await response.json();
          const data = resData.data || resData;
          // Filtrar citas FINALIZADAS y no calificadas
          const pending = data.filter(c => c.estado === 'FINALIZADO' && !c.rated);
          setPendingAppointments(pending);
        }
      } catch (err) {
        console.error('Error fetching pending appointments:', err);
      } finally {
        setLoadingPending(false);
      }
    };

    fetchPending();
  }, [userId, token]);

  // Fetch de empleados
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const response = await fetch(`${API_BASE_URL}/empleados`);
        if (response.ok) {
          const data = await response.json();
          const activeEmployees = data.filter(emp => emp.estado === 'activo');
          setEmployees(activeEmployees);
        } else {
          throw new Error('Error al cargar empleados');
        }
      } catch (err) {
        setEmployeesError(err.message || 'Error al conectar con el servidor');
        console.error('Error fetching employees:', err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Generar historial de ratings dinámicamente
  useEffect(() => {
    if (reviews.length > 0) {
      const history = generateRatingsHistory(reviews);
      setRatingsHistory(history);
    }
  }, [reviews]);

  // Función para generar historial de ratings basado en las reseñas
  const generateRatingsHistory = (reviewsData) => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const historyMap = {};

    // Inicializar meses
    months.forEach(month => {
      historyMap[month] = { reviews: [], score: 0 };
    });

    // Agrupar reseñas por mes
    reviewsData.forEach(review => {
      const date = new Date(review.createdAt);
      const monthIndex = date.getMonth();
      const month = months[monthIndex] || months[0];
      
      if (historyMap[month]) {
        historyMap[month].reviews.push(review.specialistRating);
      }
    });

    // Calcular promedio por mes
    return months.map(month => {
      const data = historyMap[month];
      const avgScore = data.reviews.length > 0
        ? data.reviews.reduce((a, b) => a + b, 0) / data.reviews.length
        : 0;

      return {
        month,
        score: parseFloat(avgScore.toFixed(1)),
        reviews: data.reviews.length
      };
    });
  };

  // Calcular estadísticas de especialistas
  const specialistStats = employees.map(emp => {
    const specialistId = emp.id;
    const specialistReviews = reviews.filter(r => r.empleado?.id === specialistId);
    const totalReviews = specialistReviews.length;
    const avgRating = totalReviews > 0
      ? specialistReviews.reduce((sum, r) => sum + r.specialistRating, 0) / totalReviews
      : 0;
    const completedServices = emp.citas?.filter(c => c.estado === 'FINALIZADO').length || 0;
    const fullName = `${emp.usuario?.nombre || ''} ${emp.usuario?.apellidos || ''}`.trim();

    return {
      id: String(specialistId),
      name: fullName || 'Empleado',
      role: emp.cargo || 'Técnico Especialista',
      avatar: fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'E',
      completedServices,
      avgRating: isNaN(avgRating) ? 0 : avgRating,
      totalReviews
    };
  }).sort((a, b) => b.avgRating - a.avgRating).slice(0, 3);

  // Cálculos de estadísticas generales
  const totalReviews = reviews.length;
  const averageScore = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.specialistRating, 0) / totalReviews
    : 0;

  const trend = calculateTrend();
  const recommendationPercent = calculateRecommendationPercent();

  function calculateTrend() {
    if (ratingsHistory.length < 2) return 0;
    const lastMonth = ratingsHistory[ratingsHistory.length - 1];
    const previousMonth = ratingsHistory[ratingsHistory.length - 2];
    return parseFloat((lastMonth.score - previousMonth.score).toFixed(1));
  }

  function calculateRecommendationPercent() {
    if (totalReviews === 0) return 0;
    const recommendedCount = reviews.filter(r => r.specialistRating >= 4).length;
    return Math.round((recommendedCount / totalReviews) * 100);
  }

  const starDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.specialistRating === star).length
  }));

  const filteredReviews = reviews.filter(review => {
    const rating = review.specialistRating;
    if (activeFilter === 'all') return true;
    if (activeFilter === '5') return rating === 5;
    if (activeFilter === '4') return rating === 4;
    if (activeFilter === '3-less') return rating <= 3;
    if (activeFilter === 'verified') return true; // Todas las reseñas son de servicios verificados en este sistema
    return true;
  });

  const handleHelpful = async (id) => {
    // Lógica local simplificada ya que no hay endpoint de helpful en el backend real
    setHelpfulMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formRating || !formServiceRating || !formText.trim() || !formCitaId || !token) return;

    setSubmitting(true);

    try {
      const payload = {
        citaId: parseInt(formCitaId),
        specialistRating: formRating,
        serviceRating: formServiceRating,
        comment: formText
      };

      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const createdReview = await response.json();
        // Recargar reseñas para ver la nueva
        const refreshRes = await fetch(`${API_BASE_URL}/ratings`);
        if (refreshRes.ok) {
          const newData = await refreshRes.json();
          setReviews(newData);
        }
        
        // Actualizar citas pendientes
        setPendingAppointments(prev => prev.filter(c => c.id !== parseInt(formCitaId)));
        
        // Limpiar formulario
        setFormRating(0);
        setFormServiceRating(0);
        setFormText('');
        setFormCitaId('');
        setShowFormSuccess(true);
        setTimeout(() => setShowFormSuccess(false), 3000);
      } else {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al publicar la reseña');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Error al publicar la reseña: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, onChange, size = 'md' }) => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const isInteractive = !!onChange;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type={isInteractive ? 'button' : undefined}
            onClick={() => isInteractive && onChange(star)}
            disabled={!isInteractive}
            className={`${starSize} ${star <= rating ? 'text-[#EF9F27]' : 'text-[#3a3d4a]'} ${isInteractive ? 'hover:scale-110 transition-transform' : ''}`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#7b9cff]/20 border-t-[#7b9cff] animate-spin mx-auto"></div>
          <p className="text-slate-500 dark:text-[#94A3B8]">Cargando reseñas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="bg-[#0d1117] border border-white/10 rounded-[18px] px-6 py-7">
          <div className="flex flex-col items-center text-center gap-3">
            <span className="inline-flex items-center px-4 py-1 rounded-full border border-[#8b7cf6]/50 text-[#8b7cf6] text-[10px] font-black uppercase tracking-[0.3em]">
              Reseñas de Clientes
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">
              <span className="text-white">OPINIONES DE </span>
              <span className="text-[#3ecf8e] italic">CLIENTES</span>
            </h1>
            <p className="text-sm md:text-base text-white/70 italic">
              La experiencia de nuestros usuarios habla por nosotros
            </p>
          </div>
        </header>

        {error && (
          <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-3xl text-red-400">
            {error}
          </div>
        )}

        {/* Summary Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-8">
          {/* Large Score */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="text-6xl font-black text-[#7b9cff]">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-slate-500 dark:text-[#94A3B8]">/ 5</div>
            <StarRating rating={Math.round(averageScore)} size="md" />
            <div className="text-slate-500 dark:text-[#94A3B8] text-sm mt-2">
              {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
            </div>
          </div>

          {/* Distribution */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
              Distribución de Estrellas
            </div>
            {starDistribution.map(({ star, count }) => {
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-8 text-right text-sm text-slate-600 dark:text-[#94A3B8]">
                    {star}★
                  </div>
                  <div className="flex-1 h-2 bg-[#111827] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7b9cff] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm text-slate-600 dark:text-[#94A3B8]">
                    {count} ({percentage.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend & Recommendation */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
              Resumen
            </div>
            <div className="flex items-center gap-3">
              <svg
                className={`w-5 h-5 ${trend > 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={trend > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}
                />
              </svg>
              <span className={`font-bold ${trend > 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                {trend > 0 ? '+' : ''}{trend} vs mes anterior
              </span>
            </div>
            <div className="pt-4 border-t border-white/[0.05]">
              <div className="text-3xl font-black text-[#1D9E75]">
                {recommendationPercent}%
              </div>
              <div className="text-sm text-slate-500 dark:text-[#94A3B8]">
                de clientes recomiendan
              </div>
            </div>
          </div>
        </div>

        {/* Top Especialistas */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter">
            Top Especialistas
          </h2>

          {loadingEmployees ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-900/50 border border-white/[0.05] rounded-3xl p-6 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                  </div>
                  <div className="flex flex-col items-center pt-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800"></div>
                    <div className="w-32 h-5 bg-slate-800 rounded"></div>
                    <div className="w-24 h-3 bg-slate-800 rounded"></div>
                    <div className="w-20 h-3 bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : employeesError ? (
            <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-3xl text-red-400 text-center">
              {employeesError}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specialistStats.map((sp, index) => {
                const rank = index + 1;
                const rankColor = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#B45309';
                const isTop1 = rank === 1;

                return (
                  <div
                    key={sp.id}
                    className={`relative bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6 transition-all ${
                      isTop1
                        ? 'scale-105 border-[#7b9cff]/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : 'hover:border-[#7b9cff]/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div
                      className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-lg"
                      style={{ backgroundColor: rankColor }}
                    >
                      #{rank}
                    </div>

                    <div className="flex flex-col items-center pt-6 space-y-3">
                      {/* Avatar */}
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                          isTop1 ? 'bg-[#7b9cff]' : 'bg-[#111827]'
                        }`}
                      >
                        {sp.avatar}
                      </div>

                      {/* Name */}
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {sp.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-[#94A3B8]">
                          {sp.role}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        {sp.totalReviews > 0 ? (
                          <>
                            <StarRating rating={Math.round(sp.avgRating)} size="md" />
                            <span className="text-lg font-bold text-[#EF9F27]">
                              {sp.avgRating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-[#94A3B8]">
                            Sin reseñas
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-[#94A3B8]">
                        <div>
                          {sp.totalReviews} {sp.totalReviews === 1 ? 'reseña' : 'reseñas'}
                        </div>
                        <div>
                          {sp.completedServices} servicios completados
                        </div>
                      </div>
                    </div>

                    {/* Bottom Glow for Top 1 */}
                    {isTop1 && (
                      <div className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-[#7b9cff] to-transparent" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {['all', '5', '4', '3-less', 'verified'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                activeFilter === filter
                  ? 'bg-[#7b9cff] border-[#7b9cff] text-white'
                  : 'bg-transparent border-white/[0.05] text-[#94A3B8] hover:border-white/10 hover:text-[#F8FAFC]'
              }`}
            >
              {filter === 'all' && 'Todas'}
              {filter === '5' && '5 estrellas'}
              {filter === '4' && '4 estrellas'}
              {filter === '3-less' && '3 o menos'}
              {filter === 'verified' && 'Verificadas'}
            </button>
          ))}
        </div>

        {/* Leave a Review Form */}
        {!userId ? (
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-8 text-center">
            <p className="text-slate-500 dark:text-[#94A3B8] font-medium">
              Inicia sesión para calificar tus servicios completados.
            </p>
          </div>
        ) : pendingAppointments.length > 0 ? (
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7b9cff]/10 border border-[#7b9cff]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#7b9cff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Deja tu opinión
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#94A3B8]">
                  ¿Cómo fue tu experiencia con nosotros?
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#94A3B8] mb-2">
                  Selecciona tu servicio completado
                </label>
                <CustomSelect
                  value={formCitaId}
                  onChange={setFormCitaId}
                  options={pendingAppointments.map(cita => ({
                    value: String(cita.id),
                    label: `${cita.servicio?.nombre || 'Servicio'}`,
                    sublabel: `${formatDate(cita.fecha)} ${cita.hora || ''}`
                  }))}
                  placeholder="Selecciona un servicio..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-[#94A3B8] mb-2">
                    Calificación del Especialista
                  </label>
                  <StarRating rating={formRating} onChange={setFormRating} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-[#94A3B8] mb-2">
                    Calificación del Servicio
                  </label>
                  <StarRating rating={formServiceRating} onChange={setFormServiceRating} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-[#94A3B8] mb-2">
                  Comentario
                </label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  className="w-full p-4 bg-white dark:bg-[#020617] border border-white/[0.05] rounded-2xl text-slate-900 dark:text-[#F8FAFC] placeholder-slate-500 dark:placeholder-[#94A3B8] focus:border-[#7b9cff]/50 focus:outline-none transition-all"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={!formRating || !formServiceRating || !formText.trim() || !formCitaId || submitting}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all ${
                    formRating && formServiceRating && formText.trim() && formCitaId && !submitting
                      ? 'bg-[#7b9cff] text-slate-900 hover:bg-[#6a8be0] shadow-lg shadow-[#7b9cff]/20'
                      : 'bg-[#111827] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Publicando...' : 'Publicar opinión'}
                </button>
                {showFormSuccess && (
                  <span className="text-[#1D9E75] font-bold text-sm">
                    ✓ Opinión publicada exitosamente!
                  </span>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-8 text-center">
            <p className="text-slate-500 dark:text-[#94A3B8] font-medium">
              No tienes servicios pendientes por calificar.
            </p>
          </div>
        )}

        {/* Review Cards */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter mb-4">
            Todas las Reseñas
          </h2>
          {filteredReviews.length === 0 ? (
            <div className="text-center p-8 bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl">
              <p className="text-slate-500 dark:text-[#94A3B8]">No hay reseñas para mostrar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map(review => {
                const userName = review.usuario ? `${review.usuario.nombre} ${review.usuario.apellidos || ''}` : 'Usuario';
                const serviceName = review.cita?.servicio?.nombre || 'Servicio';
                
                return (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6 space-y-4 hover:border-[#7b9cff]/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: getColorForUser(userName) }}
                        >
                          {getInitials(userName)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC]">
                            {userName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                            {formatDate(review.createdAt)} • {serviceName}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating rating={review.specialistRating} size="sm" />
                        <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">
                          Especialista
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-[#F8FAFC] leading-relaxed">
                      {review.comment}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.05] pt-4">
                      <span className="inline-flex items-center gap-1 text-[#1D9E75] text-xs font-bold uppercase tracking-wider">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Servicio verificado
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">Servicio:</span>
                        <StarRating rating={review.serviceRating} size="sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ratings History */}
        {ratingsHistory.length > 0 && (
          <div className="space-y-6 bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-8">
            <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Historial de Calificaciones
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ratingsHistory}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7b9cff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7b9cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94A3B8"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[3, 5]}
                    tickCount={3}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050507',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                    itemStyle={{ color: '#7b9cff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#7b9cff"
                    strokeWidth={3}
                    fill="url(#colorScore)"
                    activeDot={{ r: 6 }}
                  >
                    {ratingsHistory.map((entry, index) => (
                      <Dot key={`dot-${index}`} r={4} fill="#7b9cff" />
                    ))}
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                      Mes
                    </th>
                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest text-center">
                      Calificación Promedio
                    </th>
                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest text-center">
                      # de Reseñas
                    </th>
                    <th className="pb-3 text-xs font-bold text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest text-center">
                      Cambio
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {ratingsHistory.map((item, index) => {
                    const prev = index > 0 ? ratingsHistory[index - 1] : null;
                    const delta = prev ? item.score - prev.score : 0;
                    const deltaColor = delta > 0 ? 'text-[#1D9E75]' : delta < 0 ? 'text-[#E24B4A]' : 'text-[#94A3B8]';
                    const deltaIcon = delta > 0 ? '↑' : delta < 0 ? '↓' : '→';

                    return (
                      <tr key={item.month} className="hover:bg-[#111827]/50 transition-colors">
                        <td className="py-3 text-sm text-slate-700 dark:text-[#F8FAFC]">
                          {item.month} 2026
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-bold text-[#EF9F27]">
                              {item.score.toFixed(1)}
                            </span>
                            <StarRating rating={Math.round(item.score)} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 text-center text-sm text-slate-700 dark:text-[#F8FAFC]">
                          {item.reviews}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-sm font-bold ${deltaColor}`}>
                            {deltaIcon} {Math.abs(delta).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResenasPage;
