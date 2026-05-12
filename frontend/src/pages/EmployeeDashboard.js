import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class EmployeeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      pendingServices: [],
    };
  }

  componentDidMount() {
    this.fetchPendingServices();
  }

  fetchPendingServices = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (response.ok) {
        const data = await response.json();
        // Filter for services assigned to the employee or pending in general
        const pending = data.filter(c => c.estado === 'PENDIENTE' || c.estado === 'EN PROCESO');
        this.setState({ pendingServices: pending, loading: false });
      } else {
        this.setState({ loading: false });
      }
    } catch (err) {
      console.error('Error fetching pending services:', err);
      this.setState({ loading: false });
    }
  };

  updateEstado = async (citaId, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/${citaId}/estado`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        alert('Estado actualizado exitosamente');
        this.fetchPendingServices();
      } else {
        alert('Error al actualizar estado');
      }
    } catch (err) {
      console.error('Error updating state:', err);
      alert('Error de conexión');
    }
  };

  render() {
    const { pendingServices, loading } = this.state;

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6 bg-slate-100 dark:bg-[#111827]">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Operational Unit</div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
              Panel de <span className="text-emerald-500">Trabajo</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Gestión de servicios activos y optimización de flujo técnico.</p>
          </div>
        </header>

        <section className="container mx-auto px-6 space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-4 animate-pulse" />
              Servicios en Curso
            </h2>
            <div className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full bg-white/5 italic">
              {pendingServices.length} Unidades Activas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingServices.length > 0 ? (
              pendingServices.map(service => (
                <div key={service.id} className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] hover:border-emerald-500/30 transition-all duration-500 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6">
                    <span className="text-slate-800 text-4xl font-black italic opacity-20">#{service.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      service.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {service.estado}
                    </span>
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] uppercase italic tracking-tighter">{service.servicio?.nombre || 'Servicio'}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">{service.vehiculo?.placa}</span>
                      <span className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold uppercase tracking-widest italic">{service.vehiculo?.modelo}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-4 relative z-10">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-slate-500 dark:text-[#94A3B8] font-bold">
                        <span className="mr-2 opacity-50">📅</span>
                        {new Date(service.fecha).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-slate-900 dark:text-[#F8FAFC] font-black italic">
                        <span className="mr-2 opacity-50 text-emerald-500 font-normal">⏰</span>
                        {service.hora_inicio.substring(0, 5)} - {service.hora_fin.substring(0, 5)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    {service.estado === 'PENDIENTE' && (
                      <button 
                        onClick={() => this.updateEstado(service.id, 'EN PROCESO')}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-lg"
                      >
                        Iniciar Servicio
                      </button>
                    )}
                    {service.estado === 'EN PROCESO' && (
                      <button 
                        onClick={() => this.updateEstado(service.id, 'FINALIZADO')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95 shadow-lg"
                      >
                        Finalizar Servicio
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-slate-100 dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">No se detectan servicios activos en la cola.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }
}

export default EmployeeDashboard;
