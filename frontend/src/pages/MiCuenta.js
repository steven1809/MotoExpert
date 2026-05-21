import React, { Component } from 'react';
import correoIcon from '../assets/iconos/correo.png';
import telefonoIcon from '../assets/iconos/telefono.png';
import ubicacionIcon from '../assets/iconos/ubicacion.png';
import editarIcon from '../assets/iconos/editar.png';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class MiCuenta extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: localStorage.getItem('userName') || 'Carlos Ramirez',
      email: localStorage.getItem('userEmail') || 'carlos.ramirez@gmail.com',
      telefono: '+57 300 123 4567',
      direccion: 'Calle 10 #32 - 45, Medellín, Colombia',
      fotoPerfil: null,
      vehiculos: [],
      selectedVehiculoId: null,
      activeTab: 'info',
      isEditing: false,
      editNombre: '',
      editTelefono: '',
      editDireccion: '',
      saving: false,
      errorMessage: '',
      successMessage: '',
    };
  }

  componentDidMount() {
    this.fetchVehiculos();
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

  startEditing = () => {
    this.setState({
      isEditing: true,
      editNombre: this.state.nombre,
      editTelefono: this.state.telefono,
      editDireccion: this.state.direccion,
      errorMessage: '',
      successMessage: '',
    });
  };

  cancelEditing = () => {
    this.setState({
      isEditing: false,
      editNombre: '',
      editTelefono: '',
      editDireccion: '',
      errorMessage: '',
    });
  };

  saveChanges = async () => {
    const { editNombre, editTelefono, editDireccion } = this.state;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    this.setState({ saving: true, errorMessage: '', successMessage: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: editNombre,
          telefono: editTelefono,
          direccion: editDireccion,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        // Update localStorage
        localStorage.setItem('userName', updatedUser.nombre);
        // Update component state
        this.setState({
          nombre: updatedUser.nombre,
          telefono: updatedUser.telefono,
          direccion: updatedUser.direccion,
          isEditing: false,
          saving: false,
          successMessage: 'Información actualizada correctamente!',
        });
        // Clear success message after a few seconds
        setTimeout(() => this.setState({ successMessage: '' }), 4000);
      } else {
        const errorData = await response.json();
        this.setState({
          saving: false,
          errorMessage: errorData.message || 'Error al actualizar la información',
        });
      }
    } catch (err) {
      this.setState({
        saving: false,
        errorMessage: 'Error de conexión con el servidor',
      });
      console.error('Error al guardar cambios:', err);
    }
  };

  handleEditChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  render() {
    const { 
      nombre, 
      email, 
      telefono, 
      direccion, 
      fotoPerfil, 
      vehiculos, 
      activeTab,
      isEditing,
      editNombre,
      editTelefono,
      editDireccion,
      saving,
      errorMessage,
      successMessage,
    } = this.state;

    // Mock stats
    const stats = [
      { label: 'Vehículos registrados', value: '3', icon: '🚗' },
      { label: 'Citas realizadas', value: '12', icon: '📅' },
      { label: 'Puntos acumulados', value: '850', icon: '⭐' },
      { label: 'Reseñas publicadas', value: '8', icon: '💬' },
    ];

    // Mock main vehicle
    const mainVehicle = vehiculos[0] || {
      marca: 'Mazda',
      modelo: 'CX-5',
      anio: 2022,
      placa: 'ABC-123',
      km: '15,000 km'
    };

    // Mock payment methods
    const paymentMethods = [
      { type: 'visa', last4: '4582', default: true },
      { type: 'mastercard', last4: '9120', default: false },
    ];

    // Mock recent activity
    const recentActivity = [
      { title: 'Lavado Premium completado', time: '24 de mayo 2024 - 10:00 AM', status: 'Completada' },
      { title: 'Reseña publicada', time: '23 de mayo 2024 - 02:30 PM', status: 'Publicada' },
      { title: 'Vehículo agregado', time: '18 de mayo 2024 - 11:20 AM', status: 'Mazda CX-5 2022' },
      { title: 'Cita agendada', time: '15 de mayo 2024 - 09:00 AM', status: 'Confirmada' },
    ];

    // Mock achievements
    const achievements = [
      { title: 'Cliente frecuente', desc: '5 citas completadas', icon: '🏅' },
      { title: 'Experto en detalles', desc: '10 servicios premium', icon: '🏆' },
      { title: 'Miembro desde hace', desc: '1 año', icon: '🛡️' },
      { title: 'Amante del auto', desc: '5 vehículos registrados', icon: '💎' },
      { title: 'Dío su opinión', desc: '5 reseñas publicadas', icon: '👍' },
      { title: 'Cliente Gold', desc: 'Nivel actual', icon: '👑' },
    ];

    const sidebarItems = [
      { id: 'info', label: 'Mi información', icon: '👤' },
      { id: 'seguridad', label: 'Seguridad', icon: '🔒' },
      { id: 'vehiculos', label: 'Vehículos', icon: '🚗' },
      { id: 'pagos', label: 'Métodos de pago', icon: '💳' },
      { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
      { id: 'historial', label: 'Historial', icon: '📋' },
      { id: 'resenas', label: 'Mis reseñas', icon: '⭐' },
      { id: 'logros', label: 'Logros', icon: '🏆' },
    ];

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 min-h-screen p-4 space-y-2">
            {/* Logo or Brand */}
            <div className="mb-8 px-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">MotoExpert</span>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-2xl overflow-hidden">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white">{nombre}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Cliente Gold</div>
                </div>
                <div className="text-yellow-500">⭐</div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                850 / 1000 pts
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="w-4/5 h-full bg-[#2563eb] rounded-full"></div>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Te faltan 150 pts para llegar a <span className="text-[#7C3AED]">Cliente Platinum</span>
              </div>
            </div>

            {/* Nav Items */}
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => this.setState({ activeTab: item.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#2563eb]/10 text-[#2563eb] font-bold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}

            {/* Logout Button */}
            <div className="mt-auto pt-4">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-left transition-all">
                <span>🚪</span>
                <span className="text-sm font-bold">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            {/* Top Profile Header */}
            <div className="relative mb-8">
              <div className="h-40 bg-gradient-to-r from-[#111827] via-[#020617] to-[#111827] rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200" 
                  alt="Header" 
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
              <div className="absolute -bottom-6 left-8 flex items-end gap-6">
                <div className="w-24 h-24 bg-gray-200 dark:bg-slate-800 rounded-2xl border-4 border-white dark:border-slate-950 flex items-center justify-center text-4xl overflow-hidden shadow-lg">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{nombre}</h1>
                    <span className="text-yellow-500">⭐</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Cliente desde mayo 2023</div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <img src={correoIcon} alt="editar" className="w-5 h-5" bg="white"/><span>{email}</span>
                    <img src={telefonoIcon} alt="telefono" className="w-5 h-5" bg="white"/><span>{telefono}</span>
                    <img src={ubicacionIcon} alt="ubicacion" className="w-5 h-5" bg="white"/><span>ubicacion</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Información Personal */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Información personal
                  </h3>
                  
                  {!isEditing ? (
                    <button 
                      onClick={this.startEditing}
                      className="mb-2 flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                      <img src={editarIcon} alt="editar" className="w-5 h-5" bg="white"/><span>Editar Perfil</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={this.cancelEditing}
                        className="text-xs text-slate-500 dark:text-slate-400 font-bold"
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={this.saveChanges}
                        className="text-xs text-[#2563eb] font-bold"
                        disabled={saving}
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Nombre completo
                    </div>
                    {isEditing ? (
                      <input
                        name="editNombre"
                        type="text"
                        value={editNombre}
                        onChange={this.handleEditChange}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2563eb] transition-all"
                      />
                    ) : (
                      <div className="text-sm text-slate-900 dark:text-white font-bold">
                        {nombre}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Correo electrónico
                    </div>
                    <div className="text-sm text-[#2563eb] font-medium opacity-70">
                      {email}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Teléfono
                    </div>
                    {isEditing ? (
                      <input
                        name="editTelefono"
                        type="text"
                        value={editTelefono}
                        onChange={this.handleEditChange}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2563eb] transition-all"
                      />
                    ) : (
                      <div className="text-sm text-slate-900 dark:text-white font-medium">
                        {telefono}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">
                      Dirección
                    </div>
                    {isEditing ? (
                      <input
                        name="editDireccion"
                        type="text"
                        value={editDireccion}
                        onChange={this.handleEditChange}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#2563eb] transition-all"
                      />
                    ) : (
                      <div className="text-sm text-slate-900 dark:text-white font-medium">
                        {direccion}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehículo Principal */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Vehículo principal
                  </h3>
                  <button className="text-xs text-[#2563eb] font-bold">Ver todos</button>
                </div>
                <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden mb-4">
                  <img 
                    src="https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600" 
                    alt="Car" 
                    className="w-full h-40 object-cover"
                  />
                </div>
                <div className="text-center mb-4">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {mainVehicle.marca} {mainVehicle.modelo}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                    {mainVehicle.anio}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span className="bg-[#2563eb]/10 text-[#2563eb] px-2 py-1 rounded border border-[#2563eb]/20">
                    {mainVehicle.placa}
                  </span>
                  <span>•</span>
                  <span>{mainVehicle.km} km</span>
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Métodos de pago
                  </h3>
                  <button className="text-xs text-[#2563eb] font-bold">Gestionar</button>
                </div>
                <div className="space-y-3">
                  {paymentMethods.map((pm, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-blue-700 dark:text-blue-400">
                          {pm.type.toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {pm.type} **** {pm.last4}
                        </span>
                        {pm.default && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <button className="text-slate-400 hover:text-slate-600">
                        ⋮
                      </button>
                    </div>
                  ))}
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-sm text-[#2563eb] font-bold hover:bg-[#2563eb]/5 transition-all">
                    + Agregar método de pago
                  </button>
                </div>
              </div>

              {/* Actividad Reciente */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Actividad reciente
                  </h3>
                  <button className="text-xs text-[#2563eb] font-bold">Ver todo</button>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        activity.status === 'Completada' ? 'bg-green-500/10 text-green-500' :
                        activity.status === 'Publicada' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-gray-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {activity.status === 'Completada' ? '✅' :
                         activity.status === 'Publicada' ? '⭐' :
                         '📌'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {activity.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {activity.time}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {activity.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seguridad de la Cuenta */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Seguridad de la cuenta
                  </h3>
                  <button className="text-xs text-[#2563eb] font-bold">Gestionar</button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Contraseña
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Última actualización: 12 mar 2024
                      </div>
                    </div>
                    <button className="text-[#2563eb] text-sm font-bold">
                      ➤
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Autenticación en dos pasos
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-[#2563eb] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Huella digital
                      </div>
                    </div>
                    <div className="w-10 h-6 bg-[#2563eb] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Dispositivos activos
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        3 dispositivos
                      </div>
                    </div>
                    <button className="text-[#2563eb] text-sm font-bold">
                      ➤
                    </button>
                  </div>
                </div>
              </div>

              {/* Logros */}
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Logros
                  </h3>
                  <button className="text-xs text-[#2563eb] font-bold">Ver todos</button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {achievements.map((achievement, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">{achievement.icon}</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                        {achievement.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {achievement.desc}
                      </div>
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

export default MiCuenta;
