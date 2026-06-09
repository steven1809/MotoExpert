import React, { useMemo, useState } from 'react';

import { API_BASE_URL } from '../apiConfig';

export default function PaymentStep({ apiBaseUrl, onNavigate }) {
  const baseUrl = apiBaseUrl || API_BASE_URL;
  const { appointmentId, summary } = useMemo(() => {
    const state = window.history.state || {};
    const raw = state.appointmentId;
    const id = raw != null ? parseInt(String(raw).replace(/\D/g, ''), 10) || null : null;
    const s = state.summary || null;
    return {
      appointmentId: id,
      summary: s
        ? {
            fecha: typeof s.fecha === 'string' ? s.fecha : '',
            hora_inicio: typeof s.hora_inicio === 'string' ? s.hora_inicio : '',
            servicio: typeof s.servicio === 'string' ? s.servicio : '',
            vehiculo: typeof s.vehiculo === 'string' ? s.vehiculo : '',
          }
        : null,
    };
  }, []);

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null); // Stores { wompiPaymentLink, paymentId }

  const isCash = selected === 'cash';
  const isWompi = selected === 'wompi';

  const canSubmit = useMemo(() => {
    if (!appointmentId || !selected) return false;
    return isCash || isWompi;
  }, [appointmentId, selected, isCash, isWompi]);

  const go = (path, state) => {
    if (typeof onNavigate === 'function') {
      onNavigate(path, state);
      return;
    }
    try {
      window.history.pushState(state || {}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.assign(path);
    }
  };

  // Submit para efectivo
  const submitCash = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseUrl}/payments/generate`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId, method: 'cash' }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo generar el pago');
      }

      const tokenCode = data?.tokenCode || data?.payment?.tokenCode;
      if (!tokenCode || typeof tokenCode !== 'string') {
        throw new Error('No se recibió tokenCode');
      }

      go('/appointments/confirmation', { tokenCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Submit para Wompi
  const submitWompi = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseUrl}/payments/generate`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId, method: 'wompi' }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo generar el pago');
      }

      if (!data?.wompiPaymentLink || !data?.payment?.id) {
        throw new Error('No se recibió la información de pago de Wompi');
      }

      setPaymentData({
        wompiPaymentLink: data.wompiPaymentLink,
        paymentId: data.payment.id
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Verify Wompi payment after user pays
  const verifyWompiPayment = async () => {
    if (!paymentData?.paymentId) return;
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseUrl}/payments/${paymentData.paymentId}/verify-wompi`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'No se pudo verificar el pago');
      }

      const tokenCode = data?.tokenCode;
      if (!tokenCode || typeof tokenCode !== 'string') {
        throw new Error('No se recibió el token de entrega. Intenta de nuevo.');
      }

      go('/appointments/confirmation', { tokenCode });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const methodCardClass = (active, color = 'blue') => {
    if (color === 'purple') {
      return `w-full text-left p-5 rounded-2xl border transition-all ${
        active
          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-lg shadow-[#8B5CF6]/10'
          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30'
      }`;
    }
    return `w-full text-left p-5 rounded-2xl border transition-all ${
      active
        ? 'border-[#2563EB] bg-[#2563EB]/10 shadow-lg shadow-[#2563EB]/10'
        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-400 dark:hover:border-white/30'
    }`;
  };

  // If we have Wompi payment link, show payment screen
  if (paymentData?.wompiPaymentLink) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
              Pago
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
              Paga con Wompi
            </h2>
          </div>

          <div className="rounded-3xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-6 space-y-4 text-center">
            <div className="text-4xl mb-2"></div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Completa tu pago seguro con Wompi
            </p>
            <a
              href={paymentData.wompiPaymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-2xl shadow-[#8B5CF6]/20 transition-all active:scale-[0.99]"
            >
              Ir a pagar con Wompi
            </a>
            <div className="mt-4 pt-4 border-t border-[#8B5CF6]/10">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                ¿Ya completaste el pago?
              </p>
              <button
                type="button"
                onClick={verifyWompiPayment}
                disabled={loading}
                className="w-full py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Ya pagué, verificar'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPaymentData(null)}
            className="w-full text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            ← Volver a métodos de pago
          </button>

          {error && (
            <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
            Pago
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
            Selecciona cómo pagar
          </h2>
        </div>

        {!appointmentId ? (
          <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold">
            No se encontró la información de la cita. Vuelve a agendar e intenta de nuevo.
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-3">
            <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-[0.3em]">
              Resumen de la cita
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10">
                <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">Fecha</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{summary?.fecha || '—'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10">
                <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">Hora</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  {summary?.hora_inicio ? summary.hora_inicio.slice(0, 5) : '—'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 md:col-span-2">
                <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">Servicio</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{summary?.servicio || '—'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 md:col-span-2">
                <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">Vehículo</div>
                <div className="text-sm font-black text-slate-900 dark:text-white">{summary?.vehiculo || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Selector de métodos */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <button type="button" onClick={() => setSelected('cash')} className={methodCardClass(isCash)}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">💵 Efectivo</div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Confirmas ahora, pagas en taller.</div>
              </div>
              <div className={`w-4 h-4 rounded-full border ${isCash ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300 dark:border-white/20'}`} />
            </div>
          </button>

          <button type="button" onClick={() => setSelected('wompi')} className={methodCardClass(isWompi, 'purple')}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">💳 Pago digital (Wompi)</div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Pago seguro con tarjeta, Nequi, Daviplata o transferencia.</div>
              </div>
              <div className={`w-4 h-4 rounded-full border ${isWompi ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-slate-300 dark:border-white/20'}`} />
            </div>
          </button>
        </div>

        {/* Botón efectivo */}
        {isCash && (
          <button
            type="button"
            onClick={submitCash}
            disabled={!canSubmit || loading}
            className={`w-full py-5 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${
              canSubmit && !loading
                ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-2xl shadow-[#2563EB]/20 active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Generando código...' : 'Confirmar y pagar en taller'}
          </button>
        )}

        {/* Botón Wompi */}
        {isWompi && (
          <button
            type="button"
            onClick={submitWompi}
            disabled={!canSubmit || loading}
            className={`w-full py-5 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${
              canSubmit && !loading
                ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-2xl shadow-[#8B5CF6]/20 active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Generando link de pago...' : 'Ir a pagar con Wompi'}
          </button>
        )}

        {error && (
          <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
