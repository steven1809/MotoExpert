import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: '',
    hora_inicio: '',
    vehiculoId: '',
    servicioId: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [citasRes, vehiculosRes, serviciosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/citas`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers }),
        fetch(`${API_BASE_URL}/servicios`, { headers })
      ]);

      if (citasRes.ok && vehiculosRes.ok && serviciosRes.ok) {
        const [citasData, vehiculosData, serviciosData] = await Promise.all([
          citasRes.json(),
          vehiculosRes.json(),
          serviciosRes.json()
        ]);
        setCitas(citasData);
        setVehiculos(vehiculosData);
        setServicios(serviciosData);
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
        usuarioId: parseInt(userId, 10)
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
        setFormData({ fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '' });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent italic">
            Agendamiento de Citas
          </h1>
          <p className="text-slate-400">Gestiona tus mantenimientos y servicios</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg transform active:scale-95 flex items-center space-x-2 ${
            showForm 
              ? 'bg-slate-800 text-slate-300 border border-slate-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
          }`}
        >
          <span>{showForm ? 'Cerrar Formulario' : 'Agendar Nueva Cita'}</span>
          <span className="text-xl">{showForm ? '×' : '+'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8 mb-12 shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center mb-8 space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center italic font-bold">M</div>
            <h2 className="text-2xl font-bold text-white">Configura tu Cita</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Paso 1: Seleccionar Servicio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">1. ¿Qué servicio necesitas?</label>
              <select
                value={formData.servicioId}
                onChange={handleServicioChange}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">Selecciona un servicio...</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} - ${s.precio}</option>
                ))}
              </select>
            </div>

            {/* Paso 2: Seleccionar Vehículo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">2. Selecciona tu vehículo</label>
              <select
                value={formData.vehiculoId}
                onChange={(e) => setFormData({...formData, vehiculoId: e.target.value})}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">Selecciona un vehículo...</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</option>
                ))}
              </select>
            </div>

            {/* Paso 3: Fecha */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">3. Fecha del servicio</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.fecha}
                onChange={handleDateChange}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
                required
              />
            </div>

            {/* Paso 4: Horarios Disponibles */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">4. Selecciona un horario</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {!formData.fecha || !formData.servicioId ? (
                  <div className="col-span-full text-center py-8 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 text-slate-600 text-sm italic">
                    Selecciona fecha y servicio primero para ver horarios
                  </div>
                ) : loadingSlots ? (
                  <div className="col-span-full text-center py-8 text-blue-500 text-sm flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando espacios...</span>
                  </div>
                ) : disponibilidad.filter(slot => slot.disponible).length > 0 ? (
                  disponibilidad.filter(slot => slot.disponible).map(slot => (
                    <button
                      key={slot.hora}
                      type="button"
                      onClick={() => setFormData({ ...formData, hora_inicio: slot.hora })}
                      className={`group relative p-4 rounded-2xl text-xs font-bold transition-all border flex flex-col items-center justify-center space-y-1 ${
                        formData.hora_inicio === slot.hora
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30 scale-105 z-10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-blue-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-[10px] opacity-60 uppercase tracking-tighter">
                        {parseInt(slot.hora.split(':')[0]) >= 12 ? 'Tarde' : 'Mañana'}
                      </span>
                      <span className="text-sm tracking-tight">{formatTimeAMPM(slot.hora)}</span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 bg-red-900/10 rounded-2xl border border-red-900/20 text-red-400 text-sm">
                    Lo sentimos, no hay espacios disponibles para este día
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={!formData.hora_inicio}
                className={`w-full py-4 rounded-2xl font-extrabold uppercase tracking-widest transition-all shadow-xl ${
                  formData.hora_inicio 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white transform active:scale-95 shadow-blue-600/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                Confirmar Agendamiento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Citas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {citas.map((cita) => (
          <div key={cita.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-xl">
            {/* Decoración de fondo */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-1 rounded-md">
                  {cita.servicio?.nombre || 'Servicio'}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  {new Date(cita.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="flex items-center text-slate-400 text-sm">
                  <span className="mr-2">⏰</span>
                  <span className="font-bold text-white">{cita.hora_inicio.substring(0, 5)}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cita.id)}
                className="p-2 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Información del Vehículo */}
              <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🏍️</div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Vehículo</p>
                    <p className="text-sm font-bold text-white">{cita.vehiculo?.placa} - {cita.vehiculo?.marca} {cita.vehiculo?.modelo}</p>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs text-blue-400">👤</div>
                  <div className="text-[10px]">
                    <p className="text-slate-500 uppercase font-bold tracking-tighter">Cliente</p>
                    <p className="text-slate-300">{cita.usuario?.nombre}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                  cita.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                }`}>
                  {cita.estado}
                </div>
              </div>
            </div>
          </div>
        ))}

        {citas.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-3xl border border-dashed border-slate-700 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl grayscale">📅</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No tienes citas agendadas</h3>
            <p className="text-slate-400">Empieza por agendar tu primer mantenimiento preventivo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Citas;
