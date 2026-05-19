import React, { useMemo, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

type PaymentMethod = 'cash' | 'card' | 'pse';

type PaymentStepProps = {
  apiBaseUrl?: string;
  onNavigate?: (path: string, state?: unknown) => void;
};

export default function PaymentStep({
  apiBaseUrl,
  onNavigate,
}: PaymentStepProps) {
  const baseUrl = apiBaseUrl || API_BASE_URL;
  const { appointmentId, summary } = useMemo(() => {
    const state = window.history.state as
      | {
          appointmentId?: unknown;
          summary?: {
            fecha?: unknown;
            hora_inicio?: unknown;
            servicio?: unknown;
            vehiculo?: unknown;
          };
        }
      | null;

    const id = typeof state?.appointmentId === 'number' ? state.appointmentId : null;
    const s = state?.summary || null;
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

  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [mockNumber, setMockNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCash = selected === 'cash';
  const isCard = selected === 'card';
  const isPse = selected === 'pse';

  const canSubmit = useMemo(() => {
    if (!appointmentId || !selected) return false;
    if (isCash) return true;
    if (isCard || isPse) return mockNumber.trim().length > 0;
    return false;
  }, [appointmentId, selected, isCash, isCard, isPse, mockNumber]);

  const navigateToConfirmation = (tokenCode: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate('/appointments/confirmation', { tokenCode });
      return;
    }

    try {
      window.history.pushState({ tokenCode }, '', '/appointments/confirmation');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.assign('/appointments/confirmation');
    }
  };

  const submit = async () => {
    if (!canSubmit || !selected) return;
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const body: Record<string, unknown> = {
        appointmentId,
        method: selected,
      };

      if (selected === 'card' || selected === 'pse') {
        body.mockApproved = true;
      }

      const response = await fetch(`${baseUrl}/payments/generate`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data?.message === 'string'
            ? data.message
            : 'No se pudo generar el pago';
        throw new Error(message);
      }

      const tokenCode = data?.tokenCode || data?.payment?.tokenCode;
      if (!tokenCode || typeof tokenCode !== 'string') {
        throw new Error('No se recibió tokenCode');
      }

      navigateToConfirmation(tokenCode);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de conexión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const methodCardClass = (active: boolean) =>
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
              <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                Fecha
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {summary?.fecha || '—'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10">
              <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                Hora
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {summary?.hora_inicio ? summary.hora_inicio.slice(0, 5) : '—'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 md:col-span-2">
              <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                Servicio
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {summary?.servicio || '—'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 md:col-span-2">
              <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
                Vehículo
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {summary?.vehiculo || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setSelected('cash')}
          className={methodCardClass(isCash)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Efectivo
              </div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Confirmas ahora, pagas en taller.
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border ${
                isCash
                  ? 'bg-[#2563EB] border-[#2563EB]'
                  : 'border-slate-300 dark:border-white/20'
              }`}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelected('card')}
          className={methodCardClass(isCard)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Tarjeta
              </div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Pago simulado (aprobado).
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border ${
                isCard
                  ? 'bg-[#2563EB] border-[#2563EB]'
                  : 'border-slate-300 dark:border-white/20'
              }`}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelected('pse')}
          className={methodCardClass(isPse)}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                PSE
              </div>
              <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Pago simulado (aprobado).
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full border ${
                isPse
                  ? 'bg-[#2563EB] border-[#2563EB]'
                  : 'border-slate-300 dark:border-white/20'
              }`}
            />
          </div>
        </button>
      </div>

      {(isCard || isPse) && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 space-y-4">
          <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
            {isCard ? 'Datos de tarjeta (mock)' : 'Datos PSE (mock)'}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-[#94A3B8]">
              Número
            </label>
            <input
              value={mockNumber}
              onChange={(e) => setMockNumber(e.target.value)}
              placeholder={isCard ? '0000 0000 0000 0000' : 'Documento / referencia'}
              inputMode="numeric"
              className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-[#2563EB]/50 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || loading}
            className={`w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${
              canSubmit && !loading
                ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-2xl shadow-[#2563EB]/20 active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Procesando...' : 'Pagar'}
          </button>
        </div>
      )}

      {isCash && (
        <button
          type="button"
          onClick={submit}
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

      {error ? (
        <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold">
          {error}
        </div>
      ) : null}
      </div>
    </div>
  );
}
