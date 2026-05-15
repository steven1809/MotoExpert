import React, { useState } from 'react';
import StarRating from './StarRating';

const ServiceReportCard = ({ cita, rating, onSubmitRating }) => {
  const [specialistRating, setSpecialistRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getConditionStyle = (condition) => {
    switch (condition) {
      case 'optimal':
        return {
          label: '✅ Optimal',
          className: 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1D9E75]'
        };
      case 'attention':
        return {
          label: '⚠️ Requires attention',
          className: 'bg-[#BA7517]/10 border-[#BA7517] text-[#BA7517]'
        };
      case 'urgent':
        return {
          label: '🔴 Urgent follow-up',
          className: 'bg-[#E24B4A]/10 border-[#E24B4A] text-[#E24B4A]'
        };
      default:
        return {
          label: '—',
          className: 'bg-[#2a2d3a] border-[#2a2d3a] text-[#94A3B8]'
        };
    }
  };

  const condition = getConditionStyle(cita.report?.condition);
  const completedDate = cita.completedAt 
    ? new Date(cita.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    : '—';
  const completedTime = cita.completedAt 
    ? new Date(cita.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
    : '—';

  const handleSubmit = async () => {
    if (!specialistRating || !serviceRating) return;
    setIsSubmitting(true);
    try {
      await onSubmitRating({
        citaId: cita.id,
        specialistRating,
        serviceRating,
        comment: comment.trim() || undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1a1d27] border border-[#2a2d3a] p-6 rounded-2xl hover:border-[#3a3d4a] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-black text-[#F8FAFC] truncate">
            {cita.servicio?.nombre || 'Servicio'}
          </h4>
          <p className="text-sm text-[#94A3B8]">
            {cita.vehiculo?.placa || '—'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${condition.className}`}>
          {condition.label}
        </span>
      </div>

      <div className="space-y-4">
        {cita.report?.workPerformed && (
          <div>
            <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
              Work performed
            </span>
            <p className="text-[#F8FAFC] text-sm mt-1 leading-relaxed">
              {cita.report.workPerformed}
            </p>
          </div>
        )}

        {cita.report?.partsUsed && (
          <div>
            <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
              Parts used
            </span>
            <p className="text-[#F8FAFC] text-sm mt-1 leading-relaxed">
              {cita.report.partsUsed}
            </p>
          </div>
        )}

        {cita.report?.observations && (
          <div>
            <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
              Observations
            </span>
            <p className="text-[#F8FAFC] text-sm mt-1 leading-relaxed">
              {cita.report.observations}
            </p>
          </div>
        )}
      </div>

      {/* Rating Section */}
      <div className="mt-6 pt-4 border-t border-[#2a2d3a]">
        {rating || cita.rated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#1D9E75]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold">Thank you for your feedback</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
                  Specialist
                </span>
                <StarRating value={rating?.specialistRating || 0} readOnly size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
                  Service quality
                </span>
                <StarRating value={rating?.serviceRating || 0} readOnly size="md" />
              </div>
              {rating?.comment && (
                <div className="mt-2">
                  <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
                    Comment
                  </span>
                  <p className="text-[#F8FAFC] text-sm mt-1">{rating.comment}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
                Specialist
              </span>
              <div 
                onMouseEnter={() => setShowComment(true)}
                onMouseLeave={() => setShowComment(false)}
              >
                <StarRating 
                  value={specialistRating} 
                  onChange={setSpecialistRating} 
                  readOnly={false} 
                  size="md" 
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7080] text-[11px] font-bold uppercase tracking-wider">
                Service quality
              </span>
              <div 
                onMouseEnter={() => setShowComment(true)}
                onMouseLeave={() => setShowComment(false)}
              >
                <StarRating 
                  value={serviceRating} 
                  onChange={setServiceRating} 
                  readOnly={false} 
                  size="md" 
                />
              </div>
            </div>
            {(showComment || specialistRating > 0 || serviceRating > 0) && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)..."
                rows={2}
                className="w-full px-3 py-2 bg-[#0f1117] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-sm placeholder-[#6b7080] focus:outline-none focus:border-[#2563EB]/50 transition-all resize-none"
              />
            )}
            <button
              onClick={handleSubmit}
              disabled={!specialistRating || !serviceRating || isSubmitting}
              className="w-full py-2 bg-[#2563EB] hover:bg-[#1d4ed8] disabled:bg-[#2a2d3a] disabled:text-[#6b7080] disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95"
            >
              {isSubmitting ? 'Submitting...' : 'Submit rating'}
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#2a2d3a]">
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{completedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{completedTime}</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceReportCard;
