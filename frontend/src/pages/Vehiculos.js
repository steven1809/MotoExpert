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
              Mi Flota <span className="text-purple-500">Personal</span>
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
                <div key={v.id} className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] hover:border-purple-500/30 transition-all duration-500 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="text-8xl font-black italic tracking-tighter text-white">{v.tipo === 'Moto' ? '🏍️' : '🏎️'}</span>
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <span className="px-4 py-1.5 rounded-full bg-purple-600/10 text-purple-500 border border-purple-600/20 text-[10px] font-black uppercase tracking-widest">{v.tipo}</span>
                    <button onClick={() => this.handleDelete(v.id)} className="p-2 bg-red-950/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter leading-none">{v.marca}</h3>
                    <p className="text-xl font-bold text-slate-500 dark:text-[#94A3B8] uppercase italic tracking-tighter opacity-50">{v.modelo}</p>
                  </div>
                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest opacity-50">Placa</p>
                      <p className="text-slate-900 dark:text-[#F8FAFC] font-black italic">{v.placa}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest opacity-50">Serie</p>
                      <p className="text-slate-900 dark:text-[#F8FAFC] font-black italic">{v.anio}</p>
                    </div>
                  </div>
                </div>
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
