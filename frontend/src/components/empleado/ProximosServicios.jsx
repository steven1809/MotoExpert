import React from 'react';

const ProximosServicios = ({ services }) => {
  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Próximos Servicios</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div key={index} className="bg-slate-900/50 border border-slate-800/50 p-6 rounded-3xl hover:bg-slate-800/50 transition-all duration-300 group">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-white">{service.time}</span>
                  <span className="text-[10px] font-bold text-slate-500">{service.countdown}</span>
                </div>
                <h4 className="text-sm font-black text-slate-300 truncate mb-1">{service.name}</h4>
                <p className="text-[10px] text-slate-500 truncate mb-2">{service.vehicle}</p>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Pendiente
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
        <button className="text-sm font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto">
          Ver todas mis citas <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default ProximosServicios;
