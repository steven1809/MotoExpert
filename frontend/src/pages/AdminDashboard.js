import React, { Component } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, ReferenceDot } from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
  }

  componentDidMount() {
    this.fetchDashboardData();
    this.fetchInitialFormData();
  }

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

  renderKpiCard = (label, value, icon, delta) => {
    const isPositive = delta >= 0;
    const deltaText = `${isPositive ? '+' : ''}${delta.toFixed(1)}%`;
    return (
      <div className="bg-white border border-slate-900/10 p-6 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.12em]">{label}</div>
            <div className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {value}
            </div>
            <div className={`mt-3 text-[11px] font-mono uppercase tracking-[0.12em] ${isPositive ? 'text-[#3ddc84]' : 'text-[#ff4d4d]'}`}>
              {deltaText}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#f6f7fb] border border-slate-900/10 flex items-center justify-center font-mono text-[11px] tracking-[0.25em] text-slate-700">
            {icon}
          </div>
        </div>
      </div>
    );
  };

  renderStatCard = (title, value, icon, colorClass) => (
    <div className="bg-white border border-slate-900/10 p-6 rounded-2xl shadow-sm transition-colors hover:border-slate-900/20">
      <div className="flex justify-between items-start mb-6">
        <div className="w-11 h-11 bg-[#f6f7fb] rounded-xl flex items-center justify-center border border-slate-900/10 font-mono text-[11px] tracking-[0.25em] text-slate-700">
          {icon}
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em]">Live Data</span>
      </div>
      <p className="text-[11px] font-mono text-slate-500 mb-2 uppercase tracking-[0.35em]">{title}</p>
      <h4 className={`text-4xl font-extrabold tracking-tight ${colorClass}`}>
        {typeof value === 'number' && title.toLowerCase().includes('ingres') ? `$${value.toLocaleString()}` : value}
      </h4>
    </div>
  );

  render() {
    const { stats, incomeData, serviceStatusData, loading, vehiculoForm, citaForm, servicios, misVehiculos, disponibilidad } = this.state;
    const unread = typeof this.props.unreadNotifications === 'number' ? this.props.unreadNotifications : 0;
    const lastIncome = Number(incomeData?.[incomeData.length - 1]?.ingresos || 0);
    const prevIncome = Number(incomeData?.[incomeData.length - 2]?.ingresos || 0);
    const incomeDeltaPct = prevIncome > 0 ? ((lastIncome - prevIncome) / prevIncome) * 100 : 0;
    const incomeStatus = incomeDeltaPct < -10 ? 'CRITICAL' : 'STABLE';
    const incomeStatusColor = incomeStatus === 'CRITICAL' ? '#ff4d4d' : '#3ddc84';
    const standbyCount = Number(serviceStatusData?.find(s => String(s.name).toLowerCase().includes('pend'))?.value || 0);
    const activeUnitsCount = Number(serviceStatusData?.find(s => String(s.name).toLowerCase().includes('proceso'))?.value || stats.vehiculosEnProceso || 0);
    const decommissionCount = Number(serviceStatusData?.find(s => String(s.name).toLowerCase().includes('final'))?.value || 0);
    const testCyclesCount = standbyCount + activeUnitsCount + decommissionCount;
    const trendData = (incomeData || []).map((d) => {
      const active = Math.max(0, Math.round(Number(d.ingresos || 0) / 900));
      const reserve = Math.max(0, Math.round(active * 0.6));
      return { name: d.name, active, reserve };
    });
    const peakValue = trendData.reduce((m, p) => (p.active > m ? p.active : m), -Infinity);
    const peakPoint = trendData.find((p) => p.active === peakValue) || trendData[0] || { name: '', active: 0, reserve: 0 };
    const renderPeakLabel = ({ x, y, value }) => {
      if (value == null) return null;
      const text = `MAX ${value}`;
      const width = 62;
      const height = 22;
      const padX = 10;
      const left = Number(x) - width + padX;
      const top = Number(y) - height - 14;
      return (
        <g>
          <rect x={left} y={top} width={width} height={height} rx={10} fill="#0a0a0d" stroke="rgba(255,255,255,0.12)" />
          <text x={left + 10} y={top + 14} fill="#ffffff" fontSize="10" fontWeight="800" fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace">
            {text}
          </text>
        </g>
      );
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#f6f7fb]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#7b9cff]" />
        </div>
      );
    }

    const criticalAlerts = [];
    if (incomeStatus === 'CRITICAL') {
      criticalAlerts.push({
        sector: 'FINANCE_CORE',
        description: 'Income trend is degrading beyond threshold. Escalation protocol recommended.',
        action: 'DEPLOY TEAM',
      });
    }
    if (activeUnitsCount >= 12) {
      criticalAlerts.push({
        sector: 'OPS_FLEET',
        description: 'Active units exceed safe concurrency. Rebalance workload and dispatch support.',
        action: 'ACKNOWLEDGE',
      });
    }

    const maintenanceAlerts = [
      {
        sector: 'MAINT_SCHEDULE',
        description: 'Preventive maintenance cycle running. Estimated completion pending.',
        progress: Math.min(100, Math.max(0, Math.round((decommissionCount / Math.max(1, testCyclesCount)) * 100))),
      },
      {
        sector: 'ENCRYPTION_ROTATION',
        description: 'Key rotation job in progress. Monitor system latency and authentication.',
        progress: 72,
      },
    ].slice(0, 2);

    return (
      <div className="space-y-10 pb-24 bg-[#f6f7fb] text-slate-900 font-sans">
        {(criticalAlerts.length > 0 || maintenanceAlerts.length > 0) && (
          <div className="fixed top-24 md:top-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] space-y-3">
            {criticalAlerts.map((a) => (
              <div key={`critical-${a.sector}`} className="bg-[#1a0a0a] border border-white/[0.08] border-l-[3px] border-l-[#ff4d4d] rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#ff4d4d]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17h.01" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#ff4d4d] font-mono text-[11px] uppercase tracking-[0.12em]">
                      CRITICAL ALERT: {a.sector}
                    </div>
                    <div className="mt-2 text-slate-300 text-sm leading-relaxed">
                      {a.description}
                    </div>
                    <button
                      type="button"
                      onClick={() => window.alert(`${a.action} -> ${a.sector}`)}
                      className="mt-4 w-full h-11 rounded-xl bg-[#ff4d4d] hover:bg-[#e64545] text-white font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                    >
                      {a.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {maintenanceAlerts.map((a) => (
              <div key={`maint-${a.sector}`} className="bg-[#131318] border border-white/[0.08] border-l-[3px] border-l-[#f6c453] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-slate-200 font-mono text-[11px] uppercase tracking-[0.12em]">
                      MAINTENANCE: {a.sector}
                    </div>
                    <div className="mt-2 text-slate-300 text-sm leading-relaxed">
                      {a.description}
                    </div>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] uppercase tracking-[0.12em]">
                    {Math.round(a.progress)}%
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-[#f6c453]" style={{ width: `${Math.round(a.progress)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <header className="mx-6 mt-6 space-y-6">
          <div className="bg-white border border-slate-900/10 rounded-2xl px-8 py-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500">Dashboard</div>
                <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  TACTICAL_CORE <span className="text-slate-400">{"//"}</span> ANALYTICS_V1
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-[360px]">
                  <input
                    type="text"
                    placeholder="QUERY_SYSTEM..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#0a0a0d] border border-white/[0.08] text-slate-100 placeholder:text-slate-500 font-mono text-[11px] uppercase tracking-[0.12em] outline-none focus:border-[#7b9cff]/70 focus:ring-2 focus:ring-[#7b9cff]/20"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21l-4.35-4.35" />
                      <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
                    </svg>
                  </div>
                </div>

                <button
                  type="button"
                  className="relative w-11 h-11 rounded-xl bg-[#0a0a0d] border border-white/[0.08] text-slate-100 flex items-center justify-center hover:border-[#7b9cff]/60 transition-colors"
                  aria-label="Notifications"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#ff4d4d] text-white text-[10px] font-mono leading-5 text-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {this.renderKpiCard('Usuarios', stats.usuarios, 'USR', 4.2)}
            {this.renderKpiCard('Ingresos', `$${Number(stats.ingresos || 0).toLocaleString()}`, 'REV', 2.1)}
            {this.renderKpiCard('En Proceso', stats.vehiculosEnProceso, 'WIP', -1.3)}
            {this.renderKpiCard('Empleados', stats.trabajadoresActivos, 'OPS', 0.8)}
          </div>
        </header>

        <div className="container mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div id="registro-vehiculo" className="bg-white border border-slate-900/10 p-10 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-slate-500">Registro</div>
                  <h2 className="text-2xl font-extrabold tracking-tight uppercase mt-2">Registrar Vehículo</h2>
                </div>
                <div className="w-11 h-11 rounded-xl border border-slate-900/10 bg-[#7b9cff]/10 flex items-center justify-center font-mono text-[11px] tracking-[0.25em] text-[#7b9cff]">
                  VH
                </div>
              </div>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em] ml-1">Placa Identificadora</label>
                    <input name="placa" value={vehiculoForm.placa} onChange={this.handleVehiculoInputChange} placeholder="ABC-123" className="w-full p-4 bg-[#f6f7fb] border border-slate-900/10 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#7b9cff]/40 focus:border-[#7b9cff] transition-all font-semibold uppercase tracking-widest placeholder:text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em] ml-1">Tipo de Unidad</label>
                    <select name="tipo" value={vehiculoForm.tipo} onChange={this.handleVehiculoInputChange} className="w-full p-4 bg-[#f6f7fb] border border-slate-900/10 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#7b9cff]/40 focus:border-[#7b9cff] transition-all font-semibold">
                      <option value="Moto">Moto</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-[#7b9cff] hover:bg-[#6a8cff] text-white font-mono text-[11px] uppercase tracking-[0.35em] rounded-xl transition-colors active:scale-[0.99]">
                  Guardar
                </button>
              </form>
            </div>

            <div id="agendar-cita" className="bg-white border border-slate-900/10 p-10 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-6 mb-8">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-slate-500">Agenda</div>
                  <h2 className="text-2xl font-extrabold tracking-tight uppercase mt-2">Programar Servicio</h2>
                </div>
                <div className="w-11 h-11 rounded-xl border border-slate-900/10 bg-[#7b9cff]/10 flex items-center justify-center font-mono text-[11px] tracking-[0.25em] text-[#7b9cff]">
                  SC
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em] ml-1">Servicio</label>
                  <select name="servicioId" value={citaForm.servicioId} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#f6f7fb] border border-slate-900/10 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#7b9cff]/40 focus:border-[#7b9cff] transition-all font-semibold">
                    <option value="">Seleccione…</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em] ml-1">Vehículo</label>
                    <select name="vehiculoId" value={citaForm.vehiculoId} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#f6f7fb] border border-slate-900/10 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#7b9cff]/40 focus:border-[#7b9cff] transition-all font-semibold">
                      <option value="">Placa…</option>
                      {misVehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.35em] ml-1">Fecha</label>
                    <input type="date" name="fecha" value={citaForm.fecha} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#f6f7fb] border border-slate-900/10 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-[#7b9cff]/40 focus:border-[#7b9cff] transition-all font-semibold" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 bg-[#f6f7fb] rounded-xl border border-slate-900/10">
                  {disponibilidad.filter(slot => slot.disponible).map(slot => (
                    <button
                      key={slot.hora}
                      type="button"
                      className={`px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-[0.35em] border transition-colors ${
                        citaForm.hora_inicio === slot.hora
                          ? 'bg-[#7b9cff] border-[#7b9cff] text-white'
                          : 'bg-white border-slate-900/10 text-slate-600 hover:border-slate-900/20'
                      }`}
                    >
                      {slot.hora.substring(0, 5)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={`w-full py-4 font-mono text-[11px] uppercase tracking-[0.35em] rounded-xl transition-colors ${
                    citaForm.hora_inicio
                      ? 'bg-[#3ddc84] hover:bg-[#35c777] text-slate-900'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-2">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-900/10" />
              <h3 className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.35em]">Métricas de Rendimiento</h3>
              <div className="h-px flex-1 bg-slate-900/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {this.renderStatCard('Usuarios', stats.usuarios, 'USR', 'text-[#7b9cff]')}
              {this.renderStatCard('Ingresos', stats.ingresos, 'REV', 'text-slate-900')}
              {this.renderStatCard('En Proceso', stats.vehiculosEnProceso, 'WIP', 'text-slate-900')}
              {this.renderStatCard('Empleados', stats.trabajadoresActivos, 'OPS', 'text-slate-900')}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
              <div className="bg-[#131318] border border-white/[0.08] p-10 rounded-2xl shadow-sm h-[450px]">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-[11px] font-mono text-slate-200 uppercase tracking-[0.12em]">Ingresos Mensuales</h2>
                  <span
                    className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] px-3 py-1 rounded-full border border-white/[0.08]"
                    style={{ color: incomeStatusColor }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: incomeStatusColor }} />
                    {incomeStatus}
                  </span>
                </div>
                <div className="h-[275px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(148,163,184,0.9)" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(148,163,184,0.9)" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0a0a0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 18px 36px rgba(0,0,0,0.35)' }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 800, fontSize: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                      />
                      <Bar
                        dataKey="ingresos"
                        fill="rgba(100,120,255,0.60)"
                        stroke="rgba(100,120,255,0.92)"
                        strokeWidth={2}
                        radius={[10, 10, 2, 2]}
                        barSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="px-4 py-3 rounded-xl bg-[#0a0a0d] border border-white/[0.08]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">ACTIVE_UNITS</div>
                    <div className="mt-1 text-lg font-extrabold text-slate-100">{activeUnitsCount}</div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-[#0a0a0d] border border-white/[0.08]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">STANDBY</div>
                    <div className="mt-1 text-lg font-extrabold text-slate-100">{standbyCount}</div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-[#0a0a0d] border border-white/[0.08]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">DECOMMISSION</div>
                    <div className="mt-1 text-lg font-extrabold text-slate-100">{decommissionCount}</div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-[#0a0a0d] border border-white/[0.08]">
                    <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">TEST_CYCLES</div>
                    <div className="mt-1 text-lg font-extrabold text-slate-100">{testCyclesCount}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a0a0d] border border-white/[0.08] p-10 rounded-2xl shadow-sm h-[450px]">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-[11px] font-mono text-slate-200 uppercase tracking-[0.12em]">Tendencia de Operación</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">Activo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7b9cff]" />
                      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">Reserva</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="activeAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(148,163,184,0.9)" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} />
                      <YAxis stroke="rgba(148,163,184,0.9)" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#131318', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 18px 36px rgba(0,0,0,0.35)' }}
                        itemStyle={{ color: '#e2e8f0', fontWeight: 800, fontSize: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="active" stroke="#ffffff" strokeWidth={2} fill="url(#activeAreaFill)" dot={false} />
                      <Line type="monotone" dataKey="reserve" stroke="#7b9cff" strokeWidth={2} dot={false} />
                      {peakPoint?.name && (
                        <ReferenceDot
                          x={peakPoint.name}
                          y={peakPoint.active}
                          r={6}
                          fill="#ffffff"
                          stroke="#ffffff"
                          isFront
                          label={renderPeakLabel}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminDashboard;
