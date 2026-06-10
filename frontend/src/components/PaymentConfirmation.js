import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { API_BASE_URL } from '../apiConfig';

export default function PaymentConfirmation({ onExit, tokenCode: propTokenCode, apiBaseUrl }) {
  const baseUrl = apiBaseUrl || API_BASE_URL;
  const [tokenCode, setTokenCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Si viene como prop (efectivo), úsalo directo
    if (propTokenCode) {
      setTokenCode(propTokenCode);
      try {
        window.history.replaceState({ tokenCode: propTokenCode }, '', window.location.pathname);
      } catch {}
      return;
    }

    // 2. Si hay tokenCode en history state (navegación interna), úsalo
    const state = window.history.state || {};
    if (typeof state.tokenCode === 'string' && state.tokenCode) {
      setTokenCode(state.tokenCode);
      return;
    }

    // 3. Si venimos de Wompi (hay ?id= en la URL), verificar por transaction ID directamente
    const params = new URLSearchParams(window.location.search);
    const wompiTransactionId = params.get('id');

    if (wompiTransactionId) {
      const verifyPayment = async () => {
        setLoading(true);
        setError(null);
        try {
          // Usamos el endpoint público que recibe el transaction ID de Wompi
          // No necesita Authorization ni localStorage
          const response = await fetch(
            `${baseUrl}/payments/verify-wompi-transaction/${wompiTransactionId}`,
            { method: 'POST' }
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(data?.message || 'No se pudo verificar el pago');
          }

          const code = data?.tokenCode;
          if (!code) {
            throw new Error('El pago fue procesado pero no se generó el token. Contacta al taller.');
          }

          // Limpiar localStorage (ya no lo necesitamos)
          localStorage.removeItem('wompiPaymentData');

          setTokenCode(code);

          // Limpiar la URL (quitar ?id=...&env=...)
          window.history.replaceState(
            { tokenCode: code },
            '',
            '/appointments/payment-confirmation'
          );
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Error al verificar el pago');
        } finally {
          setLoading(false);
        }
      };

      verifyPayment();
    }
  }, [propTokenCode, baseUrl]);

  const goToDashboard = () => {
    if (typeof onExit === 'function') {
      onExit();
      return;
    }
    try {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      window.location.assign('/');
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-2 border-[#8B5CF6] border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-600 dark:text-[#94A3B8] font-medium">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error && !tokenCode) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#020617] flex items-center justify-center px-6">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-red-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
            Error al verificar el pago
          </h1>
          <p className="text-slate-600 dark:text-[#94A3B8] font-medium">{error}</p>
          <button
            type="button"
            onClick={goToDashboard}
            className="w-full py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] transition-all"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // --- Success state ---
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] px-6 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">
            ¡Cita confirmada!
          </h1>
          <p className="text-slate-600 dark:text-[#94A3B8] font-medium">
            Guarda este código. Lo necesitarás para validar tu cita.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 text-center space-y-4">
          <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-[0.3em]">
            Código
          </div>
          <div className="flex justify-center">
            <div className="px-6 py-4 rounded-2xl bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/10">
              <div className="text-4xl font-black tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                {tokenCode || '------'}
              </div>
            </div>
          </div>
          {tokenCode && (
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <QRCodeCanvas value={tokenCode} size={168} includeMargin />
              </div>
            </div>
          )}
          <div className="text-sm text-slate-600 dark:text-[#94A3B8] font-medium">
            Muestra este código al empleado cuando retires tu vehículo
          </div>
        </div>

        <button
          type="button"
          onClick={goToDashboard}
          className="w-full py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-[0.99]"
        >
          Ver mis citas
        </button>
      </div>
    </div>
  );
}