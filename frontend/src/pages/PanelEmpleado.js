import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const PanelEmpleado = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCitasEmpleado();
  }, []);

  const fetchCitasEmpleado = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    try {
      // En una implementación real, el backend debería filtrar por el empleado vinculado al usuario
      const response = await fetch(`${API_BASE_URL}/citas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Filtramos solo las citas pendientes o en proceso de este empleado
        // Y ordenamos cronológicamente (fecha y luego hora)
        const filteredAndSorted = data
          .filter(c => c.estado !== 'FINALIZADO')
          .sort((a, b) => {
            if (a.fecha !== b.fecha) {
              return new Date(a.fecha) - new Date(b.fecha);
            }
            return a.hora_inicio.localeCompare(b.hora_inicio);
          })
          .map(cita => ({
            ...cita,
            esHoy: cita.fecha.split('T')[0] === today
          }));

        setCitas(filteredAndSorted);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateEstadoCita = async (id, nuevoEstado) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/citas/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (response.ok) {
        fetchCitasEmpleado();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <div className="p-8 text-white">Cargando servicios...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-white mb-10 italic">Panel de Servicios - Empleado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {citas.map(cita => (
          <div 
            key={cita.id} 
            className={`relative bg-slate-900 border ${cita.esHoy ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500/30' : 'border-slate-800'} p-6 rounded-3xl shadow-xl transition-all duration-300 hover:border-blue-500/50`}
          >
            {/* Badge de HOY */}
            {cita.esHoy && (
              <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-pulse tracking-widest uppercase">
                Hoy
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                cita.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {cita.estado}
              </span>
              <span className="text-slate-600 text-[10px] font-bold uppercase tracking-tighter">ID #{cita.id}</span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
              {cita.servicio?.nombre}
            </h3>
            
            <div className="space-y-4 mb-8">
              {/* Información de Fecha y Hora */}
              <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50 flex flex-col space-y-2">
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="text-lg">📅</span>
                  <span className="text-xs font-bold uppercase tracking-tight">
                    {new Date(cita.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-blue-400">
                  <span className="text-lg">⏰</span>
                  <span className="text-sm font-black">{cita.hora_inicio.substring(0, 5)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-400 group/item">
                <span className="text-xl">🏍️</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Vehículo</span>
                  <span className="text-sm font-bold text-slate-200">{cita.vehiculo?.placa} - {cita.vehiculo?.marca} {cita.vehiculo?.modelo}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-400 group/item">
                <span className="text-xl">👤</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cliente</span>
                  <span className="text-sm font-bold text-slate-200">{cita.usuario?.nombre}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {cita.estado === 'PENDIENTE' ? (
                <button 
                  onClick={() => updateEstadoCita(cita.id, 'EN PROCESO')}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                >
                  Iniciar Servicio
                </button>
              ) : (
                <button 
                  onClick={() => updateEstadoCita(cita.id, 'FINALIZADO')}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-green-600/20"
                >
                  Finalizar Servicio
                </button>
              )}
            </div>
          </div>
        ))}

        {citas.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
            No tienes servicios pendientes asignados.
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelEmpleado;
