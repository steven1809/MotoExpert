import React, { useState, useEffect } from 'react';
import { 
  getServicios, 
  getEmpleados, 
  getDisponibilidad, 
  crearCita
} from '../../services/agendamiento.service';

const initialForm = { 
  nombre: '', apellido: '', telefono: '', email: '', 
  tipoDocumento: '', numeroDocumento: '', 
  tipoVehiculo: '', marca: '', modelo: '', 
  anio: '', color: '', placa: '', 
  servicioId: null, empleadoId: null, 
  fecha: '', hora: '', 
};

const AgendamientoPublico = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [servicios, setServicios] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [slotsOcupados, setSlotsOcupados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [citaId, setCitaId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [servs, emps] = await Promise.all([getServicios(), getEmpleados()]);
        setServicios(servs || []);
        setEmployees(emps || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.fecha && formData.servicioId) {
      const loadDisponibilidad = async () => {
        setLoading(true);
        try {
          const data = await getDisponibilidad(formData.fecha, formData.servicioId, formData.empleadoId);
          const disponibles = (data || []).filter(s => s.disponible).map(s => s.hora);
          const ocupados = (data || []).filter(s => !s.disponible).map(s => s.hora);
          setSlotsDisponibles(disponibles);
          setSlotsOcupados(ocupados);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadDisponibilidad();
    }
  }, [formData.fecha, formData.servicioId, formData.empleadoId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'placa' ? value.toUpperCase() : value 
    }));
  };

  const validateStep1 = () => {
    const { nombre, apellido, telefono, email, tipoDocumento, numeroDocumento } = formData;
    if (!nombre || !apellido || !telefono || !email || !tipoDocumento || !numeroDocumento) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateStep2 = () => {
    const { tipoVehiculo, marca, modelo, placa, servicioId } = formData;
    return !!(tipoVehiculo && marca && modelo && placa && servicioId);
  };

  const validateStep3 = () => {
    return !!(formData.fecha && formData.hora);
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setStep(4);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await crearCita(formData);
      setCitaId(result.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setStep(1);
    setCitaId(null);
  };

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
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-4 mb-8">
          <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">Código de reserva</span>
          <code className="text-2xl font-mono text-blue-400">#{citaId}</code>
        </div>
        <button 
          onClick={resetForm}
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
                <input name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="Ej: Carlos" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Apellido</label>
                <input name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="Ej: Torres" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Teléfono</label>
                <input name="telefono" type="tel" value={formData.telefono} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="300 123 4567" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="carlos@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Tipo Documento</label>
                <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Selecciona...</option>
                  <option value="Cédula de ciudadanía">Cédula de ciudadanía</option>
                  <option value="NIT">NIT</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Cédula extranjería">Cédula extranjería</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Número Documento</label>
                <input name="numeroDocumento" value={formData.numeroDocumento} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="1002345678" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Tipo Vehículo</label>
                <select name="tipoVehiculo" value={formData.tipoVehiculo} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Selecciona...</option>
                  <option value="Automóvil">Automóvil</option>
                  <option value="Camioneta SUV">Camioneta SUV</option>
                  <option value="Camioneta pickup">Camioneta pickup</option>
                  <option value="Moto">Moto</option>
                  <option value="Van/Furgón">Van/Furgón</option>
                  <option value="Campero">Campero</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Marca</label>
                  <input name="marca" value={formData.marca} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="Chevrolet" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Modelo</label>
                  <input name="modelo" value={formData.modelo} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="Spark" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Año</label>
                <input name="anio" type="number" min="1990" max="2026" value={formData.anio} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="2021" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Color</label>
                <input name="color" value={formData.color} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="Rojo" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Placa</label>
                <input name="placa" value={formData.placa} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all" placeholder="ABC123" />
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
                      onClick={() => setFormData(prev => ({ ...prev, servicioId: s.id }))}
                      className={`text-left p-6 rounded-2xl border-2 transition-all duration-300 ${formData.servicioId === s.id ? 'bg-blue-500/10 border-blue-500' : 'bg-gray-950 border-gray-800 hover:border-gray-700'}`}
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
                  onClick={() => setFormData(prev => ({ ...prev, empleadoId: null }))}
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
                      onClick={() => setFormData(prev => ({ ...prev, empleadoId: e.id }))}
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
                onChange={handleInputChange} 
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 [color-scheme:dark]" 
              />
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
                      onClick={() => setFormData(prev => ({ ...prev, hora: h }))}
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-12 pt-8 border-t border-gray-800">
        <button 
          type="button"
          onClick={() => setStep(s => s - 1)} 
          disabled={step === 1 || loading}
          className={`px-8 py-3 rounded-full font-bold transition-all ${step === 1 ? 'opacity-0' : 'text-gray-500 hover:text-white'}`}
        >
          Volver
        </button>
        
        {step < 4 ? (
          <button 
            type="button"
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-3 rounded-full transition-all shadow-lg hover:shadow-blue-600/20"
          >
            Continuar
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleConfirm}
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
};

export default AgendamientoPublico;