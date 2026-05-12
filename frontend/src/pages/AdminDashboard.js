import React, { Component } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  renderStatCard = (title, value, icon, colorClass) => (
    <div className="bg-[#111827] border border-white/5 p-8 rounded-[2rem] shadow-2xl hover:border-[#2563EB]/30 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#2563EB]/5 rounded-full blur-2xl group-hover:bg-[#2563EB]/10 transition-colors" />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="w-12 h-12 bg-[#020617] rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/5">{icon}</div>
        <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] opacity-50 italic">Live Data</span>
      </div>
      <p className="text-[#94A3B8] text-xs font-black mb-2 uppercase tracking-widest italic">{title}</p>
      <h4 className={`text-4xl font-black italic tracking-tighter ${colorClass} relative z-10`}>
        {typeof value === 'number' && title.includes('Ingresos') ? `$${value.toLocaleString()}` : value}
      </h4>
    </div>
  );

  render() {
    const { stats, incomeData, serviceStatusData, loading, vehiculoForm, citaForm, servicios, misVehiculos, disponibilidad } = this.state;
    const COLORS = ['#2563EB', '#3b82f6', '#60a5fa'];

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#020617]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div></div>;

    return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-[#020617]">
        <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-white/5 mx-6 mt-6 bg-[#111827]">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-block px-4 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em]">System Overview</div>
            <h1 className="text-4xl md:text-6xl font-black text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
              Control <span className="text-[#2563EB]">Administrativo</span>
            </h1>
            <p className="text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Monitoreo de métricas críticas y gestión global del ecosistema MotoExpert.</p>
          </div>
        </header>

        <div className="container mx-auto px-6 space-y-12">
          {/* GESTIÓN UNIFICADA PREMIUM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div id="registro-vehiculo" className="bg-[#111827] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <h2 className="text-2xl font-black text-[#F8FAFC] mb-8 flex items-center italic uppercase tracking-tighter">
                <span className="bg-[#2563EB] w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-sm font-black text-white shadow-lg shadow-[#2563EB]/20">V</span>
                Registrar Vehículo
              </h2>
              <form className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Placa Identificadora</label>
                    <input name="placa" value={vehiculoForm.placa} onChange={this.handleVehiculoInputChange} placeholder="ABC-123" className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] outline-none focus:border-[#2563EB]/50 transition-all font-bold uppercase tracking-widest placeholder:opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Tipo de Unidad</label>
                    <select name="tipo" value={vehiculoForm.tipo} onChange={this.handleVehiculoInputChange} className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] outline-none focus:border-[#2563EB]/50 transition-all font-bold">
                      <option value="Moto">Motosport</option>
                      <option value="Auto">Premium Car</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-95">Sincronizar Unidad</button>
              </form>
            </div>

            <div id="agendar-cita" className="bg-[#111827] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <h2 className="text-2xl font-black text-[#F8FAFC] mb-8 flex items-center italic uppercase tracking-tighter">
                <span className="bg-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-sm font-black text-white shadow-lg shadow-purple-600/20">C</span>
                Programar Servicio
              </h2>
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Nivel de Detailing</label>
                  <select name="servicioId" value={citaForm.servicioId} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold">
                    <option value="">Seleccione el tratamiento...</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Unidad Asignada</label>
                    <select name="vehiculoId" value={citaForm.vehiculoId} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold">
                      <option value="">Placa...</option>
                      {misVehiculos.map(v => <option key={v.id} value={v.id}>{v.placa}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Fecha de Ingreso</label>
                    <input type="date" name="fecha" value={citaForm.fecha} onChange={this.handleCitaInputChange} className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 bg-[#020617] rounded-2xl border border-white/5">
                  {disponibilidad.filter(slot => slot.disponible).map(slot => (
                    <button key={slot.hora} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${citaForm.hora_inicio === slot.hora ? 'bg-[#2563EB] border-[#2563EB] text-white' : 'bg-[#111827] border-white/5 text-[#94A3B8] hover:border-white/20'}`}>
                      {slot.hora.substring(0, 5)}
                    </button>
                  ))}
                </div>
                <button className={`w-full py-5 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${citaForm.hora_inicio ? 'bg-gradient-to-r from-[#2563EB] to-purple-600 text-white shadow-2xl shadow-[#2563EB]/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>Confirmar Agenda VIP</button>
              </div>
            </div>
          </div>

          {/* ADMIN STATS REDISEÑADOS */}
          <div className="space-y-8 pt-10">
            <div className="flex items-center space-x-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <h3 className="text-xl font-black text-[#F8FAFC] italic uppercase tracking-[0.3em]">Métricas de Rendimiento</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {this.renderStatCard('Usuarios VIP', stats.usuarios, '👥', 'text-blue-500')}
              {this.renderStatCard('Revenue Total', stats.ingresos, '💰', 'text-emerald-500')}
              {this.renderStatCard('Active Units', stats.vehiculosEnProceso, '🏎️', 'text-amber-500')}
              {this.renderStatCard('Staff Activo', stats.trabajadoresActivos, '🛠️', 'text-purple-500')}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
              <div className="bg-[#111827] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl h-[450px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <div className="text-8xl font-black italic uppercase tracking-tighter">Growth</div>
                </div>
                <h2 className="text-xl font-black text-[#F8FAFC] mb-10 italic uppercase tracking-tighter relative z-10 flex items-center">
                  <span className="w-2 h-2 bg-[#2563EB] rounded-full mr-3 animate-pulse" />
                  Ingresos Mensuales
                </h2>
                <div className="h-[280px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Bar dataKey="ingresos" fill="#2563EB" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#111827] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl h-[450px] relative overflow-hidden">
                <h2 className="text-xl font-black text-[#F8FAFC] mb-10 italic uppercase tracking-tighter flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                  Status de Operaciones
                </h2>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={serviceStatusData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                        {serviceStatusData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-6">
                  {serviceStatusData.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">{item.name}</span>
                    </div>
                  ))}
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
