import React, { Component } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class AdminDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        usuarios: 0,
        ingresos: 0,
        vehiculosEnProceso: 0,
        trabajadoresActivos: 0
      },
      displayStats: {
        usuarios: 0,
        ingresos: 0,
        vehiculosEnProceso: 0,
        trabajadoresActivos: 0
      },
      incomeData: [
        { name: 'Ene', ingresos: 4000 },
        { name: 'Feb', ingresos: 3000 },
        { name: 'Mar', ingresos: 2000 },
        { name: 'Abr', ingresos: 2780 },
        { name: 'May', ingresos: 1890 },
      ],
      serviceStatusData: [
        { name: 'Pendiente', value: 0 },
        { name: 'En Proceso', value: 0 },
        { name: 'Finalizado', value: 0 },
      ],
      loading: true,
      vehiculoForm: { marca: '', modelo: '', anio: '', placa: '', color: '', tipo: 'Moto' },
      citaForm: { fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '' },
      servicios: [],
      misVehiculos: [],
      disponibilidad: [],
      loadingSlots: false,
    };
    this.revealObserver = null;
    this.countAnim = null;
  }

  componentDidMount() {
    this.fetchDashboardData();
    this.fetchInitialFormData();
    this.setupReveal();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.loading && !this.state.loading) {
      this.setupReveal();
      this.animateStats(this.state.stats);
    }
  }

  componentWillUnmount() {
    if (this.revealObserver) this.revealObserver.disconnect();
    if (this.countAnim) cancelAnimationFrame(this.countAnim);
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

  animateStats = (target) => {
    const start = performance.now();
    const from = { ...this.state.displayStats };
    const to = { ...target };
    const duration = 900;

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      const next = {
        usuarios: Math.round(from.usuarios + (to.usuarios - from.usuarios) * eased),
        ingresos: Math.round(from.ingresos + (to.ingresos - from.ingresos) * eased),
        vehiculosEnProceso: Math.round(from.vehiculosEnProceso + (to.vehiculosEnProceso - from.vehiculosEnProceso) * eased),
        trabajadoresActivos: Math.round(from.trabajadoresActivos + (to.trabajadoresActivos - from.trabajadoresActivos) * eased),
      };

      this.setState({ displayStats: next });
      if (t < 1) this.countAnim = requestAnimationFrame(step);
    };

    if (this.countAnim) cancelAnimationFrame(this.countAnim);
    this.countAnim = requestAnimationFrame(step);
  };

  fetchInitialFormData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [serviciosRes, vehiculosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers })
      ]);
      if (serviciosRes.ok && vehiculosRes.ok) {
        const [serviciosData, vehiculosData] = await Promise.all([
          serviciosRes.json(),
          vehiculosRes.json()
        ]);
        this.setState({ servicios: serviciosData, misVehiculos: vehiculosData });
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [usersRes, citasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth`, { headers }),
        fetch(`${API_BASE_URL}/citas`, { headers })
      ]);
      const users = usersRes.ok ? await usersRes.json() : [];
      const citas = citasRes.ok ? await citasRes.json() : [];
      
      this.setState({
        stats: {
          usuarios: users.length,
          ingresos: 12500.50,
          vehiculosEnProceso: citas.filter(c => c.estado === 'EN PROCESO').length,
          trabajadoresActivos: users.filter(u => u.role?.toUpperCase() === 'EMPLEADO').length
        },
        serviceStatusData: [
          { name: 'Pendiente', value: citas.filter(c => c.estado === 'PENDIENTE').length || 1 },
          { name: 'En Proceso', value: citas.filter(c => c.estado === 'EN PROCESO').length || 1 },
          { name: 'Finalizado', value: citas.filter(c => c.estado === 'FINALIZADO').length || 1 },
        ],
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  handleVehiculoInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({ vehiculoForm: { ...prevState.vehiculoForm, [name]: value } }));
  };

  handleCitaInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      citaForm: { ...prevState.citaForm, [name]: value, ...(name === 'fecha' || name === 'servicioId' ? { hora_inicio: '' } : {}) }
    }), () => {
      if ((name === 'fecha' || name === 'servicioId') && this.state.citaForm.fecha && this.state.citaForm.servicioId) {
        this.fetchDisponibilidad(this.state.citaForm.fecha, this.state.citaForm.servicioId);
      }
    });
  };

  fetchDisponibilidad = async (fecha, servicioId) => {
    this.setState({ loadingSlots: true });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/citas/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) this.setState({ disponibilidad: await res.json() });
    } finally {
      this.setState({ loadingSlots: false });
    }
  };

  renderStatCard = (index, label, value, meta) => {
    const isPrimary = index === 0;
    const bg = isPrimary ? 'bg-[var(--mx-blue)] text-white border-[var(--mx-blue)]' : 'bg-white text-[var(--mx-text)] border-[var(--mx-border)]';
    const leftBorder = isPrimary ? '' : 'border-l-[3px] border-l-[var(--mx-blue)]';
    const metaColor = isPrimary ? 'text-[rgba(255,255,255,0.72)]' : 'text-[var(--mx-text-2)]';

    return (
      <div data-reveal className={`mx-reveal mx-card ${bg} ${leftBorder} p-6`}>
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className={`mx-subtitle text-[11px] tracking-[0.22em] uppercase ${metaColor}`}>{label}</div>
            <div className={`mt-2 mx-h1 text-[56px] leading-none ${isPrimary ? 'text-white' : 'text-[var(--mx-text)]'}`}>
              {label === 'Ingresos' ? `$${Number(value || 0).toLocaleString()}` : value}
            </div>
            <div className={`mt-3 text-[12px] tracking-[0.18em] uppercase ${metaColor}`}>{meta}</div>
          </div>

          <div className={`mx-subtitle text-[12px] tracking-[0.22em] uppercase ${isPrimary ? 'text-white' : 'text-[var(--mx-blue)]'}`}>
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { displayStats, incomeData, serviceStatusData, loading, vehiculoForm, citaForm, servicios, misVehiculos, disponibilidad, loadingSlots } = this.state;
    const COLORS = ['#0047FF', '#4D8AFF', '#001ADB'];

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
      <div className="mx-container py-10 space-y-12">
        <section data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8 mx-diagonal-cut overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Administración</div>
              <h1 className="mx-h1 text-[72px] sm:text-[86px] text-[var(--mx-text)]">
                CONTROL<br />
                <span className="text-[var(--mx-blue)]">OPERATIVO</span>
              </h1>
              <div className="mt-4 text-[14px] text-[var(--mx-text-2)] max-w-[70ch]">
                Métricas, flujo y agenda. Un tablero diseñado como columna editorial: limpio, directo, verificable.
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="flex items-start justify-between border-t border-t-[var(--mx-border)] pt-6">
                <div>
                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Corte del día</div>
                  <div className="mt-2 mx-h1 text-[52px] leading-none text-[var(--mx-text)]">{new Date().getDate()}</div>
                </div>
                <div className="text-right">
                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">{new Date().toLocaleString('es-CO', { month: 'long' })}</div>
                  <div className="mt-2 mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-blue)]">{new Date().getFullYear()}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {this.renderStatCard(0, 'Usuarios', displayStats.usuarios, 'Total registrados')}
          {this.renderStatCard(1, 'Ingresos', displayStats.ingresos, 'Corte simulado')}
          {this.renderStatCard(2, 'En proceso', displayStats.vehiculosEnProceso, 'Unidades activas')}
          {this.renderStatCard(3, 'Empleados', displayStats.trabajadoresActivos, 'Activos hoy')}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Registrar vehículo</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">01</div>
            </div>

            <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Placa</label>
                <input name="placa" value={vehiculoForm.placa} onChange={this.handleVehiculoInputChange} placeholder="ABC-123" className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)] tracking-[0.12em] uppercase" />
              </div>
              <div className="space-y-2">
                <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Tipo</label>
                <select name="tipo" value={vehiculoForm.tipo} onChange={this.handleVehiculoInputChange} className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)] tracking-[0.12em] uppercase">
                  <option value="Moto">Moto</option>
                  <option value="Auto">Auto</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button type="submit" className="w-full mx-btn mx-btn-primary py-4 text-[11px]">
                  Guardar
                </button>
              </div>
            </form>
          </div>

          <div data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Programar servicio</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">02</div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Servicio</label>
                <select name="servicioId" value={citaForm.servicioId} onChange={this.handleCitaInputChange} className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]">
                  <option value="">Selecciona…</option>
                  {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Vehículo</label>
                  <select name="vehiculoId" value={citaForm.vehiculoId} onChange={this.handleCitaInputChange} className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]">
                    <option value="">Placa…</option>
                    {misVehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Fecha</label>
                  <input type="date" name="fecha" value={citaForm.fecha} onChange={this.handleCitaInputChange} className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]" />
                </div>
              </div>

              <div className="mx-card bg-[var(--mx-bg-2)] border-[var(--mx-border)] p-4">
                <div className="flex items-center justify-between">
                  <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Hora</div>
                  <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--mx-text-2)]">{loadingSlots ? 'Cargando…' : `${disponibilidad.filter(s => s.disponible).length} disponibles`}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {disponibilidad.filter(slot => slot.disponible).map(slot => (
                    <button
                      key={slot.hora}
                      onClick={() => this.setState(prev => ({ citaForm: { ...prev.citaForm, hora_inicio: slot.hora } }))}
                      className={`px-4 py-2 rounded-[8px] border mx-subtitle text-[11px] tracking-[0.22em] uppercase transition-colors ${
                        citaForm.hora_inicio === slot.hora
                          ? 'bg-[var(--mx-blue)] border-[var(--mx-blue)] text-white'
                          : 'bg-white border-[var(--mx-border)] text-[var(--mx-text)] hover:border-[var(--mx-blue)]'
                      }`}
                    >
                      {slot.hora.substring(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`w-full mx-btn py-4 text-[11px] ${
                  citaForm.hora_inicio ? 'mx-btn-primary' : 'mx-btn-outline opacity-40 cursor-not-allowed'
                }`}
                disabled={!citaForm.hora_inicio}
              >
                Confirmar
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Gráfica de ingresos</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">03</div>
            </div>
            <div className="mt-8" style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={incomeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" stroke="#4A5568" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4A5568" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} itemStyle={{ color: '#05010F' }} />
                  <Bar dataKey="ingresos" fill="#0047FF" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Estado de servicios</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">04</div>
            </div>
            <div className="mt-8" style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={serviceStatusData} cx="50%" cy="50%" innerRadius={74} outerRadius={104} paddingAngle={6} dataKey="value" stroke="#FFFFFF">
                    {serviceStatusData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {serviceStatusData.map((item, i) => (
                <div key={i} className="mx-card bg-[var(--mx-bg-2)] border-[var(--mx-border)] px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text)]">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default AdminDashboard;
