import React, { useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

type PaymentConfirmationProps = {
  onExit?: () => void;
};

export default function PaymentConfirmation({
  onExit,
}: PaymentConfirmationProps) {
  const tokenCode = useMemo(() => {
    const state = window.history.state as { tokenCode?: unknown } | null;
    return typeof state?.tokenCode === 'string' ? state.tokenCode : '';
  }, []);

  const goToAppointments = () => {
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

          {tokenCode ? (
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <QRCodeCanvas value={tokenCode} size={168} includeMargin />
              </div>
            </div>
          ) : null}

          <div className="text-sm text-slate-600 dark:text-[#94A3B8] font-medium">
            Muestra este código al empleado cuando retires tu vehículo
          </div>
        </div>

        <button
          type="button"
          onClick={goToAppointments}
          className="w-full py-4 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-[0.99]"
        >
          Ver mis citas
        </button>
      </div>
    </div>
  );
}
