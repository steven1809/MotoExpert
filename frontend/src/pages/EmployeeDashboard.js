import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class EmployeeDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      pendingServices: [],
    };
    this.revealObserver = null;
  }

  componentDidMount() {
    this.fetchPendingServices();
    this.setupReveal();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.loading && !this.state.loading) this.setupReveal();
  }

  componentWillUnmount() {
    if (this.revealObserver) this.revealObserver.disconnect();
  }

  setupReveal = () => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (nodes.length === 0) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add('mx-reveal--in'));
      return;
    }

    if (this.revealObserver) this.revealObserver.disconnect();
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('mx-reveal--in');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );

    nodes.forEach((n) => this.revealObserver.observe(n));
  };

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

    if (loading) {
      return (
        <div className="mx-container py-14">
          <div className="mx-card bg-white border-[var(--mx-border)] p-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mx-blue)]" />
          </div>
        </div>
      );
    }

    return (
      <div className="mx-container py-10 space-y-10">
        <section data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8 relative">
              <div className="absolute -top-10 -left-2 mx-h1 text-[140px] leading-none text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none" aria-hidden="true">
                01
              </div>
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Empleado</div>
              <h1 className="mx-h1 text-[72px] sm:text-[86px] text-[var(--mx-text)]">
                PANEL<br />
                <span className="text-[var(--mx-blue)]">TÉCNICO</span>
              </h1>
              <div className="mt-4 text-[14px] text-[var(--mx-text-2)] max-w-[70ch]">
                Cola activa y ejecución. Estados claros, botones directos, sin ruido visual.
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="mx-card bg-[var(--mx-bg-2)] border-[var(--mx-border)] p-6">
                <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Unidades activas</div>
                <div className="mt-2 mx-h1 text-[56px] leading-none text-[var(--mx-text)]">{pendingServices.length}</div>
                <div className="mt-3 h-[2px] w-20 bg-[var(--mx-blue)] opacity-25" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Servicios en curso</div>
            <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingServices.length > 0 ? (
              pendingServices.map((service, idx) => {
                const status = service.estado || 'PENDIENTE';
                const badge =
                  status === 'PENDIENTE'
                    ? 'bg-[#C08A00] text-white'
                    : status === 'EN PROCESO'
                      ? 'bg-[#0E9F6E] text-white'
                      : 'bg-[var(--mx-blue)] text-white';

                return (
                  <div key={service.id} data-reveal className="mx-reveal" style={{ transitionDelay: `${idx * 80}ms` }}>
                    <div className="mx-card mx-card-hover-up bg-white border-[var(--mx-border)] p-7">
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">
                            Orden #{service.id}
                          </div>
                          <div className="mt-2 mx-subtitle text-[14px] tracking-[0.12em] uppercase text-[var(--mx-text)] truncate">
                            {service.servicio?.nombre || 'Servicio'}
                          </div>
                          <div className="mt-2 text-[12px] text-[var(--mx-text-2)]">
                            {service.vehiculo?.placa ? `${service.vehiculo?.placa} · ${service.vehiculo?.modelo || ''}` : 'Vehículo no asignado'}
                          </div>
                        </div>
                        <div className={`px-3 py-2 rounded-[8px] mx-subtitle text-[10px] tracking-[0.22em] uppercase ${badge}`}>
                          {status}
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-t-[var(--mx-border)] pt-5">
                        <div>
                          <div className="mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Fecha</div>
                          <div className="mt-1 text-[12px] text-[var(--mx-text)]">{new Date(service.fecha).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Hora</div>
                          <div className="mt-1 text-[12px] text-[var(--mx-text)]">
                            {service.hora_inicio?.substring(0, 5)}–{service.hora_fin?.substring(0, 5)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex gap-3">
                        {status === 'PENDIENTE' && (
                          <button onClick={() => this.updateEstado(service.id, 'EN PROCESO')} className="flex-1 mx-btn mx-btn-primary py-3 text-[11px]">
                            Iniciar
                          </button>
                        )}
                        {status === 'EN PROCESO' && (
                          <>
                            <button onClick={() => this.updateEstado(service.id, 'FINALIZADO')} className="flex-1 mx-btn mx-btn-primary py-3 text-[11px]">
                              Finalizar
                            </button>
                            <button onClick={() => this.updateEstado(service.id, 'PENDIENTE')} className="flex-1 mx-btn mx-btn-outline py-3 text-[11px]">
                              Pausar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <div className="mx-card bg-white border-[var(--mx-border)] p-10 text-center">
                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Sin cola activa</div>
                  <div className="mt-3 text-[13px] text-[var(--mx-text-2)]">No se detectan servicios pendientes o en proceso.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }
}

export default EmployeeDashboard;
