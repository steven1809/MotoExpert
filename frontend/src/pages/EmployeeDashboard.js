import React, { Component } from 'react';
import ServiceCompletionModal from '../components/ServiceCompletionModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class EmployeeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      pendingServices: [],
      showCompletionModal: false,
      selectedCita: null,
      ratingsStats: { totalReviews: 0, averageRating: '0' },
    };
  }

  getStatusForService = (estado) => {
    const raw = String(estado || '').toUpperCase();
    if (raw.includes('PEND')) return 'RESERVED';
    if (raw.includes('CANCEL') || raw.includes('ERROR')) return 'CRITICAL';
    return 'STABLE';
  };

  getStatusUI = (status) => {
    if (status === 'CRITICAL') return { label: 'CRITICAL', color: '#ff4d4d', bar: '#ff4d4d' };
    if (status === 'RESERVED') return { label: 'RESERVED', color: '#94a3b8', bar: '#94a3b8' };
    return { label: 'STABLE', color: '#3ddc84', bar: '#3ddc84' };
  };

  getProgressForEstado = (estado) => {
    const raw = String(estado || '').toUpperCase();
    if (raw.includes('FINAL')) return 100;
    if (raw.includes('PROCESO')) return 68;
    if (raw.includes('PEND')) return 24;
    return 50;
  };

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
        // Fetch ratings stats if we have any services with empleado
        if (data.length > 0) {
          this.fetchRatingsStats(data[0].empleado?.id, token);
        }
      } else {
        this.setState({ loading: false });
      }
    } catch (err) {
      console.error('Error fetching pending services:', err);
      this.setState({ loading: false });
    }
  };

  fetchRatingsStats = async (empleadoId, token) => {
    if (!empleadoId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/ratings/empleado/${empleadoId}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const stats = await response.json();
        this.setState({ ratingsStats: stats });
      }
    } catch (err) {
      console.error('Error fetching ratings stats:', err);
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
        if (this.props.showToast) {
          this.props.showToast('Service started. Customer has been notified.', 'success');
        }
        this.fetchPendingServices();
      }
    } catch (err) {
      console.error('Error updating state:', err);
    }
  };

  render() {
    const { pendingServices, loading } = this.state;

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
      <>
        {this.state.showCompletionModal && this.state.selectedCita && (
          <ServiceCompletionModal
            cita={this.state.selectedCita}
            onClose={() => this.setState({ showCompletionModal: false, selectedCita: null })}
            onSuccess={() => {
              this.setState({ showCompletionModal: false, selectedCita: null });
              this.fetchPendingServices();
            }}
            showToast={this.props.showToast}
          />
        )}
        <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6 bg-slate-100 dark:bg-[#111827]">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Operational Unit</div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
              Panel de <span className="text-emerald-500">Trabajo</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Gestión de servicios activos y optimización de flujo técnico.</p>
            {/* Ratings Stats */}
            {(this.state.ratingsStats.totalReviews > 0 || parseFloat(this.state.ratingsStats.averageRating) > 0) && (
              <div className="flex items-center justify-center gap-6 mt-6 text-slate-500 dark:text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <span className="text-[#EF9F27] text-lg">★</span>
                  <span className="text-sm font-bold">{this.state.ratingsStats.averageRating}</span>
                </div>
                <div className="w-1 h-1 bg-slate-400 rounded-full" />
                <span className="text-sm font-medium">
                  {this.state.ratingsStats.totalReviews} {this.state.ratingsStats.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
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
                (() => {
                  const status = this.getStatusForService(service.estado);
                  const ui = this.getStatusUI(status);
                  const progress = this.getProgressForEstado(service.estado);
                  const fecha = service.fecha ? new Date(service.fecha).toLocaleDateString() : '-';
                  const horaInicio = service.hora_inicio ? service.hora_inicio.substring(0, 5) : '--:--';
                  const horaFin = service.hora_fin ? service.hora_fin.substring(0, 5) : '--:--';
                  return (
                    <div key={service.id} className="bg-[#131318] border border-white/[0.08] p-7 rounded-xl shadow-sm space-y-5 relative overflow-hidden">
                      <div className="absolute top-5 right-5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.12em] border border-white/[0.08]" style={{ color: ui.color }}>
                          {ui.label}
                        </span>
                      </div>

                      <div className="flex items-start gap-4 pr-20">
                        <div className="w-12 h-12 rounded-lg bg-[#0a0a0d] border border-white/[0.08] flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-[0.12em]">
                          OPS
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-white font-extrabold uppercase tracking-tight text-xl truncate">
                            {service.servicio?.nombre || 'Servicio'}
                          </h4>
                          <p className="text-slate-400 text-sm truncate">
                            {service.vehiculo?.placa || '-'} · {service.vehiculo?.modelo || 'Unidad'}
                          </p>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: ui.bar }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">DATE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{fecha}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">WINDOW</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{horaInicio} - {horaFin}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">PLATE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{service.vehiculo?.placa || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">STATE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{String(service.estado || '-')}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {service.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => this.updateEstado(service.id, 'EN PROCESO')}
                            className="w-full py-4 bg-[#3ddc84] hover:bg-[#35c777] text-slate-900 text-[10px] font-mono uppercase tracking-[0.12em] rounded-xl transition-colors active:scale-[0.99]"
                          >
                            Iniciar Servicio
                          </button>
                        )}
                        {service.estado === 'EN PROCESO' && (
                          <button
                            onClick={() => this.setState({ showCompletionModal: true, selectedCita: service })}
                            className="w-full py-4 bg-[#7b9cff] hover:bg-[#6a8cff] text-white text-[10px] font-mono uppercase tracking-[0.12em] rounded-xl transition-colors active:scale-[0.99]"
                          >
                            Finalizar Servicio
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-slate-100 dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">No se detectan servicios activos en la cola.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      </>
    );
  }
}

export default EmployeeDashboard;
