import React, { Component } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class MiCuenta extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Estado del Perfil
      nombre: localStorage.getItem('userName') || 'Usuario Ejemplo',
      email: localStorage.getItem('userEmail') || 'usuario@motoexpert.com',
      telefono: '3001234567',
      fotoPerfil: null,
      
      // Estado de Vehículos
      vehiculos: [],
      selectedVehiculoId: null,
    };
  }

  componentDidMount() {
    this.fetchVehiculos();
    // Cargar foto desde localStorage si existe
    const savedPicture = localStorage.getItem('userPicture');
    if (savedPicture) {
      this.setState({ fotoPerfil: savedPicture });
    }
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
        // Aseguramos que cada vehículo tenga un estado inicial si no lo tiene
        const vehiculosConEstado = data.map(v => ({
          ...v,
          estado: v.estado || 'ACTIVO'
        }));
        this.setState({ vehiculos: vehiculosConEstado });
      }
    } catch (err) {
      console.error('Error al obtener vehículos:', err);
    }
  };

  // Seleccionar una tarjeta de vehículo
  handleSelectVehiculo = (id) => {
    this.setState(prevState => ({
      selectedVehiculoId: prevState.selectedVehiculoId === id ? null : id
    }));
  };

  // Función para desactivar/activar vehículo
  desactivarVehiculo = async (id) => {
    const vehiculo = this.state.vehiculos.find(v => v.id === id);
    const nuevoEstado = vehiculo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'desactivar';

    if (window.confirm(`¿Estás seguro de que deseas ${accion} este vehículo?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ estado: nuevoEstado }),
        });

        if (response.ok) {
          this.setState(prevState => ({
            vehiculos: prevState.vehiculos.map(v => 
              v.id === id ? { ...v, estado: nuevoEstado } : v
            )
          }));
        } else {
          alert('Error al actualizar el estado del vehículo');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error de conexión');
      }
    }
  };

  // Manejador genérico para inputs controlados
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  // Manejador para la subida de imagen
  handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        this.setState({ fotoPerfil: data.picture });
        localStorage.setItem('userPicture', data.picture);
        alert('Foto de perfil actualizada');
      } else {
        alert('Error al subir la imagen');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error de conexión');
    }
  };

  // Eliminar un vehículo
  handleEliminarVehiculo = async (id) => {
    if (!window.confirm('¿Deseas eliminar este vehículo?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        this.fetchVehiculos();
      }
    } catch (err) {
      alert('Error al eliminar vehículo');
    }
  };

  // Guardar cambios del perfil
  handleGuardarPerfil = async () => {
    const { nombre, email, telefono } = this.state;
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
      alert('Error: Sesión no válida');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, email, telefono }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Actualizar localStorage para que se refleje en el Navbar y otras partes
        localStorage.setItem('userName', updatedUser.nombre);
        localStorage.setItem('userEmail', updatedUser.email);
        
        alert('Perfil actualizado correctamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'No se pudo actualizar el perfil'}`);
      }
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert('Error de conexión con el servidor');
    }
  };

  render() {
    const { nombre, email, telefono, fotoPerfil, vehiculos, selectedVehiculoId } = this.state;

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        <h1 className="text-4xl font-bold text-white mb-10 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent italic">
          Configuración de Mi Cuenta
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SECCIÓN: PERFIL DE USUARIO */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">👤</span> Perfil de Usuario
              </h2>
              
              {/* Vista Previa y Subida de Imagen */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full border-4 border-blue-600/30 overflow-hidden bg-slate-900 mb-4 shadow-xl">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">
                      👤
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                  Subir Imagen
                  <input type="file" className="hidden" onChange={this.handleImageUpload} accept="image/*" />
                </label>
              </div>

              {/* Formulario de Perfil */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Nombre</label>
                  <input 
                    name="nombre" 
                    type="text" 
                    value={nombre} 
                    onChange={this.handleChange} 
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    value={email} 
                    onChange={this.handleChange} 
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1">Teléfono</label>
                  <input 
                    name="telefono" 
                    type="tel" 
                    value={telefono} 
                    onChange={this.handleChange} 
                    className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <button 
                  onClick={this.handleGuardarPerfil}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg mt-4 transform active:scale-95 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN: GESTIÓN DE VEHÍCULOS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="mr-2">🏍️</span> Mis Vehículos
              </h2>

              {/* Lista de Vehículos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {vehiculos.length > 0 ? (
                  vehiculos.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => this.handleSelectVehiculo(v.id)}
                      className={`relative bg-slate-900/80 border ${selectedVehiculoId === v.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-700'} p-4 rounded-2xl flex justify-between items-center group hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden`}
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${v.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${v.estado === 'ACTIVO' ? 'text-green-500' : 'text-slate-500'}`}>
                            {v.estado}
                          </span>
                        </div>
                        <p className="text-blue-400 font-bold text-lg">{v.placa}</p>
                        <p className="text-slate-400 text-sm">{v.modelo}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Botón de Desactivar/Activar */}
                        {selectedVehiculoId === v.id && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              this.desactivarVehiculo(v.id);
                            }}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-lg transition-all active:scale-95 shadow-lg ${
                              v.estado === 'ACTIVO' 
                                ? 'bg-slate-700 hover:bg-red-600 text-white' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {v.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                          </button>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            this.handleEliminarVehiculo(v.id);
                          }}
                          className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    No tienes vehículos registrados.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }
}

export default MiCuenta;
