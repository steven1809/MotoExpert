import React from 'react';

const SuccessScreen = ({ id, email, onReset }) => {
  return (
    <div className="text-center py-12 px-4 space-y-8 animate-in zoom-in duration-500">
      <div className="relative flex justify-center">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.5)]">
          <svg
            className="w-12 h-12 animate-in slide-in-from-bottom duration-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
          ¡Reserva Exitosa!
        </h2>
        <div className="inline-block px-4 py-2 bg-gray-900 border-2 border-gray-800 rounded-full">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mr-2">
            Código:
          </span>
          <span className="text-blue-400 font-mono font-bold text-lg">#{id}</span>
        </div>
        <p className="text-gray-400 max-w-sm mx-auto">
          Hemos recibido tu solicitud. Se ha enviado una confirmación a{' '}
          <span className="text-white font-semibold">{email}</span>.
        </p>
      </div>

      <div className="pt-8">
        <button
          onClick={onReset}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-blue-600/25 active:scale-95"
        >
          Agendar otra cita
        </button>
      </div>
    </div>
  );
};

export default SuccessScreen;
