import React, { Component } from 'react';
import CustomSelect from '../components/CustomSelect';

import { API_BASE_URL } from '../apiConfig';

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
      newUserNumDoc: '',
      newUserTelefono: '',
      newUserEmail: '',
      
      users: [],
      
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

      // Nuevo estado para selección de cliente
      selectedClientId: '',
      selectedPaymentMethod: '', // 'Efectivo', 'Tarjeta', 'Transferencia'
      showQR: false,
      validationErrors: {}, // Para resaltar campos faltantes

      // Nuevos estados para disponibilidad de especialistas
      showSpecialistModal: false,
      specialistSlotTime: '',
      appointmentsAtSelectedDate: [], // Todas las citas del día para calcular disponibilidad local

      submittingVehicle: false,
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

    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const res = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (res.ok) {
        const citasData = await res.json();
        const allAppointments = Array.isArray(citasData) ? citasData : (citasData.data ?? []);
        const filtered = allAppointments.filter(a => a.fecha === fechaIngreso && a.estado !== 'CANCELADO');
        this.setState({ appointmentsAtSelectedDate: filtered });
      }
    } catch (error) {
      console.error('Error fetching appointments for date:', error);
    }
  };

  fetchAvailableSlots = async () => {
    const { fechaIngreso, selectedServicioId, selectedEmpleadoId } = this.state;
    if (!fechaIngreso || !selectedServicioId) return;

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
        const apiSlots = await res.json().catch(() => []);
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
      
      this.setState({ availableSlots: finalSlots });
    } catch (error) {
      console.error('Error fetching slots:', error);
      this.setState({ availableSlots: [] });
    }
  };

  handleTimeSlotClick = (slot) => {
    if (!slot.disponible) return;
    this.setState({ specialistSlotTime: slot.hora, showSpecialistModal: true });
  };

  confirmTimeSlot = (employeeId) => {
    this.setState({ 
      selectedTimeSlot: this.state.specialistSlotTime, 
      selectedEmpleadoId: employeeId || '',
      showSpecialistModal: false,
      validationErrors: { ...this.state.validationErrors, datetime: false }
    });
  };

  fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [usersRes, empRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth`, { headers }),
        fetch(`${API_BASE_URL}/empleados`, { headers })
      ]);
      
      const users = usersRes.ok ? await usersRes.json().catch(() => []) : [];
      const employees = empRes.ok ? await empRes.json().catch(() => []) : [];
      
      this.setState({
        stats: {
          usuarios: Array.isArray(users) ? users.length : 0,
          ingresos: 12500.50,
          empleadosActivos: Array.isArray(employees) 
            ? employees.filter(e => e.estado === 'activo').length 
            : 0,
          empleadosInactivos: Array.isArray(employees)
            ? employees.filter(e => e.estado !== 'activo').length
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

      const servData = servRes.ok ? await servRes.json().catch(() => ({ data: [] })) : { data: [] };

      this.setState({
        servicios: Array.isArray(servData) ? servData : (servData.data ?? []),
        vehiculos: vehRes.ok ? await vehRes.json().catch(() => []) : [],
        empleados: empRes.ok ? await empRes.json().catch(() => []) : []
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
      newUserNombre, newUserApellido, newUserNumDoc, newUserTelefono, newUserEmail,
      submittingVehicle 
    } = this.state;

    if (submittingVehicle) return;

    // Validaciones básicas
    if (!placa || !marca || !modelo || !anio || !tipo || !color) {
      if (this.props.showToast) {
        this.props.showToast('Por favor complete todos los campos obligatorios del vehículo.', 'error');
      }
      return;
    }

    if (!showQuickUser && !userId) {
      if (this.props.showToast) {
        this.props.showToast('Por favor seleccione un propietario o registre uno nuevo.', 'error');
      }
      return;
    }

    if (showQuickUser && (!newUserNombre || !newUserApellido || !newUserNumDoc || !newUserTelefono || !newUserEmail)) {
      if (this.props.showToast) {
        this.props.showToast('Por favor complete todos los campos del nuevo usuario.', 'error');
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
          documento: newUserNumDoc,
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
          const errorData = await userRes.json().catch(() => ({ message: 'Error desconocido al registrar usuario' }));
          console.error('Error registro usuario:', errorData);
          throw new Error(errorData.message || 'Error al registrar el nuevo usuario');
        }
        const newUser = await userRes.json().catch(() => ({}));
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
      const existingVehicle = checkRes.ok ? await checkRes.json().catch(() => null) : null;

      let vehicleId;
      if (existingVehicle) {
        console.log('Actualizando vehiculo existente ID:', existingVehicle.id);
        const updateRes = await fetch(`${API_BASE_URL}/vehiculos/${existingVehicle.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(vehicleBody)
        });
        if (!updateRes.ok) {
          const errorData = await updateRes.json().catch(() => ({ message: 'Error al actualizar el vehículo' }));
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
          const errorData = await createRes.json().catch(() => ({ message: 'Error al crear el vehículo' }));
          console.error('Error creando vehiculo:', errorData);
          throw new Error(errorData.message || 'Error al crear el vehículo');
        }
        const newVehicle = await createRes.json().catch(() => ({}));
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
    const { 
      selectedServicioId, 
      selectedVehiculoId, 
      selectedEmpleadoId, 
      fechaIngreso, 
      selectedTimeSlot, 
      selectedVehicleType,
      selectedClientId,
      selectedPaymentMethod,
    } = this.state;
    
    // VALIDACIÓN DE CAMPOS OBLIGATORIOS
    const errors = {};
    let firstErrorStepId = null;

    if (!selectedVehicleType) {
      errors.vehicleType = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-1';
    }
    if (!selectedServicioId) {
      errors.service = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-2';
    }
    if (!selectedClientId) {
      errors.client = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-3';
    }
    if (!selectedVehiculoId) {
      errors.vehicle = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-4';
    }
    if (!fechaIngreso || !selectedTimeSlot) {
      errors.datetime = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-5';
    }
    if (!selectedPaymentMethod) {
      errors.payment = true;
      if (!firstErrorStepId) firstErrorStepId = 'step-6';
    }

    if (Object.keys(errors).length > 0) {
      this.setState({ validationErrors: errors });
      
      const messages = {
        vehicleType: 'Debes seleccionar el tipo de vehículo.',
        service: 'Debes elegir un nivel de detailing.',
        client: 'Debes seleccionar un cliente de la base de datos.',
        vehicle: 'Debes asignar una unidad al cliente.',
        datetime: 'Falta seleccionar la fecha y hora del servicio.',
        payment: 'Debes elegir un método de pago.'
      };

      const firstErrorKey = Object.keys(errors)[0];
      if (this.props.showToast) {
        this.props.showToast(messages[firstErrorKey], 'error');
      }

      // Scroll automático al primer error
      if (firstErrorStepId) {
        const element = document.getElementById(firstErrorStepId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    this.setState({ validationErrors: {} });
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    try {
      const body = {
        servicioId: parseInt(selectedServicioId),
        vehiculoId: parseInt(selectedVehiculoId),
        usuarioId: parseInt(selectedClientId),
        fecha: fechaIngreso,
        hora_inicio: selectedTimeSlot,
        metodoPago: selectedPaymentMethod
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
          this.props.showToast('Servicio programado correctamente. Código de entrega enviado.', 'success');
        }
        
        if (selectedPaymentMethod === 'Transferencia') {
          this.setState({ showQR: true });
        }

        this.setState({
          selectedServicioId: '',
          selectedVehiculoId: '',
          selectedEmpleadoId: '',
          fechaIngreso: '',
          selectedTimeSlot: '',
          selectedVehicleType: '',
          selectedClientId: '',
          selectedPaymentMethod: '',
          availableSlots: [],
          validationErrors: {}
        });
        this.fetchDashboardData();
      } else {
        const error = await res.json().catch(() => ({ message: 'Error al programar servicio' }));
        if (this.props.showToast) {
          this.props.showToast(error.message || 'Error al programar servicio', 'error');
        }
      }
    } catch (error) {
      if (this.props.showToast) {
        this.props.showToast('Error de conexión', 'error');
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
      newUserNumDoc,
      newUserTelefono,
      newUserEmail,
      users, 
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
      showSpecialistModal,
      specialistSlotTime,
      appointmentsAtSelectedDate,
      selectedClientId,
      selectedPaymentMethod,
      validationErrors,
      showQR,
      submittingVehicle,
    } = this.state;

    const filteredUsers = this.getFilteredUsers();
    const selectedUser = users.find(u => u.id === parseInt(userId));

    // Filtrar servicios según tipo de vehículo seleccionado
    const filteredServices = servicios.filter(s => {
      if (!selectedVehicleType) return false;
      
      const vehicleTypeLower = selectedVehicleType.toLowerCase();
      
      // El servicio de "Cadena" es exclusivo de Motos
      if (s.nombre?.toLowerCase().includes('cadena')) {
        return vehicleTypeLower === 'moto';
      }

      if (!s.tipoVehiculo) return true; // Si no tiene tipo, se asume compatible (legacy)

      const types = s.tipoVehiculo.split(',').map(t => t.trim().toLowerCase());
      
      // Mapeo flexible para Carro/Camioneta -> Auto/Carro
      if (vehicleTypeLower === 'carro' || vehicleTypeLower === 'camioneta') {
        return types.includes('carro') || types.includes('auto') || types.includes('camioneta');
      }
      
      return types.includes(vehicleTypeLower);
    });

    const isFormComplete = selectedServicioId && selectedVehiculoId && fechaIngreso && selectedTimeSlot && selectedClientId && selectedPaymentMethod;

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

    // Filtrar vehículos según cliente seleccionado (Paso 4)
    const filteredVehiculosForProgramar = vehiculos.filter(v => {
      if (selectedClientId) {
        return v.usuario?.id === parseInt(selectedClientId);
      }
      const search = vehicleSearchTerm.toLowerCase();
      return (
        v.placa?.toLowerCase().includes(search) ||
        v.marca?.toLowerCase().includes(search) ||
        v.modelo?.toLowerCase().includes(search)
      );
    });
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#020617]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#2563EB]"></div>
        </div>
      );
    }

    const userName = localStorage.getItem('userName') || 'Administrador';

    return (
      <div className="min-h-screen bg-[#020617] p-6 relative">
        <div className="mb-8">
          <div className="bg-gradient-to-br from-slate-900 to-[#111827] rounded-[3rem] p-12 text-center border border-white/5 shadow-2xl">
            <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
              Panel de Administración
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#F8FAFC] italic uppercase tracking-tighter mb-4">
              HOLA <span className="text-purple-500">{userName.split(' ')[0]}</span>
            </h1>
           
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div 
            onClick={() => this.props.setView('users')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-8 cursor-pointer hover:scale-[1.02] hover:border-purple-500/30 transition-all duration-300 group shadow-lg"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] group-hover:text-purple-400 transition-colors">Usuarios Registrados</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-black text-white italic">{stats.usuarios}</div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
            </div>
          </div>
          <div 
            onClick={() => this.props.setView('admin_empleados')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-8 cursor-pointer hover:scale-[1.02] hover:border-emerald-500/30 transition-all duration-300 group shadow-lg"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] group-hover:text-emerald-400 transition-colors">Empleados Activos</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-black text-white italic">{stats.empleadosActivos}</div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944V12m0 0l4.5 4.5M12 12l-4.5 4.5" /></svg>
              </div>
            </div>
          </div>
          <div 
            onClick={() => this.props.setView('admin_empleados')}
            className="bg-[#0B1220] border border-white/5 rounded-3xl p-8 cursor-pointer hover:scale-[1.02] hover:border-rose-500/30 transition-all duration-300 group shadow-lg"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] group-hover:text-rose-400 transition-colors">Empleados Inactivos</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-black text-white italic">{stats.empleadosInactivos}</div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
          <div className="bg-[#0B1220] border border-white/5 rounded-3xl p-8 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">Dinero Recaudado</div>
            <div className="mt-4 flex items-end justify-between">
              <div className="text-4xl font-black text-white italic">${stats.ingresos.toLocaleString()}</div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-500">
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
                    <option value="Camioneta">Camioneta</option>
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
              <div id="step-1" className={`p-1 rounded-2xl transition-all duration-300 ${validationErrors.vehicleType ? 'ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-3">
                  Paso 1: Tipo de Vehículo
                </label>
                <div className="flex gap-3">
                  {['MOTO', 'CARRO', 'CAMIONETA'].map((type) => (
                    <button
                      key={type}
                      onClick={() => this.setState({ selectedVehicleType: type, selectedServicioId: '', selectedTimeSlot: '', validationErrors: { ...validationErrors, vehicleType: false } })}
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
              <div id="step-2" className={`transition-all duration-300 ${!selectedVehicleType ? 'opacity-40 pointer-events-none' : ''} ${validationErrors.service ? 'p-1 ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Paso 2: Nivel de Detailing
                </label>
                <CustomSelect 
                  value={selectedServicioId}
                  onChange={(val) => {
                    this.handleServiceSelect(val);
                    this.setState({ validationErrors: { ...validationErrors, service: false } });
                  }}
                  options={filteredServices.map(s => ({
                    value: s.id,
                    label: `${s.nombre} - $${s.precio}`,
                    sublabel: s.categoria
                  }))}
                  placeholder={selectedVehicleType ? "Seleccione el tratamiento..." : "Primero elija tipo de vehículo"}
                />
              </div>

              {/* PASO 3: Selección de Cliente */}
              <div id="step-3" className={`relative transition-all duration-300 ${!selectedServicioId ? 'opacity-40 pointer-events-none' : ''} ${validationErrors.client ? 'p-1 ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                  Paso 3: Cliente
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Buscar cliente por nombre o email..."
                    value={selectedClientId ? users.find(u => u.id === parseInt(selectedClientId))?.nombre + ' ' + (users.find(u => u.id === parseInt(selectedClientId))?.apellidos || '') : ''}
                    onChange={(e) => {
                      this.setState({ selectedClientId: '', selectedVehiculoId: '' });
                      // Aquí podrías implementar una búsqueda local simple si es necesario
                    }}
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#8B5CF6]/50 transition-all"
                  />
                  {selectedClientId && (
                    <button 
                      onClick={() => this.setState({ selectedClientId: '', selectedVehiculoId: '' })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Dropdown de búsqueda de clientes */}
                {!selectedClientId && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden max-h-48 overflow-y-auto">
                    {/* Lista simplificada de clientes */}
                    {users.slice(0, 5).map(u => (
                      <button 
                        key={u.id}
                        onClick={() => this.setState({ selectedClientId: u.id, validationErrors: { ...validationErrors, client: false } })}
                        className="w-full px-5 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                      >
                        <div className="text-sm font-bold text-white">{u.nombre} {u.apellidos}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* PASO 4: Unidad Asignada (Searchable) */}
                <div id="step-4" className={`relative transition-all duration-300 ${!selectedClientId ? 'opacity-40 pointer-events-none' : ''} ${validationErrors.vehicle ? 'p-1 ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Paso 4: Unidad
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder={selectedClientId ? "Buscar placa..." : "Selecciona cliente primero"}
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
                  {!selectedVehiculoId && (vehicleSearchTerm || selectedClientId) && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-[#161b27] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {filteredVehiculosForProgramar.length > 0 ? (
                        filteredVehiculosForProgramar.map(v => (
                          <button 
                            key={v.id}
                            onClick={() => this.setState({ selectedVehiculoId: v.id, vehicleSearchTerm: '', validationErrors: { ...validationErrors, vehicle: false } })}
                            className="w-full px-5 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                          >
                            <div className="text-sm font-bold text-white">{v.placa}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{v.marca} {v.modelo}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-5 py-3 text-sm text-red-400 italic">
                          {selectedClientId ? "Este usuario no tiene vehículos registrados." : "No se encontraron unidades"}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PASO 5: Fecha de Ingreso */}
                <div id="step-5" className={`transition-all duration-300 ${!selectedVehiculoId ? 'opacity-40 pointer-events-none' : ''} ${validationErrors.datetime ? 'p-1 ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-2">
                    Paso 5: Fecha
                  </label>
                  <input 
                    type="date" 
                    value={fechaIngreso}
                    onChange={(e) => this.setState({ fechaIngreso: e.target.value, selectedTimeSlot: '', validationErrors: { ...validationErrors, datetime: false } })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-4 bg-black/30 border border-white/5 rounded-2xl text-white font-bold outline-none focus:border-[#8B5CF6]/50 transition-all"
                  />
                </div>
              </div>

              {/* PASO 5 CONTINUACIÓN: Slots de Hora */}
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

              {/* PASO 6: Método de Pago */}
              <div id="step-6" className={`transition-all duration-300 ${!selectedTimeSlot ? 'opacity-40 pointer-events-none' : ''} ${validationErrors.payment ? 'p-1 ring-2 ring-red-500 ring-offset-4 ring-offset-[#0B1220] rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.3)]' : ''}`}>
                <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-[0.3em] ml-1 block mb-3">
                  Paso 6: Método de Pago
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'Efectivo', label: 'Efectivo', icon: '💵' },
                    { id: 'Tarjeta', label: 'Tarjeta', icon: '💳' },
                    { id: 'Transferencia', label: 'QR', icon: '📱' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => this.setState({ selectedPaymentMethod: method.id, validationErrors: { ...validationErrors, payment: false } })}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                        selectedPaymentMethod === method.id 
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white shadow-lg shadow-[#8B5CF6]/10' 
                        : 'border-white/10 bg-black/40 text-[#64748B] hover:border-white/20'
                      }`}
                    >
                      <span className="text-xl mb-1">{method.icon}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RESUMEN DE CONFIRMACIÓN */}
              {isFormComplete && (
                <div className="p-6 bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.4em] mb-4">Resumen de Cita</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Servicio:</span>
                      <span className="text-[11px] text-white font-black">{servicios.find(s => s.id === parseInt(selectedServicioId))?.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Cliente:</span>
                      <span className="text-[11px] text-white font-black">{users.find(u => u.id === parseInt(selectedClientId))?.nombre} {users.find(u => u.id === parseInt(selectedClientId))?.apellidos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Unidad:</span>
                      <span className="text-[11px] text-white font-black">{vehiculos.find(v => v.id === parseInt(selectedVehiculoId))?.placa} ({vehiculos.find(v => v.id === parseInt(selectedVehiculoId))?.marca})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Horario:</span>
                      <span className="text-[11px] text-[#8B5CF6] font-black">{fechaIngreso} • {selectedTimeSlot.slice(0, 5)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Especialista:</span>
                      <span className="text-[11px] text-emerald-500 font-black">
                        {selectedEmpleadoId ? empleados.find(e => e.id === parseInt(selectedEmpleadoId))?.usuario?.nombre : 'Auto-asignación'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[11px] text-slate-500 font-bold uppercase">Pago:</span>
                      <span className="text-[11px] text-white font-black">{selectedPaymentMethod}</span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={this.handleScheduleService}
                className={`w-full py-5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shadow-xl shadow-[#8B5CF6]/30 font-mono text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all font-black`}
              >
                CONFIRMAR Y PROGRAMAR
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
                Seleccionar Especialista para las {specialistSlotTime.slice(0, 5)}
              </h3>

              <div className="space-y-4 mb-8">
                {/* Opción de Auto-asignación */}
                <button 
                  onClick={() => this.confirmTimeSlot('')}
                  className="w-full flex items-center justify-between p-4 bg-[#8B5CF6]/10 rounded-2xl border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20 transition-all text-left"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">Auto-asignación</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Primer disponible</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Seleccionar</span>
                </button>

                {specialistsAvailability.map(spec => (
                  <button 
                    key={spec.id}
                    disabled={spec.isOccupied}
                    onClick={() => this.confirmTimeSlot(spec.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      spec.isOccupied 
                      ? 'bg-black/10 border-white/5 opacity-50 cursor-not-allowed' 
                      : 'bg-black/20 border-white/5 hover:border-[#8B5CF6]/50 hover:bg-black/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold text-sm ${spec.isOccupied ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {spec.usuario?.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{spec.cargo || 'Técnico'}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${spec.isOccupied ? 'text-red-500' : 'text-emerald-500'}`}>
                      {spec.isOccupied ? '✗ Ocupado' : '✓ Disponible'}
                    </span>
                  </button>
                ))}
              </div>

              {!anySpecialistAvailable && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center mb-4">
                  <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
                    No hay especialistas disponibles para este horario.
                  </p>
                </div>
              )}

              <button 
                onClick={() => this.setState({ showSpecialistModal: false })}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL QR TRANSFERENCIA */}
        {showQR && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => this.setState({ showQR: false })}></div>
            <div className="relative w-full max-w-sm bg-[#0B1220] border border-white/10 rounded-[3rem] p-10 shadow-2xl text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📱</span>
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Pago por Transferencia</h3>
              <p className="text-slate-400 text-sm mb-8">Escanea el código QR para realizar el pago del servicio.</p>
              
              <div className="bg-white p-6 rounded-[2.5rem] mb-8 shadow-xl shadow-white/5 inline-block">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MotoExpert-Pago-Servicio" 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>

              <button 
                onClick={() => this.setState({ showQR: false })}
                className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AdminDashboard;
