import React, { Component } from 'react';
import { 
  getServicios, 
  getEmpleados, 
  getDisponibilidad, 
  crearCita
} from '../../services/agendamiento.service';
import { API_BASE_URL } from '../../apiConfig';
import emailjs from '@emailjs/browser';

const initialForm = { 
  nombre: '', apellido: '', telefono: '', email: '', 
  tipoDocumento: '', numeroDocumento: '', 
  tipoVehiculo: '', marca: '', modelo: '', 
  anio: '', color: '', placa: '', 
  servicioId: null, empleadoId: null, 
  fecha: '', hora: '', 
};

class AgendamientoPublico extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 1,
      formData: { ...initialForm },
      errors: {},
      servicios: [],
      employees: [],
      slotsDisponibles: [],
      slotsOcupados: [],
      loading: false,
      error: null,
      citaId: null,
      paymentId: null,
      wompiPaymentLink: null,
      tokenEntrega: null,
      metodoPago: 'EFECTIVO' // 'EFECTIVO' or 'WOMPI'
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData = async () => {
    this.setState({ loading: true });
    try {
      const [servs, emps] = await Promise.all([getServicios(), getEmpleados()]);
      this.setState({ 
        servicios: servs || [], 
        employees: emps || [], 
        loading: false 
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    const { formData } = this.state;
    if (
      (prevState.formData.fecha !== formData.fecha || 
       prevState.formData.servicioId !== formData.servicioId || 
       prevState.formData.empleadoId !== formData.empleadoId) &&
      formData.fecha && formData.servicioId
    ) {
      this.loadDisponibilidad();
    }
  }

  loadDisponibilidad = async () => {
    const { formData } = this.state;
    this.setState({ loading: true });
    try {
      const data = await getDisponibilidad(formData.fecha, formData.servicioId, formData.empleadoId);
      const disponibles = (data || []).filter(s => s.disponible).map(s => s.hora);
      const ocupados = (data || []).filter(s => !s.disponible).map(s => s.hora);
      this.setState({ 
        slotsDisponibles: disponibles, 
        slotsOcupados: ocupados, 
        loading: false 
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prev => ({
      formData: {
        ...prev.formData,
        [name]: name === 'placa' ? value.toUpperCase() : value
      }
    }));
  };

  // Reemplaza validateStep1, validateStep2, validateStep3 y handleNext:
  validateStep1 = () => {
    const { nombre, apellido, telefono, email, tipoDocumento, numeroDocumento } = this.state.formData;
    const errors = {};
    if (!nombre) errors.nombre = 'Requerido';
    if (!apellido) errors.apellido = 'Requerido';
    if (!telefono) errors.telefono = 'Requerido';
    if (!email) errors.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido';
    if (!tipoDocumento) errors.tipoDocumento = 'Requerido';
    if (!numeroDocumento) errors.numeroDocumento = 'Requerido';
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  validateStep2 = () => {
    const { tipoVehiculo, marca, modelo, placa, servicioId } = this.state.formData;
    const errors = {};
    if (!tipoVehiculo) errors.tipoVehiculo = 'Requerido';
    if (!marca) errors.marca = 'Requerido';
    if (!modelo) errors.modelo = 'Requerido';
    if (!placa) errors.placa = 'Requerido';
    if (!servicioId) errors.servicioId = 'Selecciona un servicio';
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  validateStep3 = () => {
    const { fecha, hora } = this.state.formData;
    const errors = {};
    if (!fecha) errors.fecha = 'Selecciona una fecha';
    if (!hora) errors.hora = 'Selecciona un horario';
    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleNext = () => {
    const { step } = this.state;
    if (step === 1 && this.validateStep1()) this.setState({ step: 2, errors: {} });
    else if (step === 2 && this.validateStep2()) this.setState({ step: 3, errors: {} });
    else if (step === 3 && this.validateStep3()) this.setState({ step: 4, errors: {} });
  };

  handleConfirm = async () => {
    const { formData, metodoPago } = this.state;
    this.setState({ loading: true, error: null });
    try {
      // 1. Create the appointment
      const result = await crearCita({ 
        ...formData, 
        metodoPago: metodoPago === 'EFECTIVO' ? 'EFECTIVO' : 'WOMPI' 
      });
      
      this.setState({ citaId: result.id });
      try {
        const servicioNombre = (this.state.servicios || []).find(s => s.id === formData.servicioId)?.nombre || '';
        await emailjs.send(
          'service_1zw6lr5',
          'bjvk49d',
          {
            to_email: formData.email,
            cliente_nombre: `${formData.nombre} ${formData.apellido}`,
            cita_id: result.id,
            servicio: servicioNombre,
            fecha: formData.fecha,
            hora: formData.hora,
            vehiculo: `${formData.marca} ${formData.modelo} (${formData.placa})`,
            metodo_pago: metodoPago === 'EFECTIVO' ? 'Efectivo en taller' : 'Pago digital Wompi',
          },
          'DnCU3e4N9NdapUEmI'
        );
      } catch (emailErr) {
        console.error('Error enviando email:', emailErr);
      }

      // 2. Generate payment token or Wompi link
      const token = localStorage.getItem('token');
      if (token) { // If user is logged in (though this is public, just in case)
        const paymentRes = await fetch(`${API_BASE_URL}/payments/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            appointmentId: result.id,
            method: metodoPago === 'EFECTIVO' ? 'cash' : 'wompi'
          })
        });

        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          this.setState({
            paymentId: paymentData.payment.id,
            tokenEntrega: paymentData.tokenCode,
            wompiPaymentLink: paymentData.wompiPaymentLink,
            loading: false
          });
        }
      } else {
        // If no token (public booking), just show the citaId
        this.setState({ loading: false });
      }
    } catch (err) {
      console.error(err);
      this.setState({ error: err.message, loading: false });
    }
  };

  // Function to verify Wompi payment and get token
  handleVerifyWompiPayment = async () => {
    const { paymentId } = this.state;
    this.setState({ loading: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      
      const res = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify-wompi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        this.setState({
          tokenEntrega: data.tokenCode,
          loading: false
        });
      }
    } catch (err) {
      console.error(err);
      this.setState({ error: err.message, loading: false });
    }
  };

  resetForm = () => {
    this.setState({
      formData: { ...initialForm },
      step: 1,
      citaId: null,
      paymentId: null,
      wompiPaymentLink: null,
      tokenEntrega: null,
      metodoPago: 'EFECTIVO'
    });
  };

  render() {
    const { 
      step, 
      formData,
      errors = {},
      servicios, 
      employees, 
      slotsDisponibles, 
      slotsOcupados, 
      loading, 
      error, 
      citaId,
      tokenEntrega,
      wompiPaymentLink,
      metodoPago
    } = this.state;

    if (citaId) {
      return (
        <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">¡Reserva confirmada!</h2>
          <p className="text-slate-400 mb-6">Recibirás confirmación a <span className="text-white font-semibold">{formData.email}</span></p>
          
          {wompiPaymentLink && !tokenEntrega && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-center">
              <p className="text-gray-400 mb-4">Completa tu pago con Wompi</p>
              <a 
                href={wompiPaymentLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded-full transition-all mb-4"
              >
                Pagar con Wompi
              </a>
              <br />
              <button
                onClick={this.handleVerifyWompiPayment}
                disabled={loading}
                className="text-blue-400 text-sm underline hover:text-blue-300"
              >
                {loading ? 'Verificando...' : 'Ya pagué, verificar'}
              </button>
            </div>
          )}

          {tokenEntrega && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-4 mb-8">
              <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Token de entrega</span>
              <code className="text-2xl font-mono text-green-400">{tokenEntrega}</code>
              <p className="text-gray-400 text-xs mt-2">Guarda este código para retirar tu vehículo</p>
            </div>
          )}

          {!wompiPaymentLink && !tokenEntrega && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-4 mb-8">
              <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Código de reserva</span>
              <code className="text-2xl font-mono text-blue-400">#{citaId}</code>
            </div>
          )}

          <button 
            onClick={this.resetForm}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all"
          >
            Agendar otra cita
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto bg-gray-900/40 border border-gray-800 rounded-3xl p-8 backdrop-blur-sm">
        {/* Stepper */}
        <div className="flex justify-between mb-12 relative">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step > s ? 'bg-green-500 border-green-500 text-white' :
                step === s ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                'bg-gray-950 border-gray-700 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${step === s ? 'text-blue-400' : 'text-gray-600'}`}>
                {s === 1 ? 'Personal' : s === 2 ? 'Vehículo' : s === 3 ? 'Horario' : 'Resumen'}
              </span>
            </div>
          ))}
          <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-800 -z-0" />
        </div>

        {/* Steps Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Nombre</label>
                  <input name="nombre" value={formData.nombre} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.nombre ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="Ej: Carlos" />
                  {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Apellido</label>
                  <input name="apellido" value={formData.apellido} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.apellido ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="Ej: Torres" />
                  {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Teléfono</label>
                  <input name="telefono" type="tel" value={formData.telefono} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.telefono ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="300 123 4567" />
                  {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Email</label>
                  <input name="email" type="email" value={formData.email} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="carlos@email.com" />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Tipo Documento</label>
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.tipoDocumento ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}>
                    <option value="">Selecciona...</option>
                    <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                    <option value="NIT">NIT</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Cédula extranjería">Cédula extranjería</option>
                  </select>
                  {errors.tipoDocumento && <p className="text-red-400 text-xs mt-1">{errors.tipoDocumento}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Número Documento</label>
                  <input name="numeroDocumento" value={formData.numeroDocumento} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.numeroDocumento ? 'border-red-500 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="1002345678" />
                  {errors.numeroDocumento && <p className="text-red-400 text-xs mt-1">{errors.numeroDocumento}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Tipo Vehículo</label>
                  <select name="tipoVehiculo" value={formData.tipoVehiculo} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.tipoVehiculo ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'}`}>
                    <option value="">Selecciona...</option>
                    <option value="Automóvil">Automóvil</option>
                    <option value="Moto">Moto</option>
                  </select>
                  {errors.tipoVehiculo && <p className="text-red-400 text-xs mt-1">{errors.tipoVehiculo}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-2">Marca</label>
                    <input name="marca" value={formData.marca} onChange={this.handleInputChange}
                      className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.marca ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                      placeholder="Chevrolet" />
                    {errors.marca && <p className="text-red-400 text-xs mt-1">{errors.marca}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase mb-2">Modelo</label>
                    <input name="modelo" value={formData.modelo} onChange={this.handleInputChange}
                      className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.modelo ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                      placeholder="Spark" />
                    {errors.modelo && <p className="text-red-400 text-xs mt-1">{errors.modelo}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Año</label>
                  <input name="anio" type="number" min="1990" max="2026" value={formData.anio} onChange={this.handleInputChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder="2021" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Color</label>
                  <input name="color" value={formData.color} onChange={this.handleInputChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                    placeholder="Rojo" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Placa</label>
                  <input name="placa" value={formData.placa} onChange={this.handleInputChange}
                    className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white focus:outline-none transition-all ${errors.placa ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                    placeholder="ABC123" />
                  {errors.placa && <p className="text-red-400 text-xs mt-1">{errors.placa}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-4 tracking-widest font-bold">Selecciona el servicio</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading && (servicios || []).length === 0 ? (
                    [1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-950 animate-pulse border border-gray-800 rounded-2xl" />)
                  ) : (
                    (servicios || []).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => this.setState(prev => ({ formData: { ...prev.formData, servicioId: s.id }, errors: { ...prev.errors, servicioId: null } }))}
                        className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${formData.servicioId === s.id ? 'bg-blue-500/10 border-blue-500' : errors.servicioId ? 'border-red-500/50 bg-gray-950' : 'bg-gray-950 border-gray-800 hover:border-gray-700'}`}
                      >
                        <h4 className="font-bold text-white mb-1">{s.nombre}</h4>
                        <p className="text-gray-500 text-xs mb-4">{s.descripcion || 'Servicio profesional para tu vehículo'}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-400 font-bold">${s.precio.toLocaleString()}</span>
                          <span className="text-gray-600 text-[10px] uppercase">⏱ {s.duracion} min</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {errors.servicioId && <p className="text-red-400 text-xs mt-2">{errors.servicioId}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-4 tracking-widest font-bold">Selecciona tu experto</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => this.setState(prev => ({ formData: { ...prev.formData, empleadoId: null } }))}
                    className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${formData.empleadoId === null ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-950 border-gray-800'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 mb-3">?</div>
                    <span className="text-sm font-bold text-white">Sin preferencia</span>
                    <span className="text-[10px] text-gray-500 uppercase">Cualquier experto</span>
                  </button>
                  {(employees || []).map(e => {
                    const nombreCompleto = e.usuario?.nombre
                      ? `${e.usuario.nombre} ${e.usuario.apellidos || ''}`.trim()
                      : `Empleado ${e.id}`;
                    const rol = e.cargo || 'Especialista';
                    const iniciales = e.usuario?.nombre
                      ? (e.usuario.nombre[0] + (e.usuario.apellidos?.[0] || '')).toUpperCase()
                      : `E${e.id}`;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => this.setState(prev => ({ formData: { ...prev.formData, empleadoId: e.id } }))}
                        className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${formData.empleadoId === e.id ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-950 border-gray-800'}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mb-3 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                          {iniciales}
                        </div>
                        <span className="text-sm font-bold text-white text-center">{nombreCompleto}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{rol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-xs mx-auto text-center">
                <label className="block text-xs text-gray-500 uppercase mb-2">Selecciona la fecha</label>
                <input
                  type="date"
                  name="fecha"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.fecha}
                  onChange={this.handleInputChange}
                  className={`w-full bg-gray-950 border rounded-xl px-4 py-3 text-white outline-none transition-all [color-scheme:dark] ${errors.fecha ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'}`}
                />
                {errors.fecha && <p className="text-red-400 text-xs mt-1">{errors.fecha}</p>}
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase mb-4 tracking-widest font-bold text-center">Horarios disponibles</label>
                {!formData.fecha ? (
                  <div className="text-center py-8 text-gray-600 italic">Selecciona una fecha para ver los horarios</div>
                ) : loading ? (
                  <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {(slotsDisponibles || []).map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => this.setState(prev => ({ formData: { ...prev.formData, hora: h }, errors: { ...prev.errors, hora: null } }))}
                        className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.hora === h ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-blue-500/50'}`}
                      >
                        {h}
                      </button>
                    ))}
                    {(slotsOcupados || []).map(h => (
                      <div key={h} className="py-3 rounded-xl border-2 border-gray-900 bg-gray-950 text-gray-700 font-bold text-sm opacity-40 line-through text-center">
                        {h}
                      </div>
                    ))}
                  </div>
                )}
                {errors.hora && <p className="text-red-400 text-xs mt-2 text-center">{errors.hora}</p>}
                {formData.fecha && !loading && (slotsDisponibles || []).length === 0 && (
                  <div className="text-center py-8 text-red-400/70">No hay horarios disponibles para esta fecha</div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-white text-center mb-6">Resumen de tu cita</h3>
              <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-900 bg-blue-500/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Servicio</span>
                    <span className="text-white font-bold">{(servicios || []).find(s => s.id === formData.servicioId)?.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 uppercase">Especialista</span>
                    <span className="text-gray-300">
                      {formData.empleadoId
                        ? (() => {
                            const emp = (employees || []).find(e => e.id === formData.empleadoId);
                            return `${emp?.usuario?.nombre || ''} ${emp?.usuario?.apellidos || ''}`.trim();
                          })()
                        : 'Sin preferencia'}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="block text-[10px] text-gray-600 uppercase mb-1">Fecha y Hora</span>
                      <p className="text-white font-medium">{formData.fecha} — {formData.hora}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-600 uppercase mb-1">Vehículo</span>
                      <p className="text-white font-medium">{formData.marca} {formData.modelo} ({formData.placa})</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="block text-[10px] text-gray-600 uppercase mb-1">Cliente</span>
                      <p className="text-white font-medium">{formData.nombre} {formData.apellido}</p>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-600 uppercase mb-1">Contacto</span>
                      <p className="text-white font-medium">{formData.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                    <span className="text-xs text-gray-500 uppercase">Total a pagar</span>
                    <span className="text-xl font-bold text-green-400">
                      ${(servicios || []).find(s => s.id === formData.servicioId)?.precio.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de Pago */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">SELECCIONA CÓMO PAGAR</h4>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => this.setState({ metodoPago: 'EFECTIVO' })}
                    className={`w-full p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${
                      metodoPago === 'EFECTIVO' ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-white font-bold">💵 EFECTIVO</div>
                      <div className="text-gray-400 text-xs">Confirmas ahora, pagas en taller.</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      metodoPago === 'EFECTIVO' ? 'border-blue-400 bg-blue-400' : 'border-gray-600'
                    }`}>
                      {metodoPago === 'EFECTIVO' && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => this.setState({ metodoPago: 'WOMPI' })}
                    className={`w-full p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${
                      metodoPago === 'WOMPI' ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-white font-bold">💳 PAGO DIGITAL (WOMPI)</div>
                      <div className="text-gray-400 text-xs">Pago seguro con tarjeta, Nequi, Daviplata o transferencia.</div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      metodoPago === 'WOMPI' ? 'border-purple-400 bg-purple-400' : 'border-gray-600'
                    }`}>
                      {metodoPago === 'WOMPI' && (
                        <div className="w-3 h-3 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12 pt-8 border-t border-gray-800">
          <button 
            type="button"
            onClick={() => this.setState(prev => ({ step: prev.step - 1 }))} 
            disabled={step === 1 || loading}
            className={`px-8 py-3 rounded-full font-bold transition-all ${step === 1 ? 'opacity-0' : 'text-gray-500 hover:text-white'}`}
          >
            Volver
          </button>
          
          {step < 4 ? (
            <button 
              type="button"
              onClick={this.handleNext}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-3 rounded-full transition-all shadow-lg hover:shadow-blue-600/20"
            >
              Continuar
            </button>
          ) : (
            <button 
              type="button"
              onClick={this.handleConfirm}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-3 rounded-full transition-all shadow-lg hover:shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar reserva'}
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-center mt-4 text-sm font-medium">Error: {error}</p>}
      </div>
    );
  }
}

export default AgendamientoPublico;
