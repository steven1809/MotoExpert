import React, { Component } from 'react';
import { API_BASE_URL } from '../apiConfig';

class EmpleadoHistorial extends Component {
  constructor(props) {
    super(props);
    this.state = {
      citas: [],
      loading: true,
      filtroEstado: 'todas', // 'todas', 'finalizadas', 'canceladas'
      fechaDesde: '',
      fechaHasta: '',
      busqueda: '',
      paginaActual: 1,
      itemsPorPagina: 9,
    };
  }

  componentDidMount() {
    this.fetchCitas();
  }

  fetchCitas = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const responseData = await response.json();
        const data = Array.isArray(responseData) ? responseData : (responseData.data ?? []);
        console.log('Citas recibidas:', data);
        const citasFiltradas = data.filter(c => ['FINALIZADO', 'CANCELADO', 'CANCELADA'].includes(c.estado));
        console.log('Citas historial:', citasFiltradas);
        this.setState({ citas: citasFiltradas, loading: false });
      }
    } catch (err) {
      console.error('Error:', err);
      this.setState({ loading: false });
    }
  };

  getCitasFiltradas = () => {
    let citas = [...this.state.citas];
    const { filtroEstado, fechaDesde, fechaHasta, busqueda } = this.state;

    // Filtro por estado
    if (filtroEstado === 'finalizadas') {
      citas = citas.filter(c => c.estado === 'FINALIZADO');
    } else if (filtroEstado === 'canceladas') {
      citas = citas.filter(c => ['CANCELADO', 'CANCELADA'].includes(c.estado));
    }

    // Filtro por fechas
    if (fechaDesde) {
      citas = citas.filter(c => c.fecha >= fechaDesde);
    }
    if (fechaHasta) {
      citas = citas.filter(c => c.fecha <= fechaHasta);
    }

    // Búsqueda por nombre de cliente
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      citas = citas.filter(c => 
        (c.usuario?.nombre || '').toLowerCase().includes(busquedaLower)
      );
    }

    return citas;
  };

  getCitasPaginas = () => {
    const citasFiltradas = this.getCitasFiltradas();
    const { paginaActual, itemsPorPagina } = this.state;
    const indiceInicial = (paginaActual - 1) * itemsPorPagina;
    const indiceFinal = indiceInicial + itemsPorPagina;
    return citasFiltradas.slice(indiceInicial, indiceFinal);
  };

  getTotalPaginas = () => {
    return Math.ceil(this.getCitasFiltradas().length / this.state.itemsPorPagina);
  };

  cambiarPagina = (pagina) => {
    this.setState({ paginaActual: pagina });
  };

  formatDuration = (minutos) => {
    if (!minutos) return "N/A";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const minsRestantes = minutos % 60;
    return minsRestantes > 0 ? `${horas}h ${minsRestantes}m` : `${horas} horas`;
  };

  render() {
    const { loading, filtroEstado, fechaDesde, fechaHasta, busqueda, paginaActual } = this.state;
    const citasPaginas = this.getCitasPaginas();
    const totalPaginas = this.getTotalPaginas();
    const totalCitas = this.getCitasFiltradas().length;

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando historial...</span>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto p-6 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 italic bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Historial de Servicios
          </h1>
          <p className="text-slate-500">
            Mostrando {((paginaActual - 1) * 9) + 1} - {Math.min(paginaActual * 9, totalCitas)} de {totalCitas} resultados
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Búsqueda
              </label>
              <input
                type="text"
                placeholder="Buscar por cliente..."
                value={busqueda}
                onChange={(e) => this.setState({ busqueda: e.target.value, paginaActual: 1 })}
                className="w-full h-11 rounded-2xl bg-slate-950/50 border border-slate-800/50 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => this.setState({ filtroEstado: e.target.value, paginaActual: 1 })}
                className="w-full h-11 rounded-2xl bg-slate-950/50 border border-slate-800/50 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              >
                <option value="todas">Todas</option>
                <option value="finalizadas">Finalizadas</option>
                <option value="canceladas">Canceladas</option>
              </select>
            </div>

            {/* Fecha desde */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Fecha desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => this.setState({ fechaDesde: e.target.value, paginaActual: 1 })}
                className="w-full h-11 rounded-2xl bg-slate-950/50 border border-slate-800/50 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Fecha hasta */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Fecha hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => this.setState({ fechaHasta: e.target.value, paginaActual: 1 })}
                className="w-full h-11 rounded-2xl bg-slate-950/50 border border-slate-800/50 px-4 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Tarjetas */}
        {citasPaginas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {citasPaginas.map(cita => (
                <div
                  key={cita.id}
                  className={`relative bg-slate-900 border ${cita.estado === 'FINALIZADO' ? 'border-emerald-500/30' : 'border-red-500/30'} p-6 rounded-3xl shadow-xl transition-all duration-300 hover:border-blue-500/50 group`}
                >
                  {/* Icono de estado */}
                  <div className="absolute -top-3 right-6">
                    {cita.estado === 'FINALIZADO' ? (
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                        <span className="text-emerald-400">✅</span>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Finalizada</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                        <span className="text-red-400">❌</span>
                        <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">Cancelada</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 mb-4">
                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight mb-1">
                      {cita.servicio?.nombre}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 italic">
                      {cita.servicio?.descripcion || "Sin descripción disponible."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center space-x-3 text-slate-300 mb-2">
                        <span className="text-lg">📅</span>
                        <span className="text-xs font-black uppercase tracking-tight">
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
                            <span className="text-sm font-black">{cita.hora_inicio?.substring(0, 5)}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Duración: {this.formatDuration(cita.servicio?.duracion)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-slate-400">
                      <span className="text-xl">
                        {cita.vehiculo?.tipo?.toLowerCase() === 'carro' ? '🚗' : '🏍️'}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Vehículo</span>
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

                    <div className="flex items-center space-x-3 text-slate-400">
                      <span className="text-xl">👤</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cliente</span>
                        <span className="text-sm font-bold text-slate-200">{cita.usuario?.nombre}</span>
                      </div>
                    </div>

                    {/* Detalles específicos */}
                    {cita.estado === 'FINALIZADO' && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-emerald-400">💰</span>
                          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Precio</span>
                        </div>
                        <span className="text-xl font-black text-white">
                          ${cita.servicio?.precio?.toLocaleString() || '0'}
                        </span>
                        
                        {cita.completedAt && cita.hora_inicio && (
                          <div className="mt-3 pt-3 border-t border-emerald-500/10">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">⏱️</span>
                              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">
                                Tiempo real: {cita.hora_inicio?.substring(0, 5)} - {cita.hora_fin?.substring(0, 5) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {['CANCELADO', 'CANCELADA'].includes(cita.estado) && (
                      <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
                        {cita.motivo_cancelacion && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400">📝</span>
                              <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">Motivo</span>
                            </div>
                            <span className="text-sm font-bold text-white">{cita.motivo_cancelacion}</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-400">👤</span>
                            <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">
                              Cancelado por: {cita.usuario?.nombre ? 'Cliente' : 'Empleado'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => this.cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="h-11 w-11 rounded-2xl bg-slate-900 border border-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800/50 transition-colors flex items-center justify-center"
                >
                  ←
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => this.cambiarPagina(pagina)}
                    className={`h-11 w-11 rounded-2xl border transition-colors flex items-center justify-center text-sm font-black ${
                      pagina === paginaActual
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    {pagina}
                  </button>
                ))}
                <button
                  onClick={() => this.cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="h-11 w-11 rounded-2xl bg-slate-900 border border-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800/50 transition-colors flex items-center justify-center"
                >
                  →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
            <div className="text-4xl mb-4 grayscale opacity-30">📋</div>
            <p className="font-bold uppercase tracking-widest text-sm">No hay servicios en el historial</p>
          </div>
        )}
      </div>
    );
  }
}

export default EmpleadoHistorial;
