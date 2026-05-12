import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class HistorialServicios extends Component {
  constructor(props) {
    super(props);
    this.state = {
      historial: [],
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.fetchHistorial();
  }

  fetchHistorial = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}/citas?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filtramos solo las citas finalizadas para el historial
        const historial = data.filter(cita => cita.estado === 'FINALIZADO');
        this.setState({ historial, loading: false });
      } else {
        this.setState({ error: 'No se pudo cargar el historial', loading: false });
      }
    } catch (err) {
      this.setState({ error: 'Error de conexión', loading: false });
    }
  };

  render() {
    const { historial, loading, error } = this.state;

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 bg-white dark:bg-[#020617]">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent italic tracking-tighter">
            Historial de Servicios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Consulta los mantenimientos realizados a tus vehículos</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando historial...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-2xl text-red-400 text-center font-bold">
            {error}
          </div>
        ) : historial.length > 0 ? (
          <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vehículo</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Servicio</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {historial.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-600/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.hora_inicio.substring(0, 5)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-sm">
                            {item.vehiculo?.tipo === 'Auto' ? '🚗' : '🏍️'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{item.vehiculo?.placa}</div>
                            <div className="text-[10px] text-slate-500">{item.vehiculo?.marca} {item.vehiculo?.modelo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-400 transition-colors">
                          {item.servicio?.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.estado === 'FINALIZADO' 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-slate-900 dark:text-white italic">
                          ${item.servicio?.precio?.toLocaleString() || '0'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center bg-slate-100 dark:bg-slate-900/30 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-5xl mb-6 grayscale">📋</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 italic">Sin actividad reciente</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Aún no tienes servicios registrados en tu historial. ¡Agenda tu primera cita hoy!
            </p>
          </div>
        )}
      </div>
    );
  }
}

export default HistorialServicios;
