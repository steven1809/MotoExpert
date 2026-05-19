import React, { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ServiceCompletionModal = ({ cita, onClose, onSuccess, showToast }) => {
  const tokenInputRef = useRef(null);
  const [tokenCode, setTokenCode] = useState('');
  const [tokenError, setTokenError] = useState(null);
  const [workPerformed, setWorkPerformed] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [observations, setObservations] = useState('');
  const [condition, setCondition] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tokenInputRef.current) tokenInputRef.current.focus();
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!workPerformed.trim()) {
      newErrors.workPerformed = 'This field is required';
    }
    if (!condition) {
      newErrors.condition = 'This field is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      setTokenError(null);
      const sanitized = String(tokenCode || '').replace(/\D/g, '').slice(0, 6);
      if (sanitized.length !== 6) {
        setTokenError('Ingresa un código válido de 6 dígitos');
        return;
      }

      const validateRes = await fetch(`${API_BASE_URL}/payments/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenCode: sanitized }),
      });

      if (!validateRes.ok) {
        if (validateRes.status === 404) {
          setTokenError('Código no encontrado');
          return;
        }
        if (validateRes.status === 409) {
          setTokenError('Código ya fue usado');
          return;
        }
        if (validateRes.status === 410) {
          setTokenError('Código expirado');
          return;
        }

        const errData = await validateRes.json().catch(() => null);
        const msg =
          typeof errData?.message === 'string'
            ? errData.message
            : 'No se pudo validar el código';
        setTokenError(msg);
        return;
      }

      const validated = await validateRes.json().catch(() => null);
      if (!validated || validated.valid !== true) {
        setTokenError('No se pudo validar el código');
        return;
      }

      if (!validate()) return;

      const report = {
        workPerformed,
        partsUsed: partsUsed.trim() || undefined,
        observations: observations.trim() || undefined,
        condition: condition
      };

      const response = await fetch(`${API_BASE_URL}/citas/${cita.id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          estado: 'FINALIZADO', 
          report 
        }),
      });

      if (response.ok) {
        onSuccess();
        showToast('Service finalized. Customer has been notified.', 'success');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-[#2a2d3a] p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-4 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30">
            <svg className="w-8 h-8 text-[#1D9E75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">
              Validar entrega del vehículo
            </h2>
            <p className="text-[#94A3B8] text-sm font-medium mt-1">
              {cita.servicio?.nombre} · {cita.vehiculo?.placa}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
              Código del cliente (6 dígitos)
            </label>
            <input
              ref={tokenInputRef}
              autoFocus
              value={tokenCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTokenCode(v);
              }}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className={`w-full px-4 py-4 bg-[#1a1d27] border rounded-2xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none transition-all font-mono text-2xl tracking-[0.25em] text-center ${
                tokenError ? 'border-red-500' : 'border-[#2a2d3a] focus:border-[#1D9E75]/50'
              }`}
            />
            {tokenError ? (
              <p className="text-red-500 text-xs font-bold text-center">
                {tokenError}
              </p>
            ) : null}
          </div>

          {/* Work Performed */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
              Work performed
            </label>
            <textarea
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="Describe all tasks completed during this service..."
              rows={3}
              className={`w-full px-4 py-3 bg-[#1a1d27] border rounded-2xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none transition-all resize-none ${
                errors.workPerformed ? 'border-red-500' : 'border-[#2a2d3a] focus:border-[#1D9E75]/50'
              }`}
            />
            {errors.workPerformed && (
              <p className="text-red-500 text-xs font-bold">{errors.workPerformed}</p>
            )}
          </div>

          {/* Parts Used */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
              Parts / products used
            </label>
            <textarea
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
              placeholder="e.g. degreaser, protective wax, air filter..."
              rows={2}
              className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#1D9E75]/50 transition-all resize-none"
            />
          </div>

          {/* Observations */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
              Observations & recommendations
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Note any issues found, wear detected, or recommended follow-up services..."
              rows={3}
              className="w-full px-4 py-3 bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#1D9E75]/50 transition-all resize-none"
            />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
              Final vehicle condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'optimal', label: '✅ Optimal', color: 'bg-[#1D9E75]/10 border-[#1D9E75] text-[#1D9E75]' },
                { value: 'attention', label: '⚠️ Requires attention', color: 'bg-[#BA7517]/10 border-[#BA7517] text-[#BA7517]' },
                { value: 'urgent', label: '🔴 Urgent', color: 'bg-[#E24B4A]/10 border-[#E24B4A] text-[#E24B4A]' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCondition(option.value)}
                  className={`px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                    condition === option.value ? option.color : 'bg-[#1a1d27] border-[#2a2d3a] text-[#94A3B8] hover:border-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.condition && (
              <p className="text-red-500 text-xs font-bold">{errors.condition}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-8 py-4 bg-[#1D9E75] hover:bg-[#168a62] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#1D9E75]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Validando...' : 'Validar y finalizar'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full px-8 py-4 bg-[#2a2d3a] hover:bg-[#3a3d4a] text-[#94A3B8] font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-[#2a2d3a] transition-all active:scale-95 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCompletionModal;
