import React, { Component } from 'react';
import CustomSelect from '../components/CustomSelect';

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
      loading: true,
      
      // Registrar Vehículo
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      tipo: 'Moto',
      color: '',
      imagenFile: null,
      imagenPreview: null,
      userId: '',
      searchTerm: '',
      showQuickUser: false,
      
      // Nuevo Usuario (Quick Register)
      newUserNombre: '',
      newUserApellido: '',
      newUserTipoDoc: 'Cédula de Ciudadanía',
      newUserNumDoc: '',
      newUserTelefono: '',
      newUserEmail: '',
      
      users: [],
      placaError: '',
      
      // Programar Servicio
      servicios: [],
      vehiculos: [],
      empleados: [],
      selectedServicioId: '',
      selectedVehiculoId: '',
      selectedEmpleadoId: '',
      fechaIngreso: '',
      
      submittingVehicle: false,
      submittingAppointment: false,

      // Nuevo Servicio
      newServicioNombre: '',
      newServicioDescripcion: '',
      newServicioPrecio: '',
      newServicioDuracion: '',
      newServicioIncluye: '',
      newServicioBeneficios: '',
      submittingService: false
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
    this.fetchFormConfigs();
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
          usuarios: Array.isArray(users) ? users.length : 0,
          ingresos: 12500.50,
          vehiculosEnProceso: Array.isArray(citas) 
            ? citas.filter(c => c.estado === 'EN PROCESO').length 
            : 0,
          trabajadoresActivos: Array.isArray(users)
            ? users.filter(u => u.role?.toLowerCase() === 'empleado' || u.role?.toLowerCase() === 'trabajador').length
            : 0
        },
        users: users,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false });
    }
  };

  fetchFormConfigs = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [servRes, vehRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers }),
        fetch(`${API_BASE_URL}/empleados`, { headers })
      ]);

      this.setState({
        servicios: servRes.ok ? await servRes.json() : [],
        vehiculos: vehRes.ok ? await vehRes.json() : [],
        empleados: empRes.ok ? await empRes.json() : []
      });
    } catch (error) {
      console.error('Error fetching form configs:', error);
    }
  };

  handlePlacaChange = (e) => {
    const val = e.target.value.toUpperCase();
    this.setState({ placa: val });
  };

  handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({ 
        imagenFile: file,
        imagenPreview: URL.createObjectURL(file)
      });
    }
  };

  handleSyncVehicle = async () => {
    const { 
      placa, marca, modelo, anio, tipo, color, imagenFile,
      userId, showQuickUser, 
      newUserNombre, newUserApellido, newUserTipoDoc, newUserNumDoc, newUserTelefono, newUserEmail,
      submittingVehicle 
    } = this.state;

    if (submittingVehicle) return;

    // Validaciones básicas
    if (!placa || !marca || !modelo || !anio || !tipo || !color) {
      alert('Por favor complete todos los campos obligatorios del vehículo.');
      return;
    }

    if (!showQuickUser && !userId) {
      alert('Por favor seleccione un propietario o registre uno nuevo.');
      return;
    }

    if (showQuickUser && (!newUserNombre || !newUserApellido || !newUserNumDoc || !newUserTelefono || !newUserEmail)) {
      alert('Por favor complete todos los campos del nuevo usuario.');
      return;
    }

    this.setState({ submittingVehicle: true });
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      let finalUserId = userId;

      // 1. Registrar usuario si es necesario
      if (showQuickUser) {
        const userPayload = {
          nombre: newUserNombre,
          apellidos: newUserApellido,
          documentType: newUserTipoDoc,
          documentNumber: newUserNumDoc,
          telefono: newUserTelefono,
          email: newUserEmail,
          password: `MotoExpert${newUserNumDoc}`,
          role: 'usuario',
          aceptaTerminos: true
        };
        console.log('Registrando nuevo usuario:', userPayload);

        const userRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST', // 1. Registrar usuario si es necesario
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userPayload)
        });

        if (!userRes.ok) {
          const errorData = await userRes.json();
          console.error('Error registro usuario:', errorData);
          throw new Error(errorData.message || 'Error al registrar el nuevo usuario');
        }
        const newUser = await userRes.json();
        finalUserId = newUser.id;
      }

      // 2. Registrar/Sincronizar vehículo
      const vehicleBody = {
        placa: placa.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: parseInt(anio),
        tipo,
        color: color.trim(),
        usuarioId: parseInt(finalUserId)
      };
      console.log('Vehiculo payload:', vehicleBody);

      const checkRes = await fetch(`${API_BASE_URL}/vehiculos/placa/${placa.trim()}`, { headers });
      const existingVehicle = checkRes.ok ? await checkRes.json() : null;

      let vehicleId;
      if (existingVehicle) {
        console.log('Actualizando vehiculo existente ID:', existingVehicle.id);
        const updateRes = await fetch(`${API_BASE_URL}/vehiculos/${existingVehicle.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(vehicleBody)
        });
        if (!updateRes.ok) {
          const errorData = await updateRes.json();
          console.error('Error actualizando vehiculo:', errorData);
          throw new Error(errorData.message || 'Error al actualizar el vehículo');
        }
        vehicleId = existingVehicle.id;
      } else {
        console.log('Creando nuevo vehiculo...');
        const createRes = await fetch(`${API_BASE_URL}/vehiculos`, {
          method: 'POST',
          headers,
          body: JSON.stringify(vehicleBody)
        });
        if (!createRes.ok) {
          const errorData = await createRes.json();
          console.error('Error creando vehiculo:', errorData);
          throw new Error(errorData.message || 'Error al crear el vehículo');
        }
        const newVehicle = await createRes.json();
        vehicleId = newVehicle.id;
      }

      // 3. Subir imagen si existe (opcional, no bloquea)
      if (imagenFile && vehicleId) {
        try {
          console.log('Subiendo imagen para vehiculo ID:', vehicleId);
          const formData = new FormData();
          formData.append('file', imagenFile);
          const uploadRes = await fetch(`${API_BASE_URL}/vehiculos/${vehicleId}/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (!uploadRes.ok) console.warn('La subida de imagen falló pero el vehículo se guardó.');
        } catch (imgErr) {
          console.error('Error subiendo imagen:', imgErr);
        }
      }

      alert('Vehículo y propietario procesados correctamente.');
      this.setState({
        placa: '', marca: '', modelo: '', anio: new Date().getFullYear(),
        tipo: 'Moto', color: '', imagenFile: null, imagenPreview: null,
        userId: '', searchTerm: '', showQuickUser: false,
        newUserNombre: '', newUserApellido: '', newUserTipoDoc: 'Cédula de Ciudadanía', 
        newUserNumDoc: '', newUserTelefono: '', newUserEmail: ''
      });
      this.fetchDashboardData();
      this.fetchFormConfigs();
    } catch (error) {
      console.error('Error general en handleSyncVehicle:', error);
      alert(error.message);
    } finally {
      this.setState({ submittingVehicle: false });
    }
  };

  getFilteredUsers = () => {
    const { searchTerm, users } = this.state;
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.nombre?.toLowerCase().includes(term) || 
      u.apellidos?.toLowerCase().includes(term) || 
      u.email?.toLowerCase().includes(term)
    ).slice(0, 5);
  };

  handleScheduleService = async () => {
    const { selectedServicioId, selectedVehiculoId, selectedEmpleadoId, fechaIngreso, submittingAppointment } = this.state;
    
    if (submittingAppointment || !selectedServicioId || !selectedVehiculoId || !fechaIngreso) {
      alert('Complete los campos obligatorios: Servicio, Unidad y Fecha.');
      return;
    }

    // Validar fecha mínima hoy
    const selectedDate = new Date(fechaIngreso);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      alert('La fecha no puede ser anterior a hoy.');
      return;
    }

    this.setState({ submittingAppointment: true });
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const body = {
        servicioId: parseInt(selectedServicioId),
        vehiculoId: parseInt(selectedVehiculoId),
        fecha: fechaIngreso,
        hora_inicio: '08:00:00', // Valor por defecto para dashboard rápido
      };

      if (selectedEmpleadoId) {
        body.empleadoId = parseInt(selectedEmpleadoId);
      }

      const res = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Servicio programado correctamente');
        this.setState({
          selectedServicioId: '',
          selectedVehiculoId: '',
          selectedEmpleadoId: '',
          fechaIngreso: ''
        });
        this.fetchDashboardData();
      } else {
        const error = await res.json();
        alert(error.message || 'Error al programar servicio');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      this.setState({ submittingAppointment: false });
    }
  };

  handleCreateService = async () => {
    const { 
      newServicioNombre, 
      newServicioDescripcion, 
      newServicioPrecio, 
      newServicioDuracion, 
      newServicioIncluye, 
      newServicioBeneficios,
      submittingService 
    } = this.state;

    if (submittingService || !newServicioNombre || !newServicioDescripcion || !newServicioPrecio || !newServicioDuracion) {
      alert('Por favor complete los campos obligatorios: Nombre, Descripción, Precio y Duración.');
      return;
    }

    this.setState({ submittingService: true });
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const body = {
        nombre: newServicioNombre,
        descripcion: newServicioDescripcion,
        precio: parseFloat(newServicioPrecio),
        duracion: parseInt(newServicioDuracion),
        incluye: newServicioIncluye,
        beneficios: newServicioBeneficios
      };

      const res = await fetch(`${API_BASE_URL}/servicios`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert('Servicio creado correctamente');
        this.setState({
          newServicioNombre: '',
          newServicioDescripcion: '',
          newServicioPrecio: '',
          newServicioDuracion: '',
          newServicioIncluye: '',
          newServicioBeneficios: ''
        });
        this.fetchFormConfigs(); // Recargar lista de servicios
      } else {
        const error = await res.json();
        alert(error.message || 'Error al crear el servicio');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      this.setState({ submittingService: false });
    }
  };

  render() {
    const { 
      stats, 
      loading, 
      placa, 
      marca,
      modelo,
      anio,
      tipo,
      color,
      imagenPreview,
      userId, 
      searchTerm,
      showQuickUser,
      newUserNombre,
      newUserApellido,
      newUserTipoDoc,
      newUserNumDoc,
      newUserTelefono,
      newUserEmail,
      users, 
      placaError,
      servicios,
      vehiculos,
      empleados,
      selectedServicioId,
      selectedVehiculoId,
      selectedEmpleadoId,
      fechaIngreso,
      submittingVehicle,
      submittingAppointment,
      newServicioNombre,
      newServicioDescripcion,
      newServicioPrecio,
      newServicioDuracion,
      newServicioIncluye,
      newServicioBeneficios,
      submittingService
    } = this.state;

    const filteredUsers = this.getFilteredUsers();
    const selectedUser = users.find(u => u.id === parseInt(userId));
    
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
           
            <h1 className="text-5xl md:text-6xl font-black text-[#F8FAFC] italic uppercase tracking-tighter mb-4">
              CONTROL <span className="text-[#2563EB]">ADMINISTRATIVO</span>
            </h1>
            
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Usuarios</div>
            <div className="mt-2 text-3xl font-black text-white">{stats.usuarios}</div>
          </div>
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Ingresos</div>
            <div className="mt-2 text-3xl font-black text-white">${stats.ingresos}</div>
          </div>
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">En proceso</div>
            <div className="mt-2 text-3xl font-black text-white">{stats.vehiculosEnProceso}</div>
          </div>
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Empleados</div>
            <div className="mt-2 text-3xl font-black text-white">{stats.trabajadoresActivos}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* CARD REGISTRAR VEHÍCULO */}
          <div className="bg-[#0B1220] border border-white/5 rounded-[2.5rem] p-8 transition-all duration-500">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-[#2563EB]/40">
                <span className="text-white font-bold">V</span>
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Registrar Vehículo
              </h2>
            </div>
            
            <div className="space-y-6">
              {/* Grid de campos de vehículo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Marca</label>
                  <input 
                    placeholder="Ej: Yamaha" 
                    value={marca}
                    onChange={(e) => this.setState({ marca: e.target.value })}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Modelo</label>
                  <input 
                    placeholder="Ej: MT-07" 
                    value={modelo}
                    onChange={(e) => this.setState({ modelo: e.target.value })}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Año</label>
                  <input 
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={anio}
                    onChange={(e) => this.setState({ anio: e.target.value })}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Tipo</label>
                  <select 
                    value={tipo}
                    onChange={(e) => this.setState({ tipo: e.target.value })}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Carro">Carro</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Placa</label>
                  <input 
                    placeholder="ABC-123" 
                    value={placa}
                    onChange={this.handlePlacaChange}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold uppercase placeholder:text-[#475569] outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Color</label>
                  <input 
                    placeholder="Ej: Rojo" 
                    value={color}
                    onChange={(e) => this.setState({ color: e.target.value })}
                    className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
                <div>
                   <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Imagen del Vehículo</label>
                   <div className="relative h-[46px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={this.handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full h-full border border-dashed border-white/20 rounded-2xl flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all">
                        <span className="text-[10px] font-bold text-slate-500">
                          {this.state.imagenFile ? 'Imagen seleccionada' : 'Seleccionar imagen...'}
                        </span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Vista previa de imagen */}
              {imagenPreview && (
                <div className="mt-2 flex justify-center">
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img src={imagenPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => this.setState({ imagenFile: null, imagenPreview: null })}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500/80"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              )}

              <hr className="border-white/5" />

              {/* Búsqueda de Propietario */}
              <div className="relative">
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Propietario (Buscar Usuario)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Nombre o email..."
                      value={selectedUser ? `${selectedUser.nombre} ${selectedUser.apellidos}` : searchTerm}
                      readOnly={!!selectedUser}
                      onChange={(e) => this.setState({ searchTerm: e.target.value, userId: '' })}
                      className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                    />
                    {selectedUser && (
                      <button 
                        onClick={() => this.setState({ userId: '', searchTerm: '' })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown de resultados de búsqueda */}
                {!selectedUser && searchTerm && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {filteredUsers.length > 0 ? (
                      <>
                        {filteredUsers.map(u => (
                          <button 
                            key={u.id}
                            onClick={() => this.setState({ userId: u.id, searchTerm: '', showQuickUser: false })}
                            className="w-full px-5 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                          >
                            <div className="text-sm font-bold text-white">{u.nombre} {u.apellidos}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-5 py-3 text-sm text-slate-500 italic">No se encontraron resultados</div>
                    )}
                    <button 
                      onClick={() => this.setState({ showQuickUser: true, searchTerm: '' })}
                      className="w-full px-5 py-4 bg-[#2563EB]/10 text-[#2563EB] text-[10px] font-black uppercase tracking-widest hover:bg-[#2563EB]/20 transition-all"
                    >
                      + Registrar nuevo usuario
                    </button>
                  </div>
                )}
              </div>

              {/* Sección de Registro Rápido de Usuario */}
              {showQuickUser && (
                <div className="p-6 bg-[#1a1f2e] border border-[#2563EB]/20 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.4em]">NUEVO USUARIO</h3>
                    <button 
                      onClick={() => this.setState({ showQuickUser: false })}
                      className="text-slate-500 hover:text-white transition-colors"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      placeholder="Nombre" 
                      value={newUserNombre}
                      onChange={(e) => this.setState({ newUserNombre: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-sm font-bold outline-none focus:border-[#2563EB]/50"
                    />
                    <input 
                      placeholder="Apellido" 
                      value={newUserApellido}
                      onChange={(e) => this.setState({ newUserApellido: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-sm font-bold outline-none focus:border-[#2563EB]/50"
                    />
                    <CustomSelect 
                      value={newUserTipoDoc}
                      onChange={(val) => this.setState({ newUserTipoDoc: val })}
                      options={[
                        { value: 'Cédula de Ciudadanía', label: 'Cédula de Ciudadanía' },
                        { value: 'Cédula de Extranjería', label: 'Cédula de Extranjería' },
                        { value: 'Pasaporte', label: 'Pasaporte' }
                      ]}
                      placeholder="Tipo de documento"
                    />
                    <input 
                      placeholder="Número de Documento" 
                      value={newUserNumDoc}
                      onChange={(e) => this.setState({ newUserNumDoc: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-sm font-bold outline-none focus:border-[#2563EB]/50"
                    />
                    <input 
                      placeholder="Teléfono" 
                      value={newUserTelefono}
                      onChange={(e) => this.setState({ newUserTelefono: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-sm font-bold outline-none focus:border-[#2563EB]/50"
                    />
                    <input 
                      placeholder="Correo Electrónico" 
                      value={newUserEmail}
                      onChange={(e) => this.setState({ newUserEmail: e.target.value })}
                      className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white text-sm font-bold outline-none focus:border-[#2563EB]/50"
                    />
                  </div>
                  
                  <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5">
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Contraseña generada</div>
                    <div className="text-white font-bold">{newUserNumDoc ? `MotoExpert${newUserNumDoc}` : '[Esperando número de documento]'}</div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={this.handleSyncVehicle}
                disabled={submittingVehicle}
                className={`w-full py-5 ${submittingVehicle ? 'bg-[#2563EB]/50' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'} text-white font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-[#2563EB]/30 transition-all font-black mt-4`}
              >
                {submittingVehicle ? 'SINCRONIZANDO...' : 'SINCRONIZAR UNIDAD'}
              </button>
            </div>
          </div>

          {/* CARD PROGRAMAR SERVICIO */}
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
                <CustomSelect 
                  value={selectedServicioId}
                  onChange={(val) => this.setState({ selectedServicioId: val })}
                  options={servicios.map(s => ({
                    value: s.id,
                    label: `${s.nombre} - $${s.precio}`,
                    sublabel: s.categoria
                  }))}
                  placeholder="Seleccione el tratamiento..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Unidad Asignada
                  </label>
                  <CustomSelect 
                    value={selectedVehiculoId}
                    onChange={(val) => this.setState({ selectedVehiculoId: val })}
                    options={vehiculos.map(v => ({
                      value: v.id,
                      label: `${v.placa} – ${v.usuario?.nombre}`,
                      sublabel: `${v.marca} ${v.modelo}`
                    }))}
                    placeholder="Placa..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Fecha de Ingreso
                  </label>
                  <input 
                    type="date" 
                    value={fechaIngreso}
                    onChange={(e) => this.setState({ fechaIngreso: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#2563EB]/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Empleado Asignado
                </label>
                <CustomSelect 
                  value={selectedEmpleadoId}
                  onChange={(val) => this.setState({ selectedEmpleadoId: val })}
                  options={[
                    { value: '', label: 'Sin asignar (Auto-asignación)' },
                    ...empleados.map(e => ({
                      value: e.id,
                      label: `${e.usuario?.nombre} (${e.cargo || 'Técnico'})`,
                      sublabel: e.especialidad
                    }))
                  ]}
                  placeholder="Seleccionar empleado..."
                />
              </div>

              <button 
                onClick={this.handleScheduleService}
                disabled={submittingAppointment}
                className={`w-full py-5 ${submittingAppointment ? 'bg-[#8B5CF6]/50' : 'bg-[#8B5CF6] hover:bg-[#7C3AED]'} text-white font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-[#8B5CF6]/30 transition-all font-black`}
              >
                {submittingAppointment ? 'PROGRAMANDO...' : 'PROGRAMAR SERVICIO'}
              </button>
            </div>
          </div>

          {/* CARD GESTIONAR SERVICIOS */}
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-8 lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-[#10B981]/40">
                <span className="text-white font-bold">S</span>
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Agregar Nuevo Servicio
              </h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Nombre del Servicio</label>
                    <input 
                      placeholder="Ej: Lavado Premium" 
                      value={newServicioNombre}
                      onChange={(e) => this.setState({ newServicioNombre: e.target.value })}
                      className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#10B981]/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Descripción</label>
                    <textarea 
                      placeholder="Descripción detallada del servicio..." 
                      value={newServicioDescripcion}
                      onChange={(e) => this.setState({ newServicioDescripcion: e.target.value })}
                      className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#10B981]/50 transition-all min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Precio ($)</label>
                      <input 
                        type="number"
                        placeholder="0.00" 
                        value={newServicioPrecio}
                        onChange={(e) => this.setState({ newServicioPrecio: e.target.value })}
                        className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#10B981]/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Duración (min)</label>
                      <input 
                        type="number"
                        placeholder="60" 
                        value={newServicioDuracion}
                        onChange={(e) => this.setState({ newServicioDuracion: e.target.value })}
                        className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#10B981]/50 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">¿Qué incluye? (Separa con comas)</label>
                    <textarea 
                      placeholder="Ej: Lavado de motor, Polichado, Limpieza de rines..." 
                      value={newServicioIncluye}
                      onChange={(e) => this.setState({ newServicioIncluye: e.target.value })}
                      className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#10B981]/50 transition-all min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">Beneficios (Separa con comas)</label>
                    <textarea 
                      placeholder="Ej: Mayor brillo, Protección UV, Acabado profesional..." 
                      value={newServicioBeneficios}
                      onChange={(e) => this.setState({ newServicioBeneficios: e.target.value })}
                      className="w-full px-5 py-3.5 bg-black/30 border border-white/5 rounded-2xl text-white font-bold placeholder:text-[#475569] outline-none focus:border-[#10B981]/50 transition-all min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={this.handleCreateService}
                disabled={submittingService}
                className={`w-full py-5 ${submittingService ? 'bg-[#10B981]/50' : 'bg-[#10B981] hover:bg-[#059669]'} text-white font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-[#10B981]/30 transition-all font-black`}
              >
                {submittingService ? 'CREANDO...' : 'CREAR SERVICIO'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminDashboard;
