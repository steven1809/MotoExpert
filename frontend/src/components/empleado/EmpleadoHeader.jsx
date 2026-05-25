import React from 'react';

const EmpleadoHeader = ({ employeeName, assignedToday }) => {
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  const formattedTime = today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
          ¡Hola, {employeeName}! 👋
        </h1>
        <p className="text-slate-500 font-bold text-sm tracking-tight">
          Tienes {assignedToday} servicios asignados hoy
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 bg-[#0d1526] border border-slate-800 px-5 py-2.5 rounded-2xl">
          <span className="text-2xl">🕒</span>
          <div className="text-right">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
              {formattedDate}
            </div>
            <div className="text-lg font-black text-white leading-none">
              {formattedTime}
            </div>
          </div>
        </div>

        <button className="relative w-12 h-12 bg-[#0d1526] border border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-800/50 transition-all duration-300">
          <span className="text-xl">🔔</span>
          <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-red-500 border-2 border-[#0d1526] rounded-full flex items-center justify-center text-[8px] font-black text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
};

export default EmpleadoHeader;
