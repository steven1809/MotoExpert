import React from 'react';

const NoVehicleWarning = ({ setView }) => {
  const handleRegisterVehicle = () => {
    localStorage.setItem('redirectAfterVehicle', 'citas');
    setView('vehiculos');
  };

  const handleCancel = () => {
    setView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-[#2a2d3a] p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/30">
            <svg className="w-10 h-10 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">
              Sin vehículos registrados
            </h2>
            <p className="mt-3 text-[#94A3B8] text-sm font-medium italic leading-relaxed">
              Para agendar una cita, primero debes registrar al menos un vehículo en tu perfil.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleRegisterVehicle}
              className="w-full px-8 py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563eb]/20 transition-all active:scale-95"
            >
              Registrar mi vehículo
            </button>
            <button
              onClick={handleCancel}
              className="w-full px-8 py-4 bg-[#2a2d3a] hover:bg-[#3a3d4a] text-[#94A3B8] font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-[#2a2d3a] transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoVehicleWarning;
