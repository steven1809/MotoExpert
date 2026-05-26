import React, { useMemo, useState } from 'react';
import WompiCheckout from './WompiCheckout'; // ajusta la ruta según tu proyecto

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PaymentStep({ apiBaseUrl, onNavigate }) {
  const baseUrl = apiBaseUrl || API_BASE_URL;
  const { appointmentId, summary } = useMemo(() => {
    const state = window.history.state || {};
    const id = typeof state.appointmentId === 'number' ? state.appointmentId : null;
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

  // Estado para Wompi
  const [wompiData, setWompiData] = useState(null);
  const [loadingWompi, setLoadingWompi] = useState(false);

  const isCash = selected === 'cash';
  const isWompi = selected === 'wompi';

  const canSubmit = useMemo(() => {
    if (!appointmentId || !selected) return false;
    if (isCash) return true;
    return false; // Wompi usa su propio widget
  }, [appointmentId, selected, isCash]);

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

  // Al seleccionar Wompi, solicitar datos al backend para inicializar el widget
  const handleSelectWompi = async () => {
    setSelected('wompi');
    if (wompiData) return; // ya los tenemos

    setLoadingWompi(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${baseUrl}/payments/wompi/init`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Error al iniciar Wompi');
      }

      setWompiData(data); // { publicKey, reference, integritySignature, amountCOP, redirectUrl }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
      setSelected(null);
    } finally {
      setLoadingWompi(false);
    }
  };

  const methodCardClass = (active) =>
    `w-full text-left p-5 rounded-2xl border transition-all ${
      active
        ? 'border-[#2563EB] bg-[#2563EB]/10 shadow-lg shadow-[#2563EB]/10'
        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#2563EB]/40'
    }`;

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

        {/* Selector de métodos — solo 2 opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button type="button" onClick={() => setSelected('cash')} className={methodCardClass(isCash)}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Efectivo</div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Confirmas ahora, pagas en taller.</div>
              </div>
              <div className={`w-4 h-4 rounded-full border ${isCash ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300 dark:border-white/20'}`} />
            </div>
          </button>

          <button type="button" onClick={handleSelectWompi} className={methodCardClass(isWompi)}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Wompi</div>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8]">Tarjeta, PSE o Nequi.</div>
              </div>
              <div className={`w-4 h-4 rounded-full border ${isWompi ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300 dark:border-white/20'}`} />
            </div>
          </button>
        </div>

        {/* Panel Wompi */}
        {isWompi && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
            {loadingWompi ? (
              <div className="flex items-center justify-center py-6 space-x-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400 font-bold">Iniciando Wompi...</span>
              </div>
            ) : wompiData ? (
              <WompiCheckout
                appointmentId={appointmentId}
                amountCOP={wompiData.amountCOP}
                publicKey={wompiData.publicKey}
                integritySignature={wompiData.integritySignature}
                reference={wompiData.reference}
                redirectUrl={wompiData.redirectUrl}
              />
            ) : null}
          </div>
        )}

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

        {error && (
          <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}