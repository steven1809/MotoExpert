import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class Vehiculos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vehiculos: [],
      loading: true,
      error: null,
      showForm: false,
      formData: {
        marca: '',
        modelo: '',
        anio: '',
        placa: '',
        color: '',
        tipo: 'Moto' // Valor por defecto
      }
    };
  }

  getStatusForVehiculo = (vehiculo) => {
    const raw = String(vehiculo?.estado || '').toUpperCase();
    if (raw.includes('RESERV') || raw.includes('INACT')) return 'RESERVED';
    if (raw.includes('CRIT') || raw.includes('MANT')) return 'CRITICAL';
    return 'STABLE';
  };

  getStatusUI = (status) => {
    if (status === 'CRITICAL') return { label: 'CRITICAL', color: '#ff4d4d', bar: '#ff4d4d' };
    if (status === 'RESERVED') return { label: 'RESERVED', color: '#94a3b8', bar: '#94a3b8' };
    return { label: 'STABLE', color: '#3ddc84', bar: '#3ddc84' };
  };

  getProgressForStatus = (status) => {
    if (status === 'CRITICAL') return 38;
    if (status === 'RESERVED') return 56;
    return 82;
  };

  componentDidMount() {
    this.fetchVehiculos();
    this.checkPendingAction();
  }

  checkPendingAction = () => {
    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction === 'agendar_cita') {
      this.setState({ 
        showForm: true,
        error: 'Debes registrar un vehículo antes de agendar una cita.'
      });
      // Limpiar el error después de unos segundos si se desea, o dejarlo como mensaje informativo
      setTimeout(() => this.setState({ error: null }), 5000);
    }
  };

  fetchVehiculos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({ vehiculos: data, loading: false });
      } else {
        this.setState({ error: 'Error al obtener vehículos', loading: false });
      }
    } catch (err) {
      this.setState({ error: 'No se pudo conectar con el servidor', loading: false });
    }
  };

  handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este vehículo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        this.fetchVehiculos();
      } else {
        alert('Error al eliminar el vehículo');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { formData } = this.state;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        return;
      }

      const dataToSend = {
        ...formData,
        usuarioId: parseInt(userId, 10),
        anio: formData.anio ? parseInt(formData.anio, 10) : undefined
      };

      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        this.setState({
          showForm: false,
          formData: { marca: '', modelo: '', anio: '', placa: '', color: '', tipo: 'Moto' }
        });
        this.fetchVehiculos();
        alert('Vehículo registrado con éxito');

        // Verificar si hay una acción pendiente de agendamiento
        const pendingAction = localStorage.getItem('pendingAction');
        if (pendingAction === 'agendar_cita') {
          // No limpiamos pendingAction aquí, lo haremos en Citas.js
          // Pero sí redirigimos
          if (this.props.setView) {
            this.props.setView('citas');
          }
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo crear el vehículo'}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  render() {
    const { vehiculos, loading, showForm, formData, error } = this.state;

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#020617]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div></div>;

    return (
      <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6 bg-slate-100 dark:bg-[#111827]">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-block px-4 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-500 text-[10px] font-black uppercase tracking-[0.3em]">Fleet Management</div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
              Mi <span className="text-purple-500">Vehiculos</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Administra tus unidades para agilizar tus servicios premium.</p>
          </div>
        </header>

        <div className="container mx-auto px-6 space-y-12">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter flex items-center">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-4 animate-pulse" />
              Unidades Registradas
            </h2>
            <button
              onClick={() => this.setState({ showForm: !showForm })}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-purple-600/20 transition-all active:scale-95"
            >
              {showForm ? 'Cerrar Registro' : 'Añadir Unidad VIP'}
            </button>
          </div>

          {error && (
            <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-[2rem] text-red-400 text-sm font-bold italic uppercase tracking-widest text-center animate-in zoom-in duration-300">
              ⚠️ {error}
            </div>
          )}

          {/* Formulario Estilo Porsche */}
          {showForm && (
            <div className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top duration-500">
              <form onSubmit={this.handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Placa Identificadora</label>
                    <input name="placa" value={formData.placa} onChange={this.handleInputChange} placeholder="ABC-123" className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all uppercase" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Tipo de Vehículo</label>
                    <select name="tipo" value={formData.tipo} onChange={this.handleInputChange} className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all">
                      <option value="Moto">Motosport</option>
                      <option value="Auto">Premium Car</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Marca / Fabricante</label>
                    <input name="marca" value={formData.marca} onChange={this.handleInputChange} placeholder="Ej: Ducati" className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Modelo / Serie</label>
                    <input name="modelo" value={formData.modelo} onChange={this.handleInputChange} placeholder="Ej: Panigale V4" className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Año de Fabricación</label>
                    <input name="anio" type="number" value={formData.anio} onChange={this.handleInputChange} placeholder="2024" className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Color / Acabado</label>
                    <input name="color" value={formData.color} onChange={this.handleInputChange} placeholder="Ej: Rosso Corsa" className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-purple-500/50 transition-all" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-purple-600/20 transition-all active:scale-95">Sincronizar Unidad con el Perfil</button>
              </form>
            </div>
          )}

          {/* Listado de Vehículos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehiculos.length > 0 ? (
              vehiculos.map(v => (
                (() => {
                  const status = this.getStatusForVehiculo(v);
                  const ui = this.getStatusUI(status);
                  const progress = this.getProgressForStatus(status);
                  return (
                    <div key={v.id} className="bg-[#131318] border border-white/[0.08] p-7 rounded-xl shadow-sm space-y-5 relative overflow-hidden">
                      <div className="absolute top-5 right-5 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.12em] border border-white/[0.08]" style={{ color: ui.color }}>
                          {ui.label}
                        </span>
                        <button
                          onClick={() => this.handleDelete(v.id)}
                          className="w-9 h-9 rounded-xl bg-[#0a0a0d] border border-white/[0.08] text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors flex items-center justify-center"
                          aria-label="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-start gap-4 pr-20">
                        <div className="w-12 h-12 rounded-lg bg-[#0a0a0d] border border-white/[0.08] flex items-center justify-center text-white font-mono text-[11px] uppercase tracking-[0.12em]">
                          {String(v.tipo || 'Unidad').slice(0, 4)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-white font-extrabold uppercase tracking-tight text-xl truncate">
                            {v.marca || 'Vehículo'}
                          </h3>
                          <p className="text-slate-400 text-sm truncate">
                            {v.modelo || 'Sin modelo'}{v.anio ? ` · ${v.anio}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: ui.bar }} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">PLATE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.placa || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">TYPE</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.tipo || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">COLOR</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.color || '-'}</div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-[#1e1e28] border border-white/[0.08]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400">YEAR</div>
                          <div className="text-white font-semibold mt-0.5 truncate">{v.anio || '-'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-slate-100 dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">No se detectan unidades registradas en su perfil.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default Vehiculos;
