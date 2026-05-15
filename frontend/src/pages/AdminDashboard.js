import React, { Component } from 'react';

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
      loading: true
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

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
          usuarios: 13,
          ingresos: 12500.50,
          vehiculosEnProceso: 0,
          trabajadoresActivos: users.filter(u => u.role?.toUpperCase() === 'EMPLEADO').length
        },
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  render() {
    const { stats, loading } = this.state;
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#020617]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#020617] p-6">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-slate-900 to-[#111827] rounded-[3rem] p-12 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              SYSTEM OVERVIEW
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#F8FAFC] italic uppercase tracking-tighter mb-4">
              CONTROL <span className="text-[#2563EB]">ADMINISTRATIVO</span>
            </h1>
            <p className="text-[#94A3B8] max-w-2xl mx-auto">
              Monitoreo de métricas críticas y gestión global del ecosistema MotoExpert.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-[#2563EB]/40">
                <span className="text-white font-bold">V</span>
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Registrar Vehículo
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Placa Identificadora
                  </label>
                  <input 
                    placeholder="ABC-123" 
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold uppercase placeholder:text-[#475569] outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Tipo de Unidad
                  </label>
                  <select 
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  >
                    <option>Motosport</option>
                    <option>Auto</option>
                  </select>
                </div>
              </div>
              
              <button className="w-full py-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-[#2563EB]/30 transition-all font-black">
                SINCRONIZAR UNIDAD
              </button>
            </div>
          </div>

          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-[#8B5CF6]/40">
                <span className="text-white font-bold">C</span>
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Programar Servicio
              </h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Nivel de Detailing
                </label>
                <select 
                  className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                >
                  <option>Seleccione el tratamiento...</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Unidad Asignada
                  </label>
                  <select 
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  >
                    <option>Placa...</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Fecha de Ingreso
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  />
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
