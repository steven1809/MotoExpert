import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Settings, 
  Calendar, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Info, 
  ArrowLeft,
  CalendarCheck,
  Check
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const HOURS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
];

const QuickBookingSection = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    servicioId: '',
    servicioNombre: '',
    placa: '',
    fecha: '',
    especialista: null,
    hora: '',
    notas: ''
  });
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/servicios`);
        if (!response.ok) throw new Error('Error al cargar servicios');
        const data = await response.json();
        setServices(Array.isArray(data) ? data : (data.servicios || []));
        setServicesError(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setServicesError(true);
      } finally {
        setServicesLoading(false);
      }
    };

    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios/empleados`);
        if (!response.ok) throw new Error('Error al cargar especialistas');
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
        setEmployeesError(false);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setEmployeesError(true);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchServices();
    fetchEmployees();
  }, []);

  // Mock occupied hours for demo
  const [occupiedHours, setOccupiedHours] = useState({
    1: ["09:00 AM", "01:00 PM"],
    2: ["10:00 AM", "02:00 PM"],
    3: ["08:00 AM", "11:00 AM"],
    4: ["12:00 PM", "03:00 PM"],
    5: ["09:00 AM", "04:00 PM"],
    6: ["11:00 AM", "02:00 PM"]
  });

  const getEmployeeColor = (id) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 
      'bg-orange-500', 'bg-pink-500', 'bg-cyan-500',
      'bg-indigo-500', 'bg-rose-500', 'bg-amber-500'
    ];
    return colors[id % colors.length];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'servicioId') {
      const selectedService = Array.isArray(services) && services.find(s => s.id.toString() === value);
      setFormData(prev => ({ 
        ...prev, 
        servicioId: value,
        servicioNombre: selectedService ? selectedService.nombre : '' 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const isStep1Valid = formData.nombre && formData.telefono && formData.servicioId && formData.placa && formData.fecha;
  const isStep2Valid = formData.especialista !== null;
  const isStep3Valid = formData.hora !== '';

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleConfirm = () => {
    setIsSuccess(true);
  };

  const resetFlow = () => {
    setStep(1);
    setFormData({
      nombre: '',
      telefono: '',
      servicio: '',
      placa: '',
      fecha: '',
      especialista: null,
      hora: '',
      notas: ''
    });
    setIsSuccess(false);
  };

  if (isSuccess) {
    return (
      <section className="py-20 bg-[#0d0f14] font-['DM_Sans']">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-[#131720] border border-[#1e2535] rounded-3xl p-12 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-['Rajdhani'] font-bold text-white mb-4 uppercase tracking-tight">¡Cita Agendada con Éxito!</h2>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Hola <span className="text-white font-bold">{formData.nombre}</span>, tu servicio de <span className="text-blue-400 font-bold">{formData.servicioNombre}</span> ha sido programado correctamente.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
              <div className="bg-[#1e2535]/30 p-6 rounded-2xl border border-[#1e2535]">
                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Especialista</p>
                <p className="text-white font-semibold">{formData.especialista.nombre}</p>
              </div>
              <div className="bg-[#1e2535]/30 p-6 rounded-2xl border border-[#1e2535]">
                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Fecha y Hora</p>
                <p className="text-white font-semibold">{formData.fecha} — {formData.hora}</p>
              </div>
              <div className="bg-[#1e2535]/30 p-6 rounded-2xl border border-[#1e2535]">
                <p className="text-slate-500 text-xs uppercase font-bold tracking-widest mb-2">Placa Vehículo</p>
                <p className="text-white font-semibold uppercase">{formData.placa}</p>
              </div>
            </div>

            <button 
              onClick={resetFlow}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center gap-3 mx-auto"
            >
              <CalendarCheck className="w-5 h-5" />
              AGENDAR OTRA CITA
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-[#0d0f14] font-['DM_Sans'] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full -ml-48 -mb-48"></div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: MULTI-STEP FORM */}
          <div className="lg:col-span-8">
            <div className="mb-10">
              <span className="text-blue-500 font-bold uppercase tracking-[0.2em] text-sm mb-4 block font-['Rajdhani']">Reserva en línea</span>
              <h2 className="text-4xl md:text-5xl font-['Rajdhani'] font-bold text-white uppercase tracking-tight">Agendado Rápido</h2>
              <p className="text-slate-400 mt-4 text-lg">"Lo mejor para tu vehículo"</p>
            </div>

            <div className="bg-[#131720] border border-[#1e2535] rounded-3xl p-8 md:p-10 shadow-2xl relative">
              {/* Progress Bar */}
              <div className="flex items-center gap-4 mb-12">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex-1 flex flex-col gap-3">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                      step >= s ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-[#1e2535]'
                    }`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      step >= s ? 'text-blue-400' : 'text-slate-600'
                    }`}>Paso 0{s}</span>
                  </div>
                ))}
              </div>

              {/* STEP 1: CLIENT DATA */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Nombre Completo</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text" 
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          placeholder="Ej: Juan Pérez"
                          className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Teléfono</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="tel" 
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="+57 300 000 0000"
                          className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Tipo de Servicio</label>
                      <div className="relative group">
                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                        <select 
                          name="servicioId"
                          value={formData.servicioId}
                          onChange={handleInputChange}
                          disabled={servicesLoading || servicesError}
                          className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {servicesLoading ? (
                            <option value="">Cargando servicios...</option>
                          ) : servicesError ? (
                            <option value="">Error al cargar servicios</option>
                          ) : (
                            <>
                              <option value="" disabled>Seleccionar servicio</option>
                              {Array.isArray(services) && services.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Placa del Vehículo</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-blue-500 transition-colors">ABC</div>
                        <input 
                          type="text" 
                          name="placa"
                          value={formData.placa}
                          onChange={handleInputChange}
                          placeholder="ABC-123"
                          className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Fecha de la Cita</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="date" 
                          name="fecha"
                          value={formData.fecha}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-blue-500 transition-all [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button 
                      disabled={!isStep1Valid}
                      onClick={nextStep}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-[#1e2535] disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-blue-600/10"
                    >
                      SIGUIENTE
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: SPECIALIST SELECTION */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {employeesLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="p-6 rounded-2xl border border-[#1e2535] bg-[#131720] animate-pulse h-32" />
                      ))}
                      <div className="col-span-full text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-xs">
                        Cargando especialistas...
                      </div>
                    </div>
                  ) : employeesError ? (
                    <div className="text-center py-20 bg-[#0d0f14] rounded-2xl border border-red-500/20 text-red-400 font-bold">
                      Error al cargar especialistas. Por favor, intenta de nuevo.
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(employees) && employees.map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => setFormData(prev => ({ ...prev, especialista: emp }))}
                          className={`p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                            formData.especialista?.id === emp.id 
                              ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20' 
                              : 'bg-[#0d0f14] border-[#1e2535] hover:border-[#2a3447]'
                          }`}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-lg shadow-lg ${!emp.picture ? getEmployeeColor(emp.id) : ''}`}>
                              {emp.picture ? (
                                <img src={emp.picture} alt={emp.nombre} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(emp.nombre)
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-sm">{emp.nombre}</h4>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {emp.telefono || 'Sin teléfono'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                            <Clock className="w-3 h-3" />
                            Turnos disponibles hoy
                          </div>
                          {formData.especialista?.id === emp.id && (
                            <div className="absolute top-4 right-4 text-blue-500">
                              <CheckCircle2 className="w-5 h-5 fill-blue-500 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-10 flex justify-between">
                    <button 
                      onClick={prevStep}
                      className="px-8 py-4 bg-[#1e2535] hover:bg-[#2a3447] text-white font-bold rounded-2xl transition-all flex items-center gap-3"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      ATRÁS
                    </button>
                    <button 
                      disabled={!isStep2Valid}
                      onClick={nextStep}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-[#1e2535] disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-blue-600/10"
                    >
                      VER HORARIOS
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULE */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Selected Specialist Bar */}
                  <div className="bg-[#0d0f14] border border-[#1e2535] p-5 rounded-2xl flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold shadow-lg ${!formData.especialista.picture ? getEmployeeColor(formData.especialista.id) : ''}`}>
                        {formData.especialista.picture ? (
                          <img src={formData.especialista.picture} alt={formData.especialista.nombre} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(formData.especialista.nombre)
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{formData.especialista.nombre}</h4>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {formData.especialista.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={prevStep}
                      className="text-blue-500 text-xs font-bold uppercase tracking-widest hover:text-blue-400 transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {HOURS.map((h) => {
                      const isOccupied = occupiedHours[formData.especialista?.id]?.includes(h);
                      const isSelected = formData.hora === h;
                      
                      return (
                        <button
                          key={h}
                          disabled={isOccupied}
                          onClick={() => setFormData(prev => ({ ...prev, hora: h }))}
                          className={`py-4 rounded-xl font-bold text-sm transition-all relative ${
                            isOccupied 
                              ? 'bg-[#1e2535]/30 text-slate-700 line-through cursor-not-allowed border border-transparent' 
                              : isSelected
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-transparent'
                                : 'bg-[#0d0f14] text-slate-400 border border-[#1e2535] hover:border-blue-500/50 hover:text-white'
                          }`}
                        >
                          {h}
                          {isSelected && <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 mb-10">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1">Notas Opcionales</label>
                    <textarea 
                      name="notas"
                      value={formData.notas}
                      onChange={handleInputChange}
                      placeholder="Algún detalle adicional que debamos saber..."
                      className="w-full bg-[#0d0f14] border border-[#1e2535] rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-700 h-24 resize-none"
                    />
                  </div>

                  <div className="flex justify-between">
                    <button 
                      onClick={prevStep}
                      className="px-8 py-4 bg-[#1e2535] hover:bg-[#2a3447] text-white font-bold rounded-2xl transition-all flex items-center gap-3"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      ATRÁS
                    </button>
                    <button 
                      disabled={!isStep3Valid}
                      onClick={handleConfirm}
                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-[#1e2535] disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-emerald-600/10"
                    >
                      CONFIRMAR CITA
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: INFO PANELS */}
          <div className="lg:col-span-4 space-y-6">
            {/* How it works */}
            <div className="bg-[#131720] border border-[#1e2535] rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-['Rajdhani'] font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Info className="w-4 h-4 text-blue-500" />
                </div>
                ¿Cómo funciona?
              </h3>
              
              <div className="space-y-8">
                {[
                  { n: "01", t: "Tus Datos", d: "Ingresa tu información básica y del servicio." },
                  { n: "02", t: "El Experto", d: "Selecciona el especialista de tu preferencia." },
                  { n: "03", t: "El Horario", d: "Elige el mejor momento para visitarnos." },
                  { n: "04", t: "Confirmación", d: "Recibe los detalles de tu cita al instante." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <span className="text-2xl font-['Rajdhani'] font-black text-blue-600/20 group-hover:text-blue-600/40 transition-colors">{item.n}</span>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1 uppercase tracking-wide">{item.t}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-[#131720] border border-[#1e2535] rounded-3xl p-8 shadow-xl">
              <h3 className="text-xl font-['Rajdhani'] font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                Atención
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#1e2535]">
                  <span className="text-slate-400 text-sm font-medium">Lun — Vie</span>
                  <span className="text-white font-bold text-sm">8:00 AM – 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#1e2535]">
                  <span className="text-slate-400 text-sm font-medium">Sábado</span>
                  <span className="text-white font-bold text-sm">8:00 AM – 2:00 PM</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-400 text-sm font-medium">Domingo</span>
                  <span className="text-red-500 font-black text-xs uppercase tracking-widest">Cerrado</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                <p className="text-slate-400 text-[10px] leading-relaxed text-center">
                  * Los festivos seguimos el horario de Domingo a menos que se informe lo contrario.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default QuickBookingSection;
