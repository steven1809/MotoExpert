import React from 'react';

const CurrentService = ({ service }) => {
  if (!service) return null;

  return (
    <div className="bg-[#0d1526] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Servicio Actual
        </h3>
        <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
          En progreso
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/5">
          <div className="relative rounded-[2rem] overflow-hidden aspect-video border border-slate-800">
            <img 
              src={service.vehiculoImagen || "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=800"} 
              alt={service.vehiculo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        <div className="lg:w-3/5 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 leading-tight">{service.nombre}</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏍️</span>
                <div>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Vehículo</div>
                  <div className="text-sm font-bold text-slate-300 leading-none">{service.vehiculo}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Cliente</div>
                  <div className="text-sm font-bold text-slate-300 leading-none">{service.cliente}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🕒</span>
                <div>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Horario</div>
                  <div className="text-sm font-bold text-slate-300 leading-none">{service.horario}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">⏳</span>
                <div>
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Duración</div>
                  <div className="text-sm font-bold text-slate-300 leading-none">{service.duracion}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Proceso del servicio</span>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  {service.tasks.filter(t => t.status === 'completed').length} / {service.tasks.length} tareas
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {service.tasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3 group/task cursor-pointer">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      task.status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : task.status === 'in-progress'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}>
                      {task.status === 'completed' && <span className="text-[10px]">✓</span>}
                      {task.status === 'in-progress' && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${
                      task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-300 group-hover/task:text-white'
                    }`}>
                      {task.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3">
              <span>▶️</span> Continuar servicio
            </button>
            <button className="flex-1 bg-transparent border-2 border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">
              Marcar como completado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentService;
