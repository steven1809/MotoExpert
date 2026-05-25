import React from 'react';

const MetricCard = ({ label, value, subtext, icon, colorClass }) => (
  <div className="bg-[#0d1526] border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-[0.03] rounded-bl-full group-hover:opacity-[0.05] transition-opacity`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} opacity-10 flex items-center justify-center text-xl`}>
        {icon}
      </div>
    </div>
    <div className="mt-4 relative z-10">
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm font-bold text-slate-400 mb-1">{label}</div>
      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{subtext}</div>
    </div>
  </div>
);

const EmpleadoMetrics = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard 
        label="Servicios hoy" 
        value={stats.today} 
        subtext="100% asignados" 
        icon="📅" 
        colorClass="from-blue-500 to-indigo-600"
      />
      <MetricCard 
        label="Completados" 
        value={stats.completed} 
        subtext={`${stats.completedPercent}% del día`} 
        icon="✅" 
        colorClass="from-green-500 to-emerald-600"
      />
      <MetricCard 
        label="Pendientes" 
        value={stats.pending} 
        subtext={`${stats.pendingPercent}% restantes`} 
        icon="🕒" 
        colorClass="from-orange-500 to-amber-600"
      />
      <MetricCard 
        label="Calificación promedio" 
        value={stats.rating} 
        subtext={`Basado en ${stats.reviews} reseñas`} 
        icon="⭐" 
        colorClass="from-purple-500 to-violet-600"
      />
    </div>
  );
};

export default EmpleadoMetrics;
