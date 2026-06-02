import React, { useState, useEffect } from 'react';
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

const AdminResenasModeracion = ({ showToast }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const token = localStorage.getItem('token');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        throw new Error('Error al cargar las reseñas');
      }
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleHide = async (id) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${id}/hide`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchReviews();
        showToast('Reseña ocultada exitosamente', 'success');
      } else {
        throw new Error('Error al ocultar la reseña');
      }
    } catch (err) {
      showToast(err.message || 'Error al ocultar la reseña', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleShow = async (id) => {
    setProcessingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${id}/show`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchReviews();
        showToast('Reseña visible nuevamente', 'success');
      } else {
        throw new Error('Error al mostrar la reseña');
      }
    } catch (err) {
      showToast(err.message || 'Error al mostrar la reseña', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña permanentemente?')) return;
    
    setProcessingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchReviews();
        showToast('Reseña eliminada exitosamente', 'success');
      } else {
        throw new Error('Error al eliminar la reseña');
      }
    } catch (err) {
      showToast(err.message || 'Error al eliminar la reseña', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'visible') return !review.status || review.status === 'VISIBLE';
    if (activeFilter === 'hidden') return review.status === 'HIDDEN';
    if (activeFilter === '5') return review.specialistRating === 5;
    if (activeFilter === '3-less') return review.specialistRating <= 3;
    return true;
  });

  const stats = {
    total: reviews.length,
    visible: reviews.filter(r => !r.status || r.status === 'VISIBLE').length,
    hidden: reviews.filter(r => r.status === 'HIDDEN').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.specialistRating, 0) / reviews.length).toFixed(1) 
      : 0
  };

  const StarRating = ({ rating, size = 'md' }) => {
    const starSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <div
            key={star}
            className={`${starSize} ${star <= rating ? 'text-[#EF9F27]' : 'text-[#3a3d4a]'}`}
          >
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
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
    <div className="min-h-screen bg-white dark:bg-[#020617] py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] mb-2">
            Moderación de Reseñas
          </h1>
          <p className="text-slate-500 dark:text-[#94A3B8]">
            Gestiona y moderar las opiniones de los clientes
          </p>
        </div>

        {error && (
          <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-3xl text-red-400 mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6">
            <div className="text-sm text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
              Total de Reseñas
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC]">
              {stats.total}
            </div>
          </div>
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6">
            <div className="text-sm text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
              Visibles
            </div>
            <div className="text-3xl font-black text-[#1D9E75]">
              {stats.visible}
            </div>
          </div>
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6">
            <div className="text-sm text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
              Ocultas
            </div>
            <div className="text-3xl font-black text-[#E24B4A]">
              {stats.hidden}
            </div>
          </div>
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6">
            <div className="text-sm text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
              Calificación Promedio
            </div>
            <div className="text-3xl font-black text-[#EF9F27]">
              {stats.avgRating}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'visible', label: 'Visibles' },
            { key: 'hidden', label: 'Ocultas' },
            { key: '5', label: '5 Estrellas' },
            { key: '3-less', label: '3 o menos' }
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
                activeFilter === filter.key
                  ? 'bg-[#7b9cff] border-[#7b9cff] text-white'
                  : 'bg-transparent border-white/[0.05] text-[#94A3B8] hover:border-white/10 hover:text-[#F8FAFC]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center p-8 bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl">
              <p className="text-slate-500 dark:text-[#94A3B8]">No hay reseñas para mostrar</p>
            </div>
          ) : (
            filteredReviews.map(review => {
              const userName = review.usuario 
                ? `${review.usuario.nombre} ${review.usuario.apellidos || ''}` 
                : 'Usuario';
              const serviceName = review.cita?.servicio?.nombre || 'Servicio';
              const isVisible = !review.status || review.status === 'VISIBLE';
              
              return (
                <div
                  key={review.id}
                  className={`bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl p-6 hover:border-[#7b9cff]/30 transition-all ${
                    !isVisible ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold"
                        style={{ backgroundColor: getColorForUser(userName) }}
                      >
                        {getInitials(userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-base font-medium text-slate-900 dark:text-[#F8FAFC]">
                            {userName}
                          </span>
                          {!isVisible && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 rounded-full uppercase">
                              Oculto
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-[#94A3B8] mb-2">
                          {formatDate(review.createdAt)} • {serviceName}
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <span className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase mr-1">
                              Especialista:
                            </span>
                            <StarRating rating={review.specialistRating} size="sm" />
                          </div>
                          <div>
                            <span className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase mr-1">
                              Servicio:
                            </span>
                            <StarRating rating={review.serviceRating} size="sm" />
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-700 dark:text-[#F8FAFC] leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDetailModal(true);
                        }}
                        className="p-2 rounded-full hover:bg-[#7b9cff]/10 text-[#7b9cff] transition-colors"
                        title="Ver detalle"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {isVisible ? (
                        <button
                          onClick={() => handleHide(review.id)}
                          disabled={processingId === review.id}
                          className="p-2 rounded-full hover:bg-yellow-500/10 text-yellow-500 transition-colors disabled:opacity-50"
                          title="Ocultar reseña"
                        >
                          {processingId === review.id ? (
                            <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleShow(review.id)}
                          disabled={processingId === review.id}
                          className="p-2 rounded-full hover:bg-green-500/10 text-green-500 transition-colors disabled:opacity-50"
                          title="Mostrar reseña"
                        >
                          {processingId === review.id ? (
                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={processingId === review.id}
                        className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                        title="Eliminar reseña"
                      >
                        {processingId === review.id ? (
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#050507] border border-white/[0.05] rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-[#F8FAFC]">
                  Detalle de Reseña
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-500 dark:text-[#94A3B8] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: getColorForUser(selectedReview.usuario ? `${selectedReview.usuario.nombre} ${selectedReview.usuario.apellidos || ''}` : '') }}
                  >
                    {getInitials(selectedReview.usuario ? `${selectedReview.usuario.nombre} ${selectedReview.usuario.apellidos || ''}` : '')}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                      {selectedReview.usuario ? `${selectedReview.usuario.nombre} ${selectedReview.usuario.apellidos || ''}` : 'Usuario'}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-[#94A3B8]">
                      {formatDate(selectedReview.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/20 dark:bg-[#111827] rounded-2xl p-4">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                      Calificación Especialista
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={selectedReview.specialistRating} size="lg" />
                      <span className="text-2xl font-black text-[#EF9F27]">
                        {selectedReview.specialistRating}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900/20 dark:bg-[#111827] rounded-2xl p-4">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                      Calificación Servicio
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={selectedReview.serviceRating} size="lg" />
                      <span className="text-2xl font-black text-[#EF9F27]">
                        {selectedReview.serviceRating}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedReview.cita?.servicio?.nombre && (
                  <div className="bg-slate-900/20 dark:bg-[#111827] rounded-2xl p-4">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                      Servicio
                    </div>
                    <div className="text-base text-slate-900 dark:text-[#F8FAFC] font-medium">
                      {selectedReview.cita.servicio.nombre}
                    </div>
                  </div>
                )}

                {selectedReview.comment && (
                  <div className="bg-slate-900/20 dark:bg-[#111827] rounded-2xl p-4">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                      Comentario
                    </div>
                    <div className="text-base text-slate-900 dark:text-[#F8FAFC] leading-relaxed">
                      {selectedReview.comment}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900/20 dark:bg-[#111827] rounded-2xl p-4">
                  <div className="text-xs text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                    Estado
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                    !selectedReview.status || selectedReview.status === 'VISIBLE'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {!selectedReview.status || selectedReview.status === 'VISIBLE' ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResenasModeracion;
