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
  }

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
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo crear el vehículo'}`);
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  render() {
    const { vehiculos, loading, error, showForm, formData } = this.state;

    return (
      <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-white italic tracking-tight">Gestión de Vehículos</h1>
            <p className="text-slate-400 mt-2">Administra tu flota personal de forma sencilla</p>
          </div>
          <button 
            onClick={() => this.setState({ showForm: !showForm })}
            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 ${showForm ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
          >
            <span>{showForm ? 'Cerrar Formulario' : 'Añadir Vehículo'}</span>
            <span className="text-xl">{showForm ? '×' : '+'}</span>
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl mb-12 shadow-2xl animate-in slide-in-from-top duration-300">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center">
              <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm italic">M</span>
              Nuevo Vehículo
            </h2>
            <form onSubmit={this.handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Vehículo</label>
                <div className="flex space-x-4 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => this.setState(prev => ({ formData: { ...prev.formData, tipo: 'Auto' } }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Auto' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    🚗 Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => this.setState(prev => ({ formData: { ...prev.formData, tipo: 'Moto' } }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.tipo === 'Moto' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    🏍️ Moto
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Placa</label>
                <input name="placa" value={formData.placa} onChange={this.handleInputChange} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none uppercase font-bold text-center tracking-widest" required placeholder="ABC-123" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                <input name="marca" value={formData.marca} onChange={this.handleInputChange} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none" required placeholder="Ej: Yamaha" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                <input name="modelo" value={formData.modelo} onChange={this.handleInputChange} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none" required placeholder="Ej: MT-03" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Año</label>
                <input name="anio" type="number" value={formData.anio} onChange={this.handleInputChange} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: 2023" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Color</label>
                <input name="color" value={formData.color} onChange={this.handleInputChange} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ej: Azul Racing" />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex justify-end pt-4">
                <button type="submit" className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-600/20 transform active:scale-95 transition-all">
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">Sincronizando garaje...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-900/20 border border-red-500/20 rounded-2xl text-red-400 text-center font-bold">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculos.map((v) => (
              <div key={v.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-blue-600/50 transition-all group shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${v.tipo === 'Auto' ? 'bg-purple-600/10 text-purple-500' : 'bg-blue-600/10 text-blue-500'}`}>
                    {v.tipo === 'Auto' ? '🚗' : '🏍️'}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs font-bold text-blue-400 tracking-widest">
                      {v.placa}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${v.estado === 'ACTIVO' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                      {v.estado || 'ACTIVO'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{v.marca} {v.modelo}</h3>
                <p className="text-slate-500 text-sm mb-4">Modelo {v.anio || 'N/A'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 bg-slate-950/50 p-2 rounded-lg inline-flex">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color === 'Blanco' ? '#fff' : v.color === 'Negro' ? '#000' : v.color || '#475569' }}></span>
                    <span>{v.color || 'Color N/A'}</span>
                  </div>
                  <button 
                    onClick={() => this.handleDelete(v.id)}
                    className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default Vehiculos;
