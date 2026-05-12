import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Citas = ({ setView }) => {
  console.log('Citas component rendered');
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

      const readJsonOrThrow = async (response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        return response.json();
      };

      let hadError = false;

      try {
        const citasData = await readJsonOrThrow(citasRes);
        setCitas(Array.isArray(citasData) ? citasData : []);
      } catch (e) {
        hadError = true;
        console.error('Error fetching citas:', e);
        setCitas([]);
      }

      try {
        const vehiculosData = await readJsonOrThrow(vehiculosRes);
        setVehiculos(Array.isArray(vehiculosData) ? vehiculosData : []);
      } catch (e) {
        hadError = true;
        console.error('Error fetching vehiculos:', e);
        setVehiculos([]);
      }

      try {
        const serviciosData = await readJsonOrThrow(serviciosRes);
        setServicios(Array.isArray(serviciosData) ? serviciosData : []);
      } catch (e) {
        hadError = true;
        console.error('Error fetching servicios:', e);
        setServicios([]);
      }

      try {
        const empleadosData = await readJsonOrThrow(empleadosRes);
        const list = Array.isArray(empleadosData) ? empleadosData : [];
        setEmpleados(list.filter(e => e.estado === 'activo'));
      } catch (e) {
        hadError = true;
        console.error('Error fetching empleados:', e);
        setEmpleados([]);
      }

      if (hadError) setError('No se pudo conectar con el servidor');
    } catch (err) {
      setError('No se pudo conectar con el servidor');
      setLoading(false);
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
      if (!response.ok) {
        setDisponibilidad([]);
        return;
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setDisponibilidad([]);
        return;
      }
      const data = await response.json();
      setDisponibilidad(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar disponibilidad:', err);
      setDisponibilidad([]);
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

  const normalizeTimeToHms = (timeStr) => {
    if (!timeStr) return '';
    const parts = String(timeStr).split(':');
    const hh = (parts[0] || '00').padStart(2, '0');
    const mm = (parts[1] || '00').padStart(2, '0');
    const ss = (parts[2] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const addMinutesToHms = (timeStr, minutesToAdd) => {
    const normalized = normalizeTimeToHms(timeStr);
    if (!normalized) return '';
    const [hh, mm, ss] = normalized.split(':').map((v) => parseInt(v, 10));
    const base = new Date(2000, 0, 1, hh || 0, mm || 0, ss || 0);
    base.setMinutes(base.getMinutes() + (Number(minutesToAdd) || 0));
    const outH = String(base.getHours()).padStart(2, '0');
    const outM = String(base.getMinutes()).padStart(2, '0');
    const outS = String(base.getSeconds()).padStart(2, '0');
    return `${outH}:${outM}:${outS}`;
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
      
      const selectedServicio = servicios.find((s) => String(s.id) === String(formData.servicioId));
      const duracionMin = selectedServicio?.duracion ? Number(selectedServicio.duracion) : 60;
      const horaInicio = normalizeTimeToHms(formData.hora_inicio);
      const horaFin = addMinutesToHms(horaInicio, duracionMin);

      const payload = {
        fecha: formData.fecha,
        hora_inicio: horaInicio,
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
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errorData = await response.json();
          alert(errorData.message || 'Error al agendar cita');
        } else {
          const errorText = await response.text();
          alert(errorText || 'Error al agendar cita');
        }
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

  const citasPendientes = citas.filter(cita => cita.estado === "PENDIENTE" || cita.estado === "EN PROCESO");
  const historialServicios = citas.filter(cita => cita.estado === "FINALIZADO" || cita.estado === "CANCELADO");

  if (loading) {
    return (
      <div className="mx-container py-10">
        <div className="mx-card bg-white border-[var(--mx-border)] p-8">
          <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Cargando citas...</div>
        </div>
      </div>
    );
  }

  const shouldShowEmptyState = Boolean(error) || citas.length === 0;

  try {
    return (
      <div className="mx-container py-10 space-y-12">
      <section data-reveal className="mx-reveal mx-reveal--in mx-card bg-white border-[var(--mx-border)] p-8 mx-diagonal-cut overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8 relative">
            <div className="absolute -top-10 -left-2 mx-h1 text-[160px] leading-none text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none" aria-hidden="true">
              01
            </div>
            <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Reserva</div>
            <h1 className="mx-h1 text-[72px] sm:text-[86px] text-[var(--mx-text)]">
              CITAS<br />
              <span className="text-[var(--mx-blue)]">ONLINE</span>
            </h1>
            <div className="mt-4 text-[14px] text-[var(--mx-text-2)] max-w-[70ch]">
              Selecciona servicio, unidad, fecha, hora y especialista. Confirmación directa.
            </div>
          </div>

          <div className="lg:col-span-4">
            <button onClick={() => setShowForm(!showForm)} className={`w-full mx-btn ${showForm ? 'mx-btn-outline' : 'mx-btn-primary'} py-4 text-[11px]`}>
              {showForm ? 'Cerrar' : 'Nueva cita'}
            </button>
          </div>
        </div>
      </section>

      {shouldShowEmptyState && (
        <div data-reveal className="mx-reveal mx-reveal--in mx-card bg-white border-[var(--mx-border)] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">
                {error ? 'No se pudo conectar con el servidor' : 'No tienes citas registradas aún'}
              </div>
              <div className="mt-3 text-[13px] text-[var(--mx-text-2)]">
                {error ? 'Revisa tu conexión o intenta nuevamente.' : 'Cuando agendes una cita, aparecerá aquí.'}
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="mx-btn mx-btn-primary px-5 py-3 text-[11px]"
            >
              Agendar cita
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <section data-reveal className="mx-reveal mx-reveal--in">
          <div className="mx-card bg-white border-[var(--mx-border)] p-8">
            <div className="flex items-center gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Formulario</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">02</div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Servicio</label>
                  <select
                    name="servicioId"
                    value={formData.servicioId}
                    onChange={handleServicioChange}
                    className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]"
                    required
                  >
                    <option value="">Selecciona…</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Vehículo</label>
                  <select
                    name="vehiculoId"
                    value={formData.vehiculoId}
                    onChange={(e) => setFormData({ ...formData, vehiculoId: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]"
                    required
                  >
                    <option value="">Placa…</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} - {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.fecha}
                    onChange={handleDateChange}
                    className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-white text-[var(--mx-text)] outline-none focus:border-[var(--mx-blue)]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Hora</label>
                  <div className="mx-card bg-[var(--mx-bg-2)] border-[var(--mx-border)] p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--mx-text-2)]">
                        {loadingSlots ? 'Cargando…' : disponibilidad.filter((s) => s.disponible).length ? 'Disponibles' : 'Selecciona fecha y servicio'}
                      </div>
                      <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-blue)]">
                        {formData.hora_inicio ? formatTimeAMPM(formData.hora_inicio) : '—'}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {loadingSlots ? (
                        <div className="text-[12px] text-[var(--mx-text-2)]">Consultando disponibilidad…</div>
                      ) : (
                        disponibilidad
                          .filter((slot) => slot.disponible)
                          .map((slot) => (
                            <button
                              key={slot.hora}
                              type="button"
                              onClick={() => setFormData({ ...formData, hora_inicio: slot.hora })}
                              className={`px-4 py-2 rounded-[8px] border mx-subtitle text-[11px] tracking-[0.22em] uppercase transition-colors ${
                                formData.hora_inicio === slot.hora
                                  ? 'bg-[var(--mx-blue)] border-[var(--mx-blue)] text-white'
                                  : 'bg-white border-[var(--mx-border)] text-[var(--mx-text)] hover:border-[var(--mx-blue)]'
                              }`}
                            >
                              {slot.hora.substring(0, 5)}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Especialista</div>
                  <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empleados.map((empleado) => (
                    <button
                      type="button"
                      key={empleado.id}
                      onClick={() => setFormData({ ...formData, empleadoId: empleado.id.toString() })}
                      className={`text-left mx-card p-6 border transition-all ${
                        formData.empleadoId === empleado.id.toString()
                          ? 'bg-[var(--mx-bg-2)] border-[var(--mx-blue)]'
                          : 'bg-white border-[var(--mx-border)] hover:border-[var(--mx-blue)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mx-subtitle text-[12px] tracking-[0.18em] uppercase text-[var(--mx-text)] truncate">
                            {empleado.nombre || 'Especialista'}
                          </div>
                          <div className="mt-2 text-[12px] text-[var(--mx-text-2)]">{empleado.cargo || '—'}</div>
                          {empleado.especialidad && (
                            <div className="mt-3">
                              <span className="inline-flex px-3 py-2 rounded-[8px] mx-subtitle text-[10px] tracking-[0.22em] uppercase bg-[var(--mx-blue)] text-white">
                                {empleado.especialidad}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[var(--mx-blue)]">
                          {empleado.estado === 'activo' ? 'OK' : 'OFF'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!formData.hora_inicio || !formData.empleadoId} className={`w-full mx-btn py-4 text-[11px] ${formData.hora_inicio && formData.empleadoId ? 'mx-btn-primary' : 'mx-btn-outline opacity-40 cursor-not-allowed'}`}>
                Confirmar
              </button>
            </form>
          </div>
        </section>
      )}

      <section data-reveal className="mx-reveal mx-reveal--in space-y-6">
        <div className="flex items-center gap-6">
          <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Citas pendientes</div>
          <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
          <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">{citasPendientes.length}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citasPendientes.length > 0 ? (
            citasPendientes.map((cita) => {
              const estado = (cita.estado || '').toUpperCase();
              const badge =
                estado === 'PENDIENTE'
                  ? 'bg-[#C08A00] text-white'
                  : estado === 'EN PROCESO'
                    ? 'bg-[#0E9F6E] text-white'
                    : 'bg-[var(--mx-blue)] text-white';

              return (
                <div key={cita.id} className="mx-card mx-card-hover-up bg-white border-[var(--mx-border)] p-7 relative overflow-hidden">
                  <div className="absolute top-6 right-6 mx-h1 text-[54px] leading-none text-[var(--mx-blue)] opacity-[0.10] pointer-events-none">
                    {String(cita.id).slice(-2).padStart(2, '0')}
                  </div>

                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Orden #{cita.id}</div>
                      <div className="mt-2 mx-subtitle text-[14px] tracking-[0.12em] uppercase text-[var(--mx-text)] truncate">
                        {cita.servicio?.nombre || 'Servicio'}
                      </div>
                      <div className="mt-2 text-[12px] text-[var(--mx-text-2)]">
                        {cita.vehiculo?.placa || '—'} · {cita.vehiculo?.modelo || '—'}
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-[8px] mx-subtitle text-[10px] tracking-[0.22em] uppercase ${badge}`}>
                      {cita.estado}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-t-[var(--mx-border)] pt-5">
                    <div>
                      <div className="mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Fecha</div>
                      <div className="mt-1 text-[12px] text-[var(--mx-text)]">{new Date(cita.fecha).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Hora</div>
                      <div className="mt-1 text-[12px] text-[var(--mx-text)]">{formatTimeAMPM(cita.hora_inicio?.substring(0, 5))}</div>
                    </div>
                  </div>

                  <button onClick={() => handleDelete(cita.id)} className="mt-6 w-full mx-btn mx-btn-outline py-3 text-[11px]">
                    Eliminar
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full">
              <div className="mx-card bg-white border-[var(--mx-border)] p-10 text-center">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Sin pendientes</div>
                <div className="mt-3 text-[13px] text-[var(--mx-text-2)]">No hay citas pendientes actualmente.</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section data-reveal className="mx-reveal mx-reveal--in">
        <div className="mx-card bg-white border-[var(--mx-border)] overflow-hidden">
          <div className="px-8 py-7 border-b border-b-[var(--mx-border)] flex items-center gap-6">
            <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Historial</div>
            <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
            <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">03</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  {["ID", "SERVICIO", "VEHÍCULO", "FECHA", "HORA", "TRABAJADOR", "ESTADO"].map((head) => (
                    <th key={head} className="px-8 py-4 text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)] font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historialServicios.length > 0 ? (
                  historialServicios.map((cita) => {
                    const estado = (cita.estado || '').toUpperCase();
                    const badge =
                      estado === 'FINALIZADO'
                        ? 'bg-[var(--mx-blue)] text-white'
                        : estado === 'PENDIENTE'
                          ? 'bg-[#C08A00] text-white'
                          : estado === 'EN PROCESO'
                            ? 'bg-[#0E9F6E] text-white'
                            : 'bg-[#C1121F] text-white';

                    return (
                      <tr
                        key={cita.id}
                        className="group relative odd:bg-white even:bg-[var(--mx-bg-2)] transition-colors before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0 before:bg-[var(--mx-blue)] before:transition-all before:duration-200 before:ease-out group-hover:before:w-[3px]"
                      >
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">#{cita.id}</td>
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text)]">{cita.servicio?.nombre || '—'}</td>
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">{cita.vehiculo?.placa || '—'}</td>
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">{new Date(cita.fecha).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">{formatTimeAMPM(cita.hora_inicio?.substring(0, 5))}</td>
                        <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">{cita.empleado?.nombre || '—'}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-2 rounded-[8px] mx-subtitle text-[10px] tracking-[0.22em] uppercase ${badge}`}>
                            {cita.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-8 py-12 text-center text-[13px] text-[var(--mx-text-2)]">
                      No hay servicios en el historial.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      </div>
    );
  } catch (e) {
    console.error('Citas render error:', e);
    return (
      <div className="mx-container py-10">
        <div className="mx-card bg-white border-[var(--mx-border)] p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">No tienes citas registradas aún</div>
              <div className="mt-3 text-[13px] text-[var(--mx-text-2)]">Si ocurre un error, este panel igual debe mostrarse.</div>
            </div>
            <button onClick={() => setShowForm(true)} className="mx-btn mx-btn-primary px-5 py-3 text-[11px]">
              Agendar cita
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default Citas;
