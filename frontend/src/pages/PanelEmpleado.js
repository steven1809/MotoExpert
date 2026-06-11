import React, { Component } from 'react';

import { API_BASE_URL } from '../apiConfig';

class PanelEmpleado extends Component {
  constructor(props) {
    super(props);
    this.state = {
      citas: [],
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchCitasEmpleado();
  }

  fetchCitasEmpleado = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const responseData = await response.json();
        const data = Array.isArray(responseData) ? responseData : (responseData.data ?? []);
        
        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Filtramos solo las citas pendientes o en proceso de este empleado
        // Y ordenamos cronológicamente (fecha y luego hora)
        const filteredAndSorted = data
          .filter(c => !['FINALIZADO', 'CANCELADO', 'CANCELADA'].includes(c.estado))
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

        this.setState({ citas: filteredAndSorted, loading: false });
      }
    } catch (err) {
      console.error('Error:', err);
      this.setState({ loading: false });
    }
  };

  updateEstadoCita = async (id, nuevoEstado) => {
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
        this.fetchCitasEmpleado();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  formatDuration = (minutos) => {
    if (!minutos) return "N/A";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;
    return minsRestantes > 0 ? `${horas}h ${minsRestantes}m` : `${horas} horas`;
  };

  handleVerSeguimiento = (citaId) => {
    try {
      window.history.pushState({}, '', `/employee/service-tracking/${citaId}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {}
  };

  render() {
    const { citas, loading } = this.state;

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando servicios...</span>
      </div>
    );

    return (
      <>
        <div className="w-full px-4 md:px-8 p-6 animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold text-white mb-10 italic bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Panel de Servicios - Empleado
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {citas.map(cita => (
            <div 
              key={cita.id} 
              className={`relative bg-slate-900 border ${cita.esHoy ? 'border-blue-500 shadow-blue-500/20 ring-1 ring-blue-500/30' : 'border-slate-800'} p-6 rounded-3xl shadow-xl transition-all duration-300 hover:border-blue-500/50 group`}
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
              
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight mb-1">
                  {cita.servicio?.nombre}
                </h3>
                {/* Detalle del Servicio: Descripción debajo del título */}
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">
                  {cita.servicio?.descripcion || "Sin descripción disponible."}
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                {/* Información de Fecha, Hora y Duración */}
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex flex-col space-y-3">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-blue-400">
                      <span className="text-lg">⏰</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black">{cita.hora_inicio.substring(0, 5)}</span>
                        {/* Duración: Junto a la hora */}
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          ⏳ {this.formatDuration(cita.servicio?.duracion)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-400 group/item">
                  <span className="text-xl">
                    {cita.vehiculo?.tipo?.toLowerCase() === 'carro' ? '🚗' : '🏍️'}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Vehículo</span>
                      {/* Tipo de Vehículo: Etiqueta explícita */}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        cita.vehiculo?.tipo?.toLowerCase() === 'carro' 
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      } uppercase tracking-tighter`}>
                        {cita.vehiculo?.tipo || 'Moto'}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-200">{cita.vehiculo?.placa} - {cita.vehiculo?.marca} {cita.vehiculo?.modelo}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-400 group/item">
                  <span className="text-xl">👤</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cliente</span>
                    <span className="text-sm font-bold text-slate-200">
                      {cita.usuario?.nombre}
                      {cita.esGuest && (
                        <span className="ml-2 text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                          Guest
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!cita.esGuest && (
                  <button
                    onClick={() => this.handleVerSeguimiento(cita.id)}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                  >
                    VER SEGUIMIENTO
                  </button>
                )}

                {cita.estado === 'PENDIENTE' && (
                  <button
                    onClick={() => this.updateEstadoCita(cita.id, 'EN PROCESO')}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                  >
                    {cita.esGuest ? 'Iniciar Servicio (Rápido)' : 'Iniciar Servicio'}
                  </button>
                )}

                {cita.esGuest && cita.estado === 'EN PROCESO' && (
                  <button
                    onClick={() => this.updateEstadoCita(cita.id, 'FINALIZADO')}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                  >
                    Finalizar Servicio
                  </button>
                )}
              </div>
            </div>
          ))}

          {citas.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
              <div className="text-4xl mb-4 grayscale opacity-30">🏁</div>
              <p className="font-bold uppercase tracking-widest text-sm">No tienes servicios pendientes asignados.</p>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }
}

export default PanelEmpleado;
