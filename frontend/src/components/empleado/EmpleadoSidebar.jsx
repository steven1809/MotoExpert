import React from 'react';

const EmpleadoSidebar = ({ employeeInfo, activeTab, setActiveTab, onLogout }) => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0d1526] border-r border-slate-800 flex flex-col z-50">
      <div className="p-8 flex flex-col items-center border-b border-slate-800/50">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-purple-500/30">
            <img 
              src={employeeInfo.foto || "https://ui-avatars.com/api/?name=" + employeeInfo.nombre + "&background=6366f1&color=fff"} 
              alt={employeeInfo.nombre}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0d1526]"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-1">{employeeInfo.nombre}</h2>
        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-3">{employeeInfo.especialidad}</p>
        <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
          Top Detailer ⭐
        </span>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
        {[
          { id: 'inicio', label: 'Inicio', icon: '🏠' },
          { id: 'citas', label: 'Mis citas', icon: '📅' },
          { id: 'servicios', label: 'Servicios asignados', icon: '🛠️' },
          { id: 'calendario', label: 'Calendario', icon: '📆' },
          { id: 'clientes', label: 'Clientes', icon: '👥' },
          { id: 'rendimiento', label: 'Mi rendimiento', icon: '📈' },
          { id: 'perfil', label: 'Mi perfil', icon: '👤' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-bold text-sm tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800/50 space-y-4">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turno actual</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 uppercase">En progreso</span>
            </span>
          </div>
          <div className="text-sm font-bold text-slate-200 mb-3">08:00 AM - 05:00 PM</div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Progreso</span>
              <span>03:15:48</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300 font-bold text-sm"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default EmpleadoSidebar;
