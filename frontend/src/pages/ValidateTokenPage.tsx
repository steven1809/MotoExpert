import React, { useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE_URL } from '../apiConfig';

type ValidateResult = {
  valid: true;
  appointmentId: number;
};

export default function ValidateTokenPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tokenCode, setTokenCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = useMemo(
    () => (localStorage.getItem('role') || '').toLowerCase(),
    [],
  );
  const isEmpleado = role === 'empleado' || role === 'trabajador' || role === 'employee';

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const reset = () => {
    setTokenCode('');
    setLoading(false);
    setResult(null);
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const canSubmit = tokenCode.length === 6 && !loading && !result;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/payments/validate`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tokenCode }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        const appointmentId = data?.appointmentId;
        if (data?.valid === true && typeof appointmentId === 'number') {
          setResult({ valid: true, appointmentId });
          return;
        }
        throw new Error('Respuesta inválida del servidor');
      }

      if (response.status === 404) {
        setError('Código no encontrado');
        return;
      }
      if (response.status === 409) {
        setError('Código ya fue usado');
        return;
      }
      if (response.status === 410) {
        setError('Código expirado');
        return;
      }

      const message =
        typeof data?.message === 'string'
          ? data.message
          : 'No se pudo validar el código';
      setError(message);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error de conexión';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isEmpleado) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 text-center space-y-3">
          <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
            No autorizado
          </div>
          <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
            Esta pantalla solo está disponible para empleados.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest">
            Validación
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
            Validar entrega
          </h1>
        </div>

        {!result ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-[#94A3B8]">
                Código (6 dígitos)
              </label>
              <input
                ref={inputRef}
                autoFocus
                value={tokenCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTokenCode(v);
                }}
                inputMode="numeric"
                pattern="\\d{6}"
                maxLength={6}
                placeholder="000000"
                className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono text-3xl font-black tracking-[0.25em] text-center focus:border-[#2563EB]/50 focus:outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                canSubmit
                  ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-2xl shadow-[#2563EB]/20 active:scale-[0.99]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Validando...' : 'Validar entrega'}
            </button>

            {error ? (
              <div className="p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold text-center">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={reset}
              className="w-full py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-[#94A3B8] font-black text-xs uppercase tracking-[0.2em] hover:border-[#2563EB]/40 transition-all"
            >
              Nueva validación
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-6 space-y-3">
            <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">
              Éxito
            </div>
            <div className="text-emerald-700 dark:text-emerald-300 text-lg font-black">
              Vehículo entregado correctamente
            </div>
            <div className="text-emerald-700/80 dark:text-emerald-300/80 text-sm font-medium">
              Appointment ID: <span className="font-mono font-black">{result.appointmentId}</span>
            </div>

            <button
              type="button"
              onClick={reset}
              className="w-full mt-2 py-3 rounded-2xl border border-emerald-500/30 bg-white/40 dark:bg-white/5 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase tracking-[0.2em] hover:border-emerald-500/60 transition-all"
            >
              Nueva validación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

