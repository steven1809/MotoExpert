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
      
      // Nuevos estados para refactorización Programar Servicio
      selectedVehicleType: '', // 'Moto', 'Carro', 'Camioneta'
      showServiceModal: false,
      tempService: null,
      vehicleSearchTerm: '',
      availableSlots: [],
      selectedTimeSlot: '',
      loadingSlots: false,

      // Nuevos estados para disponibilidad de especialistas
      showSpecialistModal: false,
      specialistSlotTime: '',
      appointmentsAtSelectedDate: [], // Todas las citas del día para calcular disponibilidad local
      loadingAppointments: false,

      submittingVehicle: false,
      submittingAppointment: false
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
    this.fetchFormConfigs();
  }

  componentDidUpdate(prevProps, prevState) {
    // Si cambia la fecha, cargar todas las citas de ese día para el modal de especialistas
    if (this.state.fechaIngreso && prevState.fechaIngreso !== this.state.fechaIngreso) {
      this.fetchAppointmentsByDate();
    }

    // Si cambia la fecha o el servicio o el empleado, recargar slots de disponibilidad general
    if (
      (this.state.fechaIngreso && this.state.selectedServicioId) &&
      (prevState.fechaIngreso !== this.state.fechaIngreso || 
       prevState.selectedServicioId !== this.state.selectedServicioId ||
       prevState.selectedEmpleadoId !== this.state.selectedEmpleadoId)
    ) {
      this.fetchAvailableSlots();
    }
  }

  fetchAppointmentsByDate = async () => {
    const { fechaIngreso } = this.state;
    if (!fechaIngreso) return;

    this.setState({ loadingAppointments: true });
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // Obtenemos todas las citas para verificar disponibilidad de especialistas localmente
      const res = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (res.ok) {
        const allAppointments = await res.json();
        const filtered = allAppointments.filter(a => a.fecha === fechaIngreso && a.estado !== 'CANCELADO');
        this.setState({ appointmentsAtSelectedDate: filtered, loadingAppointments: false });
      }
    } catch (error) {
      console.error('Error fetching appointments for date:', error);
      this.setState({ loadingAppointments: false });
    }
  };

  fetchAvailableSlots = async () => {
    const { fechaIngreso, selectedServicioId, selectedEmpleadoId } = this.state;
    if (!fechaIngreso || !selectedServicioId) return;

    this.setState({ loadingSlots: true });
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // Definimos los slots de negocio
      const businessSlots = [
        '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00',
        '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00'
      ];

      let url = `${API_BASE_URL}/citas/slots?fecha=${fechaIngreso}&servicioId=${selectedServicioId}`;
      if (selectedEmpleadoId) {
        url += `&empleadoId=${selectedEmpleadoId}`;
      }
      
      const res = await fetch(url, { headers });
      let finalSlots = [];
      
      if (res.ok) {
        const apiSlots = await res.json();
        // Mapeamos los slots del negocio con la disponibilidad de la API
        finalSlots = businessSlots.map(time => {
          const apiSlot = apiSlots.find(s => s.hora === time);
          return {
            hora: time,
            disponible: apiSlot ? apiSlot.disponible : true
          };
        });
      } else {
        // Fallback a slots de negocio todos disponibles si la API falla
        finalSlots = businessSlots.map(time => ({ hora: time, disponible: true }));
      }
      
      this.setState({ availableSlots: finalSlots, loadingSlots: false });
    } catch (error) {
      console.error('Error fetching slots:', error);
      this.setState({ availableSlots: [], loadingSlots: false });
    }
  };

  handleTimeSlotClick = (slot) => {
    if (!slot.disponible) return;
    this.setState({ specialistSlotTime: slot.hora, showSpecialistModal: true });
  };

  confirmTimeSlot = () => {
    this.setState({ 
      selectedTimeSlot: this.state.specialistSlotTime, 
      showSpecialistModal: false 
    });
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
      if (this.props.showToast) {
        this.props.showToast('Por favor complete todos los campos obligatorios del vehículo.', 'error');
      } else {
        alert('Por favor complete todos los campos obligatorios del vehículo.');
      }
      return;
    }

    if (!showQuickUser && !userId) {
      if (this.props.showToast) {
        this.props.showToast('Por favor seleccione un propietario o registre uno nuevo.', 'error');
      } else {
        alert('Por favor seleccione un propietario o registre uno nuevo.');
      }
      return;
    }

    if (showQuickUser && (!newUserNombre || !newUserApellido || !newUserNumDoc || !newUserTelefono || !newUserEmail)) {
      if (this.props.showToast) {
        this.props.showToast('Por favor complete todos los campos del nuevo usuario.', 'error');
      } else {
        alert('Por favor complete todos los campos del nuevo usuario.');
      }
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
          method: 'POST', 
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

      if (this.props.showToast) {
        this.props.showToast('Vehículo y propietario procesados correctamente.', 'success');
      } else {
        alert('Vehículo y propietario procesados correctamente.');
      }
      
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
      if (this.props.showToast) {
        this.props.showToast(error.message, 'error');
      } else {
        alert(error.message);
      }
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
    const { selectedServicioId, selectedVehiculoId, selectedEmpleadoId, fechaIngreso, selectedTimeSlot, submittingAppointment } = this.state;
    
    if (submittingAppointment || !selectedServicioId || !selectedVehiculoId || !fechaIngreso || !selectedTimeSlot) {
      if (this.props.showToast) {
        this.props.showToast('Complete los campos obligatorios: Servicio, Unidad, Fecha y Hora.', 'error');
      } else {
        alert('Complete los campos obligatorios: Servicio, Unidad, Fecha y Hora.');
      }
      return;
    }

    // Validar fecha mínima hoy
    const selectedDate = new Date(fechaIngreso);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      if (this.props.showToast) {
        this.props.showToast('La fecha no puede ser anterior a hoy.', 'error');
      } else {
        alert('La fecha no puede ser anterior a hoy.');
      }
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
        hora_inicio: selectedTimeSlot,
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
        if (this.props.showToast) {
          this.props.showToast('Servicio programado correctamente', 'success');
        } else {
          alert('Servicio programado correctamente');
        }
        
        this.setState({
          selectedServicioId: '',
          selectedVehiculoId: '',
          selectedEmpleadoId: '',
          fechaIngreso: '',
          selectedTimeSlot: '',
          selectedVehicleType: '',
          availableSlots: []
        });
        this.fetchDashboardData();
      } else {
        const error = await res.json();
        if (this.props.showToast) {
          this.props.showToast(error.message || 'Error al programar servicio', 'error');
        } else {
          alert(error.message || 'Error al programar servicio');
        }
      }
    } catch (error) {
      if (this.props.showToast) {
        this.props.showToast('Error de conexión', 'error');
      } else {
        alert('Error de conexión');
      }
    } finally {
      this.setState({ submittingAppointment: false });
    }
  };

  handleServiceSelect = (serviceId) => {
    const service = this.state.servicios.find(s => s.id === parseInt(serviceId));
    if (service) {
      this.setState({ tempService: service, showServiceModal: true });
    }
  };

  confirmService = () => {
    this.setState({ 
      selectedServicioId: this.state.tempService.id, 
      showServiceModal: false,
      tempService: null 
    });
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
      selectedVehicleType,
      showServiceModal,
      tempService,
      vehicleSearchTerm,
      availableSlots,
      selectedTimeSlot,
      loadingSlots,
      showSpecialistModal,
      specialistSlotTime,
      appointmentsAtSelectedDate,
      loadingAppointments,
      submittingVehicle,
      submittingAppointment
    } = this.state;

    const filteredUsers = this.getFilteredUsers();
    const selectedUser = users.find(u => u.id === parseInt(userId));

    // Filtrar servicios según tipo de vehículo seleccionado
    const filteredServices = servicios.filter(s => {
      if (!selectedVehicleType) return false;
      if (!s.tipoVehiculo) return true; // Si no tiene tipo, se asume compatible o legacy
      const types = s.tipoVehiculo.split(',').map(t => t.trim().toLowerCase());
      return types.includes(selectedVehicleType.toLowerCase());
    });

    // Filtrar vehículos según búsqueda de placa/unidad
    const filteredVehiculos = vehiculos.filter(v => {
      const search = vehicleSearchTerm.toLowerCase();
      return (
        v.placa?.toLowerCase().includes(search) ||
        v.marca?.toLowerCase().includes(search) ||
        v.modelo?.toLowerCase().includes(search)
      );
    });

    const isFormComplete = selectedServicioId && selectedVehiculoId && fechaIngreso && selectedTimeSlot;

    // Calcular disponibilidad de especialistas para el slot seleccionado
    const morningSlots = availableSlots.filter(s => parseInt(s.hora.split(':')[0]) < 13);
    const afternoonSlots = availableSlots.filter(s => parseInt(s.hora.split(':')[0]) >= 13);

    const specialistsAvailability = showSpecialistModal ? empleados.map(emp => {
      const isOccupied = appointmentsAtSelectedDate.some(app => 
        app.empleado?.id === emp.id && app.hora_inicio === specialistSlotTime
      );
      return { ...emp, isOccupied };
    }) : [];

    const anySpecialistAvailable = specialistsAvailability.some(s => !s.isOccupied);
    
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
          <div 
            onClick={() => this.props.setView('users')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Usuarios</div>
            <div className="mt-2 text-3xl font-black text-white">{stats.usuarios}</div>
          </div>
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Ingresos</div>
            <div className="mt-2 text-3xl font-black text-white">${stats.ingresos}</div>
          </div>
          <div 
            onClick={() => this.props.setView('citas')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">En proceso</div>
            <div className="mt-2 text-3xl font-black text-white">{stats.vehiculosEnProceso}</div>
          </div>
          <div 
            onClick={() => this.props.setView('users')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-300"
          >
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
              {/* PASO 1: Selector de tipo de vehículo */}
              <div>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-3">
                  Paso 1: Tipo de Vehículo
                </label>
                <div className="flex gap-3">
                  {['MOTO', 'CARRO', 'CAMIONETA'].map((type) => (
                    <button
                      key={type}
                      onClick={() => this.setState({ selectedVehicleType: type, selectedServicioId: '', selectedTimeSlot: '' })}
                      className={`flex-1 py-3 px-4 rounded-xl border transition-all duration-300 font-black text-[10px] tracking-widest ${
                        selectedVehicleType === type 
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white shadow-lg shadow-[#8B5CF6]/10' 
                        : 'border-white/10 bg-black/40 text-[#64748B] hover:border-white/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 2: Nivel de Detailing (Servicios) */}
              <div className={!selectedVehicleType ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Paso 2: Nivel de Detailing
                </label>
                <CustomSelect 
                  value={selectedServicioId}
                  onChange={this.handleServiceSelect}
                  options={filteredServices.map(s => ({
                    value: s.id,
                    label: `${s.nombre} - $${s.precio}`,
                    sublabel: s.categoria
                  }))}
                  placeholder={selectedVehicleType ? "Seleccione el tratamiento..." : "Primero elija tipo de vehículo"}
                />
              </div>
              
              <div className={`grid grid-cols-2 gap-4 ${!selectedServicioId ? 'opacity-40 pointer-events-none' : ''}`}>
                {/* PASO 3: Unidad Asignada (Searchable) */}
                <div className="relative">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Paso 3: Unidad Asignada
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Buscar placa o marca..."
                      value={selectedVehiculoId ? vehiculos.find(v => v.id === parseInt(selectedVehiculoId))?.placa : vehicleSearchTerm}
                      onChange={(e) => this.setState({ vehicleSearchTerm: e.target.value, selectedVehiculoId: '' })}
                      className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#8B5CF6]/50 transition-all"
                    />
                    {selectedVehiculoId && (
                      <button 
                        onClick={() => this.setState({ selectedVehiculoId: '', vehicleSearchTerm: '' })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown de búsqueda de vehículos */}
                  {!selectedVehiculoId && vehicleSearchTerm && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {filteredVehiculos.length > 0 ? (
                        filteredVehiculos.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => this.setState({ selectedVehiculoId: v.id, vehicleSearchTerm: '' })}
                            className="w-full px-5 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                          >
                            <div className="text-sm font-bold text-white">{v.placa}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{v.marca} {v.modelo} - {v.usuario?.nombre}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-3 text-sm text-slate-500 italic">No se encontraron unidades</div>
                      )}
                    </div>
                  )}
                </div>

                {/* PASO 4: Fecha de Ingreso */}
                <div>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Paso 4: Fecha
                  </label>
                  <input 
                    type="date" 
                    value={fechaIngreso}
                    onChange={(e) => this.setState({ fechaIngreso: e.target.value, selectedTimeSlot: '' })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#8B5CF6]/50 transition-all"
                  />
                </div>
              </div>

              {/* PASO 4 CONTINUACIÓN: Slots de Hora */}
              {fechaIngreso && selectedServicioId && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex flex-col gap-4">
                    {/* Bloque Mañana */}
                    <div>
                      <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em] mb-2 block">Mañana</label>
                      <div className="grid grid-cols-5 gap-2">
                        {morningSlots.map((slot) => (
                          <button
                            key={slot.hora}
                            onClick={() => this.handleTimeSlotClick(slot)}
                            className={`relative py-3 rounded-xl text-[11px] font-black transition-all duration-300 ${
                              selectedTimeSlot === slot.hora
                              ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                              : slot.disponible
                                ? 'bg-black/40 border border-white/5 text-white hover:border-[#8B5CF6]/50'
                                : 'bg-black/10 border border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {slot.hora.slice(0, 5)}
                            {!slot.disponible && <div className="text-[7px] font-normal uppercase tracking-tighter mt-0.5">Ocupado</div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bloque Tarde */}
                    <div>
                      <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em] mb-2 block">Tarde</label>
                      <div className="grid grid-cols-5 gap-2">
                        {afternoonSlots.map((slot) => (
                          <button
                            key={slot.hora}
                            onClick={() => this.handleTimeSlotClick(slot)}
                            className={`relative py-3 rounded-xl text-[11px] font-black transition-all duration-300 ${
                              selectedTimeSlot === slot.hora
                              ? 'bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30'
                              : slot.disponible
                                ? 'bg-black/40 border border-white/5 text-white hover:border-[#8B5CF6]/50'
                                : 'bg-black/10 border border-white/5 text-slate-600 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {slot.hora.slice(0, 5)}
                            {!slot.disponible && <div className="text-[7px] font-normal uppercase tracking-tighter mt-0.5">Ocupado</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 5: Empleado Asignado */}
              <div className={!isFormComplete ? 'opacity-40 pointer-events-none' : ''}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Paso 5: Especialista (Opcional)
                </label>
                <CustomSelect 
                  value={selectedEmpleadoId}
                  onChange={(val) => this.setState({ selectedEmpleadoId: val })}
                  options={[
                    { value: '', label: 'Auto-asignación (Primer disponible)' },
                    ...empleados.map(e => ({
                      value: e.id,
                      label: `${e.usuario?.nombre} (${e.cargo || 'Técnico'})`,
                      sublabel: e.especialidad
                    }))
                  ]}
                  placeholder="Seleccionar especialista..."
                />
              </div>

              <button 
                onClick={this.handleScheduleService}
                disabled={submittingAppointment || !isFormComplete}
                className={`w-full py-5 ${(!isFormComplete || submittingAppointment) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-xl shadow-[#8B5CF6]/30'} font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all font-black`}
              >
                {submittingAppointment ? 'PROCESANDO...' : 'PROGRAMAR SERVICIO'}
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE DETALLES DEL SERVICIO */}
        {showServiceModal && tempService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm" onClick={() => this.setState({ showServiceModal: false, tempService: null })}></div>
            <div className="relative w-full max-w-lg bg-[#0B1220] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{tempService.nombre}</h3>
                  <p className="text-[#8B5CF6] font-bold text-sm">${tempService.precio} • {tempService.duration_minutes || tempService.duracion} min</p>
                </div>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em] mb-2 block">Descripción</label>
                  <p className="text-slate-300 text-sm leading-relaxed">{tempService.descripcion}</p>
                </div>

                {tempService.incluye && (
                  <div>
                    <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em] mb-2 block">¿Qué incluye?</label>
                    <div className="flex flex-wrap gap-2">
                      {tempService.incluye.split(',').map((item, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-slate-400 font-bold border border-white/5 italic">
                          ✓ {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {tempService.beneficios && (
                  <div>
                    <label className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em] mb-2 block">Beneficios</label>
                    <div className="flex flex-wrap gap-2">
                      {tempService.beneficios.split(',').map((item, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-[#8B5CF6]/10 rounded-lg text-[10px] text-[#8B5CF6] font-bold border border-[#8B5CF6]/10 italic">
                          ✦ {item.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
                <button 
                  onClick={() => this.setState({ showServiceModal: false, tempService: null })}
                  className="py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                >
                  Elegir otro
                </button>
                <button 
                  onClick={this.confirmService}
                  className="py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#8B5CF6]/20 transition-all"
                >
                  Seleccionar este servicio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE DISPONIBILIDAD DE ESPECIALISTAS */}
        {showSpecialistModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm" onClick={() => this.setState({ showSpecialistModal: false })}></div>
            <div className="relative w-full max-w-md bg-[#0B1220] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">
                Disponibilidad para las {specialistSlotTime.slice(0, 5)}
              </h3>

              <div className="space-y-4 mb-8">
                {specialistsAvailability.map(spec => (
                  <div key={spec.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${spec.isOccupied ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {spec.usuario?.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{spec.cargo || 'Técnico'}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${spec.isOccupied ? 'text-red-500' : 'text-emerald-500'}`}>
                      {spec.isOccupied ? '✗ Ocupado' : '✓ Disponible'}
                    </span>
                  </div>
                ))}
              </div>

              {anySpecialistAvailable ? (
                <button 
                  onClick={this.confirmTimeSlot}
                  className="w-full py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-[#8B5CF6]/20 transition-all"
                >
                  Confirmar esta hora
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
                    <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                      No hay especialistas disponibles para este horario. Elige otra hora.
                    </p>
                  </div>
                  <button 
                    onClick={() => this.setState({ showSpecialistModal: false })}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AdminDashboard;
