import React from 'react';

const MiJornadaHoy = ({ appointments }) => {
  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-[2.5rem] p-6 shadow-xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <span>📅</span> Mi jornada - Hoy
        </h3>
        <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
          Ver calendario
        </button>
      </div>

      <div className="flex-1 space-y-6 relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-800/50"></div>
        
        {appointments.map((apt, index) => (
          <div key={index} className="flex gap-4 relative z-10">
            <div className={`w-[24px] h-[24px] rounded-full border-4 border-[#0d1526] flex items-center justify-center ${
              apt.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-700'
            }`}>
              <div className="w-1.5 h-1.5 bg-[#0d1526] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-black text-slate-400 uppercase">{apt.time}</span>
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  apt.status === 'in-progress' ? 'text-blue-400' : 'text-slate-500'
                }`}>
                  {apt.status === 'in-progress' ? 'En progreso' : 'Pendiente'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-200 truncate leading-none mb-1">{apt.service}</h4>
              <p className="text-[10px] text-slate-500 truncate">{apt.vehicle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiJornadaHoy;
