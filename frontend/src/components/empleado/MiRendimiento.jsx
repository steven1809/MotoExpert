import React from 'react';

const MiRendimiento = ({ stats, achievements }) => {
  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Mi Rendimiento</h3>
        <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">
          Ver reporte
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">📊</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Servicios</div>
          </div>
          <div className="text-xl font-black text-white">{stats.totalMonthly}</div>
          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Este mes</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">😊</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Satisfacción</div>
          </div>
          <div className="text-xl font-black text-white">{stats.satisfaction}%</div>
          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Del cliente</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">★</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rating</div>
          </div>
          <div className="text-xl font-black text-white">{stats.rating}</div>
          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Este mes</div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">🕒</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tiempo</div>
          </div>
          <div className="text-xl font-black text-white">{stats.effectiveTime}</div>
          <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Tiempo efectivo</div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-black text-white uppercase tracking-widest">Logros</h4>
          <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Ver todos</button>
        </div>
        <div className="flex gap-4">
          {achievements.map((achievement, index) => (
            <div key={index} className="flex flex-col items-center group cursor-help" title={achievement.description}>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-110`}>
                {achievement.icon}
              </div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 text-center max-w-[60px]">
                {achievement.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MiRendimiento;
