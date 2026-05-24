import React from 'react';

const HistorialReciente = ({ services }) => {
  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
      <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-8">Historial Reciente</h3>
      
      <div className="space-y-6">
        {services.map((service, index) => (
          <div key={index} className="flex gap-4 items-center group cursor-pointer">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-800 shrink-0">
              <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-black text-slate-200 truncate">{service.name}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-yellow-500">★</span>
                  <span className="text-[10px] font-black text-slate-400">{service.rating}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 truncate mb-1">{service.vehicle}</p>
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{service.date}</span>
                <span className="flex items-center gap-1.5 text-[8px] font-black text-green-500 uppercase tracking-widest">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span> Completado
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/50">
        <button className="w-full text-sm font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center justify-center gap-2">
          Ver historial completo <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default HistorialReciente;
