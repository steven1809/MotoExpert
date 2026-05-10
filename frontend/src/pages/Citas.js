import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Citas = ({ setView }) => {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    vehiculoId: '',
    servicioId: '',
    empleadoId: ''
  });

  useEffect(() => {
    fetchInitialData();
    checkPendingAction();
  }, []);

  const checkPendingAction = () => {
    const pendingAction = localStorage.getItem('pendingAction');
    const selectedServiceId = localStorage.getItem('selectedServiceId');

    if (pendingAction === 'agendar_cita') {
      setShowForm(true);
      if (selectedServiceId) {
        setFormData(prev => ({ ...prev, servicioId: selectedServiceId }));
      }
      // Limpiar para que no se abra solo la próxima vez
      localStorage.removeItem('pendingAction');
      localStorage.removeItem('selectedServiceId');
    }
  };

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [citasRes, vehiculosRes, serviciosRes, empleadosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/citas`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers }),
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/empleados`, { headers })
      ]);

      if (citasRes.ok && vehiculosRes.ok && serviciosRes.ok && empleadosRes.ok) {
        const [citasData, vehiculosData, serviciosData, empleadosData] = await Promise.all([
          citasRes.json(),
          vehiculosRes.json(),
          serviciosRes.json(),
          empleadosRes.json()
        ]);
        setCitas(citasData);
        setVehiculos(vehiculosData);
        setServicios(serviciosData);
        setEmpleados(empleadosData.filter(e => e.estado === 'activo')); // Solo activos
      } else {
        setError('Error al obtener datos iniciales');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisponibilidad = async (fecha, servicioId) => {
    if (!fecha || !servicioId) return;
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDisponibilidad(data);
      }
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (e) => {
    const fecha = e.target.value;
    setFormData({ ...formData, fecha, hora_inicio: '' });
    fetchDisponibilidad(fecha, formData.servicioId);
  };

  const handleServicioChange = (e) => {
    const servicioId = e.target.value;
    setFormData({ ...formData, servicioId, hora_inicio: '' });
    if (formData.fecha) {
      fetchDisponibilidad(formData.fecha, servicioId);
    }
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hora_inicio) {
      alert('Por favor selecciona un horario disponible');
      return;
    }
    if (!formData.empleadoId) {
      alert('Por favor selecciona tu especialista');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      // Calculamos hora_fin (sumando 1 hora por defecto para simplificar)
      const [h, m, s] = formData.hora_inicio.split(':');
      const horaFin = `${(parseInt(h) + 1).toString().padStart(2, '0')}:${m}:${s}`;

      const payload = {
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: horaFin,
        vehiculoId: parseInt(formData.vehiculoId, 10),
        servicioId: parseInt(formData.servicioId, 10),
        usuarioId: parseInt(userId, 10),
        empleadoId: parseInt(formData.empleadoId, 10)
      };

      const response = await fetch(`${API_BASE_URL}/citas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '', empleadoId: '' });
        fetchInitialData();
        alert('Cita agendada con éxito');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al agendar cita');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cita?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchInitialData();
      } else {
        alert('Error al eliminar cita');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const citasPendientes = citas.filter(cita => cita.estado === "PENDIENTE");
  const historialServicios = citas.filter(cita => cita.estado === "FINALIZADO" || cita.estado === "CANCELADO");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-[#020617]">
      <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-white/5 mx-6 mt-6 bg-[#111827]">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-[100px]" />
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-block px-4 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em]">Reserva Online</div>
          <h1 className="text-4xl md:text-6xl font-black text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
            Agenda tu <span className="text-[#2563EB]">Cita</span>
          </h1>
          <p className="text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Selecciona el tratamiento premium para tu vehículo.</p>
        </div>
      </header>

      <div className="container mx-auto px-6 space-y-12">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter flex items-center">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full mr-4 animate-pulse" />
            Historial de Citas
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-95"
          >
            {showForm ? 'Cerrar Formulario' : 'Nueva Cita Premium'}
          </button>
        </div>

        {/* Formulario Estilo Tesla */}
        {showForm && (
          <div className="bg-[#111827] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top duration-500">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Servicio Detailing</label>
                  <select
                    name="servicioId"
                    value={formData.servicioId}
                    onChange={handleServicioChange}
                    className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  >
                    <option value="">Seleccione el tratamiento...</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Unidad a Tratar</label>
                  <select
                    name="vehiculoId"
                    value={formData.vehiculoId}
                    onChange={(e) => setFormData({...formData, vehiculoId: e.target.value})}
                    className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  >
                    <option value="">Placa...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    name="fecha"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.fecha}
                    onChange={handleDateChange}
                    className="w-full p-4 bg-[#020617] border border-white/5 rounded-2xl text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1 text-[#2563EB]">Slots Disponibles</label>
                  <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-4 bg-[#020617] rounded-2xl border border-white/5">
                    {loadingSlots ? (
                      <div className="w-full text-center py-2 text-[#94A3B8] text-xs italic">Consultando disponibilidad...</div>
                    ) : disponibilidad.length > 0 ? (
                      disponibilidad.filter(slot => slot.disponible).map(slot => (
                        <button
                          key={slot.hora}
                          type="button"
                          onClick={() => setFormData({ ...formData, hora_inicio: slot.hora })}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                            formData.hora_inicio === slot.hora 
                              ? 'bg-[#2563EB] border-[#2563EB] text-white' 
                              : 'bg-[#111827] border-white/5 text-[#94A3B8] hover:border-white/20'
                          }`}
                        >
                          {slot.hora.substring(0, 5)}
                        </button>
                      ))
                    ) : (
                      <div className="w-full text-center py-2 text-[#94A3B8] text-xs italic">Seleccione fecha y servicio</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de Especialista Premium */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest ml-1">Selecciona tu Especialista</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empleados.map(empleado => (
                    <div
                      key={empleado.id}
                      onClick={() => setFormData({ ...formData, empleadoId: empleado.id.toString() })}
                      className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 group ${
                        formData.empleadoId === empleado.id.toString()
                          ? 'bg-[#2563EB]/10 border-[#2563EB] shadow-2xl shadow-[#2563EB]/20'
                          : 'bg-[#111827] border-white/10 hover:border-[#2563EB]/40 hover:shadow-xl'
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-2xl border border-[#2563EB]/30 group-hover:scale-110 transition-transform">
                          👤
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">{empleado.nombre || 'Especialista'}</h4>
                          <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest">
                            {empleado.estado === 'activo' ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>
                      {empleado.cargo && (
                        <p className="text-sm text-[#94A3B8] font-medium italic">
                          {empleado.cargo}
                        </p>
                      )}
                      {empleado.especialidad && (
                        <div className="mt-2">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {empleado.especialidad}
                          </span>
                        </div>
                      )}
                      {formData.empleadoId === empleado.id.toString() && (
                        <div className="mt-3 flex items-center gap-2 text-[#2563EB] text-xs font-black uppercase tracking-widest">
                          <span className="animate-pulse">✓</span> Seleccionado
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={!formData.hora_inicio}
                className={`w-full py-5 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${
                  formData.hora_inicio 
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-2xl shadow-[#2563EB]/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Confirmar Reserva Premium
              </button>
            </form>
          </div>
        )}

        {/* Sección Citas Pendientes */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">Citas Pendientes</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {citasPendientes.length > 0 ? (
              citasPendientes.map(cita => (
                <div key={cita.id} className="bg-[#111827] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#2563EB]/30 transition-all duration-500 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="text-4xl font-black italic tracking-tighter text-white">#{cita.id}</span>
                  </div>
                  <div className="flex justify-between items-start relative z-10">
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20">
                      {cita.estado}
                    </span>
                    <button
                      onClick={() => handleDelete(cita.id)}
                      className="p-2 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg relative z-20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-2xl font-black text-[#F8FAFC] uppercase italic tracking-tighter">{cita.servicio?.nombre}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest bg-[#2563EB]/5 px-2 py-0.5 rounded border border-[#2563EB]/10">{cita.vehiculo?.placa}</span>
                      <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest italic">{cita.vehiculo?.modelo}</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-center text-xs relative z-10">
                    <div className="flex items-center text-[#94A3B8] font-bold italic uppercase tracking-widest">
                      <span className="mr-2 opacity-50">📅</span>
                      {new Date(cita.fecha).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-[#F8FAFC] font-black italic">
                      <span className="mr-2 opacity-50 text-[#2563EB]">⏰</span>
                      {cita.hora_inicio.substring(0, 5)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-[#111827]/50 rounded-[2.5rem] border border-dashed border-white/5">
                <p className="text-[#94A3B8] italic font-medium text-sm">No hay citas pendientes actualmente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección Historial de Servicios */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">Historial de Servicios</h2>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl bg-opacity-80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#020617]/50">
                    {["ID", "SERVICIO", "VEHÍCULO", "FECHA", "HORA", "TRABAJADOR", "ESTADO"].map((head) => (
                      <th key={head} className="px-6 py-5 text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historialServicios.length > 0 ? (
                    historialServicios.map((cita) => (
                      <tr key={cita.id} className="hover:bg-[#2563EB]/5 transition-all duration-300 group">
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">#{cita.id}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-[#F8FAFC] uppercase italic tracking-tighter">{cita.servicio?.nombre}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded border border-[#2563EB]/20">{cita.vehiculo?.placa}</span>
                            <span className="text-[10px] font-bold text-[#94A3B8] uppercase italic">{cita.vehiculo?.modelo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center text-[#94A3B8] text-[11px] font-bold italic uppercase tracking-wider">
                            <span className="mr-2 opacity-50">📅</span>
                            {new Date(cita.fecha).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center text-[#F8FAFC] text-[11px] font-black italic">
                            <span className="mr-2 opacity-50 text-[#2563EB]">⏰</span>
                            {cita.hora_inicio.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[10px]">👤</div>
                            <span className="text-sm font-bold text-[#F8FAFC]">{cita.empleado?.nombre || 'Por asignar'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                            cita.estado === 'FINALIZADO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white' :
                            cita.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white' :
                            'bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500 group-hover:text-white'
                          }`}>
                            {cita.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center text-[#94A3B8] italic font-medium text-sm">
                        No hay servicios finalizados en el historial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Citas;
