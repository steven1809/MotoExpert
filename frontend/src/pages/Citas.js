import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useVehicleGuard } from '../hooks/useVehicleGuard';
import NoVehicleWarning from '../components/NoVehicleWarning';
import DuplicateBookingWarning from '../components/DuplicateBookingWarning';
import AppointmentsSearchAndFilter from '../components/AppointmentsSearchAndFilter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AppointmentChatModal = ({ isOpen, onClose, alert }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const listRef = useRef(null);
  const socketRef = useRef(null);

  const appointmentId = alert?.appointmentId;
  const headerService = (alert?.serviceName || 'Servicio').toUpperCase();
  const headerPlate = (alert?.vehiclePlate || '—').toUpperCase();
  const headerMinutes = Number(alert?.minutesOverdue || 0);

  const role = (localStorage.getItem('role') || '').toLowerCase();
  const senderBadge = useMemo(() => {
    if (role === 'admin' || role === 'empleado' || role === 'trabajador') return 'STAFF';
    return 'CLIENT';
  }, [role]);
  const isStaff = senderBadge === 'STAFF';

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('token');
    if (!token || !appointmentId) return;

    let mounted = true;
    setLoading(true);
    fetch(`${API_BASE_URL}/citas/${appointmentId}/chat`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!mounted) return;
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (!isOpen) return;
    const token = localStorage.getItem('token');
    if (!token || !appointmentId) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join_chat', { appointmentId });

    const handleNewMessage = (payload) => {
      const pid = payload?.appointmentId ?? payload?.appointment_id ?? payload?.appointmentId;
      if (Number(pid) !== Number(appointmentId)) return;
      setMessages((prev) => {
        const id = payload?.id;
        if (id && prev.some((m) => m.id === id)) return prev;
        const msg = {
          id: payload?.id || `rt:${Date.now()}`,
          appointment_id: appointmentId,
          sender_id: payload?.senderId ?? payload?.sender_id,
          sender_role: payload?.senderRole ?? payload?.sender_role,
          message: payload?.message,
          created_at: payload?.createdAt ?? payload?.created_at ?? new Date().toISOString(),
        };
        return [...prev, msg];
      });
    };

    socket.on('new_message', handleNewMessage);

    const handleResolved = (payload) => {
      if (Number(payload?.appointmentId) !== Number(appointmentId)) return;
      if (onClose) onClose();
    };
    socket.on('appointment_resolved', handleResolved);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('appointment_resolved', handleResolved);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isOpen, appointmentId]);

  useEffect(() => {
    if (!isOpen) return;
    const onGlobalResolved = (e) => {
      const appointmentIdFromEvent = e?.detail?.appointmentId;
      if (Number(appointmentIdFromEvent) !== Number(appointmentId)) return;
      if (onClose) onClose();
    };
    window.addEventListener('motoexpert:appointment_resolved', onGlobalResolved);
    return () => window.removeEventListener('motoexpert:appointment_resolved', onGlobalResolved);
  }, [isOpen, appointmentId, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const send = () => {
    const socket = socketRef.current;
    const message = text.trim();
    if (!socket || !message || !appointmentId) return;
    socket.emit('send_message', { appointmentId, message });
    setText('');
  };

  const resolve = (resolutionType) => {
    const socket = socketRef.current;
    if (!socket || !appointmentId) return;
    socket.emit('resolve_appointment', { appointmentId, resolutionType });
    setShowResolve(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="w-full max-w-[560px] bg-[#0f1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-black text-white">
              {headerService} — {headerPlate}
            </div>
            <div className="text-xs text-[#EF9F27] font-bold mt-1">
              {headerMinutes} minutes overdue
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isStaff && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowResolve((v) => !v)}
                  className="h-10 px-3 rounded-xl bg-[#EF9F27]/10 hover:bg-[#EF9F27]/15 border border-[#EF9F27]/25 text-[#EF9F27] text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Mark as Resolved
                </button>
                {showResolve && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#0b1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
                    <button
                      type="button"
                      onClick={() => resolve('Completado')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Completado
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve('Reprogramado')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Reprogramado
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-sm text-white/60">Loading chat…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-white/60">No messages yet.</div>
          ) : (
            messages.map((m) => {
              const badge = (m.sender_role || '').toUpperCase() === 'STAFF' ? 'STAFF' : 'CLIENT';
              const badgeClass =
                badge === 'STAFF'
                  ? 'bg-[#2563EB]/15 text-[#7b9cff] border-[#2563EB]/25'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              const ts = m.created_at ? new Date(m.created_at).toLocaleString() : '';
              return (
                <div key={m.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${badgeClass}`}>
                      {badge}
                    </span>
                    <span className="text-[11px] text-white/50">{ts}</span>
                  </div>
                  <div className="text-sm text-white mt-3 whitespace-pre-wrap break-words">
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder={`Message as ${senderBadge}...`}
              className="flex-1 h-11 px-4 bg-[#0b1220] border border-white/10 rounded-xl text-white placeholder-white/40 outline-none focus:border-[#2563EB]/50"
            />
            <button
              type="button"
              onClick={send}
              className="h-11 px-5 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Citas = ({
  setView,
  overdueAlerts = [],
  onDismissOverdueAlert,
  onOpenOverdueChat,
  onViewOverdueAppointment,
}) => {
  const { hasVehicles, loading: loadingVehicles } = useVehicleGuard();
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [existingDuplicateBooking, setExistingDuplicateBooking] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    fromDate: '',
    toDate: '',
    serviceFilter: '',
    vehicleTypeFilter: '',
    statusFilters: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(7);
  const [alertToCancel, setAlertToCancel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processedCitas, setProcessedCitas] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAlert, setChatAlert] = useState(null);
  
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
    
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (loading) return;
    const focusCitaId = localStorage.getItem('focusCitaId');
    if (!focusCitaId) return;
    const el = document.getElementById(`cita-${focusCitaId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      localStorage.removeItem('focusCitaId');
    }
  }, [loading, citas]);

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

  const fetchDisponibilidad = async (fecha, servicioId, empleadoId = null) => {
    if (!fecha || !servicioId) return;
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/citas/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`;
      if (empleadoId) url += `&empleadoId=${empleadoId}`;
      const response = await fetch(url, {
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

  const getCitaTimeInfo = (cita) => {
    const citaDateStr = cita.fecha;
    const citaTimeStr = cita.hora_inicio?.substring(0, 5); // HH:MM
    const citaDateTimeStr = `${citaDateStr}T${citaTimeStr}`;
    const citaDateTime = new Date(citaDateTimeStr);
    const now = currentTime;
    
    const timeUntilStartMs = citaDateTime - now;
    const timePastStartMs = now - citaDateTime;
    const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
    
    return {
      citaDateTime,
      timeUntilStartMs,
      timePastStartMs,
      isOverdue: timePastStartMs > 0 && cita.estado === 'PENDIENTE',
      isInGracePeriod: timePastStartMs > 0 && timePastStartMs <= gracePeriodMs,
      isPastGracePeriod: timePastStartMs > gracePeriodMs && cita.estado === 'PENDIENTE',
      gracePeriodRemainingMs: gracePeriodMs - timePastStartMs,
    };
  };

  const formatCountdown = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const cancelCita = async (citaId) => {
    if (processedCitas.has(citaId)) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/citas/${citaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'CANCELADO' }),
      });
      
      if (response.ok) {
        setProcessedCitas(prev => new Set([...prev, citaId]));
        setCitas(prev => prev.map(c => 
          c.id === citaId ? { ...c, estado: 'CANCELADO' } : c
        ));
      }
    } catch (err) {
      console.error('Error canceling cita:', err);
    }
  };

  useEffect(() => {
    // Check for overdue appointments
    citas.forEach(cita => {
      if (cita.estado !== 'PENDIENTE') return;
      
      const timeInfo = getCitaTimeInfo(cita);
      if (timeInfo.isPastGracePeriod && !processedCitas.has(cita.id)) {
        cancelCita(cita.id);
      }
    });
  }, [currentTime, citas, processedCitas]);

  const handleDateChange = (e) => {
    const fecha = e.target.value;
    setFormData({ ...formData, fecha, hora_inicio: '' });
    setDisponibilidad([]);
  };

  const handleServicioChange = (e) => {
    const servicioId = e.target.value;
    setFormData({ ...formData, servicioId, hora_inicio: '' });
    setDisponibilidad([]);
  };

  const handleEmpleadoSelect = (empleadoId) => {
    const newEmpleadoId = empleadoId.toString();
    setFormData(prev => ({ ...prev, empleadoId: newEmpleadoId, hora_inicio: '' }));
    setDisponibilidad([]);
    if (formData.fecha && formData.servicioId) {
      fetchDisponibilidad(formData.fecha, formData.servicioId, empleadoId);
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

  const getFilteredSlots = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const selectedDate = formData.fecha;
    const isToday = selectedDate === today;

    let availableSlots = disponibilidad.filter(slot => slot.disponible);

    if (isToday) {
      availableSlots = availableSlots.filter(slot => {
        const [hours, minutes] = slot.hora.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(hours, minutes, 0, 0);
        const minTime = new Date(now.getTime() + 30 * 60 * 1000);
        return slotDate >= minTime;
      });
    }

    return availableSlots;
  };

  const checkForDuplicateBooking = () => {
    // Find selected vehicle and service from state
    const selectedVehicle = vehiculos.find(v => v.id.toString() === formData.vehiculoId);
    const selectedService = servicios.find(s => s.id.toString() === formData.servicioId);

    if (!selectedVehicle || !selectedService) return null;

    // Look for duplicate in existing citas
    const duplicate = citas.find(cita => 
      cita.vehiculo?.id === selectedVehicle.id &&
      cita.servicio?.id === selectedService.id &&
      cita.fecha === formData.fecha &&
      cita.hora_inicio !== formData.hora_inicio
    );

    return duplicate;
  };

  const confirmSubmit = async () => {
    // Close the modal
    setShowDuplicateWarning(false);
    setExistingDuplicateBooking(null);

    // Proceed with original submit logic
    await doSubmit();
  };

  const doSubmit = async () => {
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
        const created = await response.json().catch(() => null);
        const appointmentId = created?.id;
        const selectedVehicle = vehiculos.find(
          (v) => v.id?.toString() === formData.vehiculoId?.toString(),
        );
        const selectedService = servicios.find(
          (s) => s.id?.toString() === formData.servicioId?.toString(),
        );

        setShowForm(false);
        setFormData({ fecha: '', hora_inicio: '', vehiculoId: '', servicioId: '', empleadoId: '' });
        fetchInitialData();

        if (appointmentId) {
          try {
            window.history.pushState(
              {
                appointmentId,
                summary: {
                  fecha: payload.fecha,
                  hora_inicio: payload.hora_inicio,
                  servicio: selectedService?.nombre || 'Servicio',
                  vehiculo: selectedVehicle
                    ? `${selectedVehicle.placa || ''}${selectedVehicle.modelo ? ` - ${selectedVehicle.modelo}` : ''}`.trim()
                    : 'Vehículo',
                },
              },
              '',
              '/appointments/payment',
            );
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch {
            window.location.assign('/appointments/payment');
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al agendar cita');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for duplicate first
    const duplicate = checkForDuplicateBooking();
    if (duplicate) {
      setExistingDuplicateBooking(duplicate);
      setShowDuplicateWarning(true);
      return;
    }

    // No duplicate, proceed normally
    await doSubmit();
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

  const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
      }, []);

      const handleRowsPerPageChange = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setCurrentPage(1);
      };

      const getFilteredCitas = useCallback((citasArray) => {
      let filtered = [...citasArray];

      // Search term filter (for history: service, vehicle, worker)
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();

        filtered = filtered.filter(cita => {
          const serviceName = cita.servicio?.nombre?.toLowerCase() || '';
          const vehiclePlate = cita.vehiculo?.placa?.toLowerCase() || '';
          const vehicleModel = cita.vehiculo?.modelo?.toLowerCase() || '';
          const workerName = cita.empleado?.nombre?.toLowerCase() || '';

          return (
            serviceName.includes(term) ||
            vehiclePlate.includes(term) ||
            vehicleModel.includes(term) ||
            workerName.includes(term)
          );
        });
      }

      // Date range filter
      if (filters.fromDate) {
        filtered = filtered.filter(
          cita => cita.fecha >= filters.fromDate
        );
      }

      if (filters.toDate) {
        filtered = filtered.filter(
          cita => cita.fecha <= filters.toDate
        );
      }

      // Service filter
      if (filters.serviceFilter) {
        filtered = filtered.filter(
          cita => cita.servicio?.nombre === filters.serviceFilter
        );
      }

      // Vehicle type filter
      if (filters.vehicleTypeFilter) {
        filtered = filtered.filter(
          cita => cita.vehiculo?.tipo === filters.vehicleTypeFilter
        );
      }

      // Status filter
      if (filters.statusFilters.length > 0) {
        filtered = filtered.filter(cita =>
          filters.statusFilters.includes(cita.estado)
        );
      }

      return filtered;
    }, [filters]);

    const citasPendientes = citas.filter(
      cita => cita.estado === "PENDIENTE" || cita.estado === "EN PROCESO"
    );

    const allHistorialServicios = citas.filter(
      cita => cita.estado === "FINALIZADO" || cita.estado === "CANCELADO"
    );

    const historialServicios = getFilteredCitas(allHistorialServicios);

    const getPaginatedHistory = useCallback(() => {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;

      return historialServicios.slice(start, end);
    }, [currentPage, rowsPerPage, historialServicios]);

    const getPageNumbers = useCallback(() => {
      const totalPages = Math.ceil(
        historialServicios.length / rowsPerPage
      );

      const pageNumbers = [];
      const maxVisible = 5;

      let start = Math.max(
        1,
        currentPage - Math.floor(maxVisible / 2)
      );

      let end = Math.min(
        totalPages,
        start + maxVisible - 1
      );

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      return pageNumbers;
    }, [currentPage, rowsPerPage, historialServicios]);

    const getAlerts = useCallback(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
      const alerts = [];

      citas.forEach(cita => {
        const citaDate = cita.fecha;
        const isToday = citaDate === today;
        const isTomorrow = citaDate === tomorrow;
        const isExpired = citaDate < today && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO');

        if (cita.estado === 'EN PROCESO') {
          alerts.push({
            id: `in-progress-${cita.id}`,
            type: 'in-progress',
            cita,
            priority: 1
          });
        } else if (isToday && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO')) {
          alerts.push({
            id: `today-${cita.id}`,
            type: 'today',
            cita,
            priority: 2
          });
        } else if (isTomorrow && (cita.estado === 'PENDIENTE' || cita.estado === 'RESERVADO')) {
          alerts.push({
            id: `upcoming-${cita.id}`,
            type: 'upcoming',
            cita,
            priority: 3
          });
        } else if (isExpired) {
          alerts.push({
            id: `expired-${cita.id}`,
            type: 'expired',
            cita,
            priority: 4
          });
        }
      });

      return alerts.sort((a, b) => a.priority - b.priority);
    }, [citas]);

    const handleViewAppointment = (cita) => {
      // Scroll to Citas Pendientes section
      const section = document.querySelector('.citas-pendientes-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const handleReschedule = (cita) => {
      setShowForm(true);
      setFormData({
        fecha: '',
        hora_inicio: '',
        vehiculoId: cita.vehiculo?.id.toString() || '',
        servicioId: cita.servicio?.id.toString() || '',
        empleadoId: ''
      });
    };

    const handleCancelAppointment = async (cita) => {
      if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/citas/${cita.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          fetchInitialData();
          setAlertToCancel(null);
        }
      } catch (err) {
        console.error('Error canceling appointment:', err);
      }
    };

    const getAlertStyle = (type) => {
      switch (type) {
        case 'in-progress':
          return {
            bg: 'bg-[#1D9E75]/8',
            border: 'border-[#1D9E75]/25',
            color: '#1D9E75',
            iconBg: 'bg-[#1D9E75]/15'
          };
        case 'today':
          return {
            bg: 'bg-[#378ADD]/8',
            border: 'border-[#378ADD]/25',
            color: '#378ADD',
            iconBg: 'bg-[#378ADD]/15'
          };
        case 'upcoming':
          return {
            bg: 'bg-[#EF9F27]/8',
            border: 'border-[#EF9F27]/25',
            color: '#EF9F27',
            iconBg: 'bg-[#EF9F27]/15'
          };
        case 'expired':
          return {
            bg: 'bg-[#E24B4A]/8',
            border: 'border-[#E24B4A]/25',
            color: '#E24B4A',
            iconBg: 'bg-[#E24B4A]/15'
          };
        default:
          return {
            bg: 'bg-[#2a2d3a]/8',
            border: 'border-[#2a2d3a]/25',
            color: '#94A3B8',
            iconBg: 'bg-[#2a2d3a]/15'
          };
      }
    };

    const getAlertIcon = (type) => {
      switch (type) {
        case 'in-progress':
          return (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.572c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          );
        case 'today':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case 'upcoming':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case 'expired':
          return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          );
        default:
          return null;
      }
    };

    const getAlertTitle = (type, cita) => {
      const isToday = cita.fecha === new Date().toISOString().split('T')[0];
      switch (type) {
        case 'in-progress':
          return 'Service in progress';
        case 'today':
          return 'You have a service today';
        case 'upcoming':
          return isToday ? 'Upcoming service today' : 'Upcoming service tomorrow';
        case 'expired':
          return 'Expired appointment';
        default:
          return '';
      }
    };

    const getAlertMessage = (type, cita) => {
      const serviceName = cita.servicio?.nombre || 'Service';
      const plate = cita.vehiculo?.placa || 'vehicle';
      const date = new Date(cita.fecha).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = cita.hora_inicio?.substring(0, 5) || '';

      switch (type) {
        case 'in-progress':
          return `Your ${serviceName} for ${plate} is currently being performed by your specialist.`;
        case 'today':
          return `${serviceName} for ${plate} at ${time}. Your specialist will be ready for you.`;
        case 'upcoming':
          return `${serviceName} for vehicle ${plate} is scheduled for ${date} at ${time}.`;
        case 'expired':
          return `Your ${serviceName} appointment for ${plate} on ${date} was not completed. Would you like to reschedule?`;
        default:
          return '';
      }
    };

    const hasActiveFilters =
      filters.searchTerm ||
      filters.fromDate ||
      filters.toDate ||
      filters.serviceFilter ||
      filters.vehicleTypeFilter ||
      filters.statusFilters.length > 0;

  if (loading || loadingVehicles) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasVehicles) {
    return <NoVehicleWarning setView={setView} />;
  }

  return (
    <>
      {showDuplicateWarning && existingDuplicateBooking && (
        <DuplicateBookingWarning 
          existingBooking={existingDuplicateBooking} 
          onConfirm={confirmSubmit}
          onCancel={() => {
            setShowDuplicateWarning(false);
            setExistingDuplicateBooking(null);
          }}
        />
      )}
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
      <header className="relative py-20 px-10 overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6 bg-slate-100 dark:bg-[#111827]">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#2563EB]/10 rounded-full blur-[100px]" />
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-block px-4 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em]">Reserva Online</div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-[#F8FAFC] italic tracking-tighter uppercase leading-none">
            Agenda tu <span className="text-[#2563EB]">Cita</span>
          </h1>
          <p className="text-slate-500 dark:text-[#94A3B8] text-lg font-medium max-w-xl mx-auto italic">Selecciona el tratamiento premium para tu vehículo.</p>
        </div>
      </header>

      <div className="container mx-auto px-6 space-y-12">
        <AppointmentChatModal
          isOpen={chatOpen}
          alert={chatAlert}
          onClose={() => {
            setChatOpen(false);
            setChatAlert(null);
          }}
        />

        {overdueAlerts.length > 0 && (
          <div className="space-y-3">
            {overdueAlerts.map((a) => {
              const serviceName = (a.serviceName || 'Servicio').toUpperCase();
              const plate = (a.vehiclePlate || '—').toUpperCase();
              const minutes = Number(a.minutesOverdue || 0);
              return (
                <div
                  key={a.appointmentId}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-[#EF9F27]/10 border border-[#EF9F27]/25"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EF9F27]/10 border border-[#EF9F27]/25 flex items-center justify-center text-[#EF9F27] flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-[#EF9F27]">
                        {serviceName} — {plate} is {minutes} minutes overdue
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        Expected end: {a.expectedEndTime ? new Date(a.expectedEndTime).toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setChatAlert(a);
                        setChatOpen(true);
                        if (onOpenOverdueChat) onOpenOverdueChat(a);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                      Open Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewOverdueAppointment) onViewOverdueAppointment(a.appointmentId);
                        const el = document.getElementById(`cita-${a.appointmentId}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 transition-all active:scale-95"
                    >
                      View Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissOverdueAlert && onDismissOverdueAlert(a.appointmentId)}
                      className="w-10 h-10 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
                      aria-label="Dismiss"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-8 py-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-95"
          >
            {showForm ? 'Cerrar Formulario' : 'Nueva Cita Premium'}
          </button>
        </div>

        {/* Alerts Section */}
        {getAlerts().length > 0 && (
          <div className="space-y-2 mb-6">
            {getAlerts().map(alert => {
              const style = getAlertStyle(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${style.bg} ${style.border}`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg}`} style={{ color: style.color }}>
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: style.color }}>
                      {getAlertTitle(alert.type, alert.cita)}
                    </div>
                    <div className="text-xs text-[#9ca3af] mt-1">
                      {getAlertMessage(alert.type, alert.cita)}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alert.type === 'in-progress' ? null : alert.type === 'expired' ? (
                      <>
                        <button
                          onClick={() => handleReschedule(alert.cita)}
                          className="px-3 py-1.5 text-xs font-bold border rounded-xl transition-all hover:bg-[#2563EB]/10"
                          style={{ borderColor: style.color, color: style.color }}
                        >
                          Reschedule →
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(alert.cita)}
                          className="px-3 py-1.5 text-xs font-bold border rounded-xl transition-all hover:bg-[#E24B4A]/10"
                          style={{ borderColor: '#E24B4A', color: '#E24B4A' }}
                        >
                          Cancel appointment
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleViewAppointment(alert.cita)}
                        className="px-3 py-1.5 text-xs font-bold border rounded-xl transition-all hover:bg-[#2563EB]/10"
                        style={{ borderColor: style.color, color: style.color }}
                      >
                        {alert.type === 'today' ? 'View details →' : 'View appointment →'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulario Estilo Tesla */}
        {showForm && (
          <div className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top duration-500">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">
                    Servicio Detailing
                  </label>
                  <select
                    name="servicioId"
                    value={formData.servicioId}
                    onChange={handleServicioChange}
                    className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  >
                    <option value="">Seleccione el tratamiento...</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  
                  {formData.servicioId && (() => {
                    const servicioSeleccionado = servicios.find(s => s.id.toString() === formData.servicioId.toString());
                    return servicioSeleccionado ? (
                      <div className="mt-3 p-4 bg-[#2563EB]/5 border border-[#2563EB]/20 rounded-2xl animate-in fade-in duration-300 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[#2563EB] text-sm">✦</span>
                          <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">
                            ¿Qué incluye?
                          </span>
                        </div>

                        {/* Descripción del servicio */}
                        {servicioSeleccionado.descripcion && (
                          <p className="text-slate-500 dark:text-[#94A3B8] text-xs font-medium italic leading-relaxed">
                            {servicioSeleccionado.descripcion}
                          </p>
                        )}

                        {/* Precio y duración si los tienes en el objeto */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {servicioSeleccionado.precio && (
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                              💰 ${servicioSeleccionado.precio.toLocaleString()}
                            </span>
                          )}
                          {servicioSeleccionado.duracion && (
                            <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                              ⏱ {servicioSeleccionado.duracion} min
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Unidad a Tratar</label>
                  <select
                    name="vehiculoId"
                    value={formData.vehiculoId}
                    onChange={(e) => setFormData({...formData, vehiculoId: e.target.value})}
                    className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  >
                    <option value="">Placa...</option>
                    {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    name="fecha"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.fecha}
                    onChange={handleDateChange}
                    className="w-full p-4 bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-900 dark:text-[#F8FAFC] font-bold focus:border-[#2563EB]/50 transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1 text-[#2563EB]">Slots Disponibles</label>
                  <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-4 bg-white dark:bg-[#020617] rounded-2xl border border-slate-200 dark:border-white/5">
                    {loadingSlots ? (
                      <div className="w-full text-center py-2 text-slate-500 dark:text-[#94A3B8] text-xs italic">Consultando disponibilidad...</div>
                    ) : (() => {
                      const filteredSlots = getFilteredSlots();
                      const now = new Date();
                      const today = now.toISOString().split('T')[0];
                      const isToday = formData.fecha === today;

                      if (filteredSlots.length === 0 && isToday && formData.empleadoId) {
                        return (
                          <div className="w-full p-4 text-center bg-[rgba(234,75,74,0.08)] border border-[#E24B4A] rounded-xl">
                            <p className="text-[#E24B4A] text-sm font-bold italic">
                              No available time slots for today. Please select another date.
                            </p>
                          </div>
                        );
                      }

                      if (filteredSlots.length > 0) {
                        return filteredSlots.map(slot => (
                          <button
                            key={slot.hora}
                            type="button"
                            onClick={() => setFormData({ ...formData, hora_inicio: slot.hora })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                              formData.hora_inicio === slot.hora 
                                ? 'bg-[#2563EB] border-[#2563EB] text-slate-900 dark:text-white' 
                                : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/5 text-slate-500 dark:text-[#94A3B8] hover:border-white/20'
                            }`}
                          >
                            {slot.hora.substring(0, 5)}
                          </button>
                        ));
                      }

                      return (
                        <div className="w-full text-center py-2 text-slate-500 dark:text-[#94A3B8] text-xs italic">
                          {!formData.empleadoId 
                            ? 'Selecciona un especialista para ver horarios' 
                            : 'No hay horarios disponibles para este especialista'}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Selector de Especialista Premium */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-widest ml-1">Selecciona tu Especialista</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {empleados.map(empleado => {
                    const isSelected = formData.empleadoId === empleado.id.toString();
                    const isLoading = isSelected && loadingSlots && formData.fecha && formData.servicioId;
                    
                    return (
                      <div
                        key={empleado.id}
                        onClick={() => handleEmpleadoSelect(empleado.id)}
                        className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 group ${
                          isSelected
                            ? 'bg-[#2563EB]/10 border-[#2563EB] shadow-2xl shadow-[#2563EB]/20'
                            : 'bg-slate-100 dark:bg-[#111827] border-white/10 hover:border-[#2563EB]/40 hover:shadow-xl'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-2xl border border-[#2563EB]/30 group-hover:scale-110 transition-transform">
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#2563EB]"></div>
                            ) : (
                              '👤'
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{empleado.nombre || 'Especialista'}</h4>
                            <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest">
                              {empleado.estado === 'activo' ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                        </div>
                        {empleado.cargo && (
                          <p className="text-sm text-slate-500 dark:text-[#94A3B8] font-medium italic">
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
                        {isSelected && !isLoading && (
                          <div className="mt-3 flex items-center gap-2 text-[#2563EB] text-xs font-black uppercase tracking-widest">
                            <span className="animate-pulse">✓</span> Seleccionado
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                disabled={!formData.hora_inicio}
                className={`w-full py-5 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all ${
                  formData.hora_inicio 
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-slate-900 dark:text-white shadow-2xl shadow-[#2563EB]/20' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Confirmar Reserva Premium
              </button>
            </form>
          </div>
        )}

        {/* Sección Citas Pendientes */}
        <div className="space-y-6 citas-pendientes-section">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">
              Citas Pendientes
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {citasPendientes.length > 0 ? (
              citasPendientes.map(cita => {
                const timeInfo = getCitaTimeInfo(cita);
                const countdown = formatCountdown(timeInfo.gracePeriodRemainingMs);
                const isUnderTwoMinutes = timeInfo.gracePeriodRemainingMs > 0 && timeInfo.gracePeriodRemainingMs < 2 * 60 * 1000;
                
                return (
                <div id={`cita-${cita.id}`} key={cita.id} className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] hover:border-[#2563EB]/30 transition-all duration-500 space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">#{cita.id}</span>
                  </div>
                  
                  {/* Overdue Warning Banner */}
                  {timeInfo.isOverdue && cita.estado === 'PENDIENTE' && (
                    <div className="relative z-10 p-4 rounded-2xl bg-[#EF9F27]/10 border border-[#EF9F27]/25 space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#EF9F27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[#EF9F27]">
                            ⚠️ Your appointment was scheduled for {cita.hora_inicio.substring(0, 5)}.
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            You have {countdown} to start the service or it will be automatically cancelled.
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${isUnderTwoMinutes ? 'text-[#E24B4A]' : 'text-[#EF9F27]'}`}>
                          {countdown}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start relative z-10">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      cita.estado === 'PENDIENTE' 
                        ? timeInfo.isInGracePeriod 
                          ? 'bg-[#EF9F27]/10 text-[#EF9F27] border-[#EF9F27]/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {cita.estado === 'PENDIENTE' && timeInfo.isInGracePeriod ? 'TARDÍO' : cita.estado}
                    </span>
                    <button
                      onClick={() => handleDelete(cita.id)}
                      className="p-2 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg relative z-20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] uppercase italic tracking-tighter">{cita.servicio?.nombre}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-[#2563EB] uppercase tracking-widest bg-[#2563EB]/5 px-2 py-0.5 rounded border border-[#2563EB]/10">{cita.vehiculo?.placa}</span>
                      <span className="text-slate-500 dark:text-[#94A3B8] text-xs font-bold uppercase tracking-widest italic">{cita.vehiculo?.modelo}</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-xs relative z-10">
                    <div className="flex items-center text-slate-500 dark:text-[#94A3B8] font-bold italic uppercase tracking-widest">
                      <span className="mr-2 opacity-50">📅</span>
                      {new Date(cita.fecha).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-slate-900 dark:text-[#F8FAFC] font-black italic">
                      <span className="mr-2 opacity-50 text-[#2563EB]">⏰</span>
                      {cita.hora_inicio.substring(0, 5)}
                    </div>
                  </div>
                </div>
              )})
            ) : (
              <div className="col-span-full py-16 text-center bg-slate-100 dark:bg-[#111827]/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium text-sm">No hay citas pendientes actualmente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sección Historial de Servicios */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">
              Historial de Servicios
              {hasActiveFilters && (
                <span className="ml-3 text-sm font-bold text-[#94A3B8]">
                  ({historialServicios.length} of {allHistorialServicios.length})
                </span>
              )}
            </h2>
          </div>

          {/* Search and Filter Bar for History */}
          <AppointmentsSearchAndFilter 
            citas={citas} 
            onFilterChange={handleFilterChange}
            searchPlaceholder="Search history by service, vehicle or worker..."
          />

          <div className="bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl bg-opacity-80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#020617]/50">
                    {["ID", "SERVICIO", "VEHÍCULO", "FECHA", "HORA", "TRABAJADOR", "ESTADO"].map((head) => (
                      <th key={head} className="px-6 py-5 text-[10px] font-black text-slate-500 dark:text-[#94A3B8] uppercase tracking-[0.2em]">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getPaginatedHistory().length > 0 ? (
                    getPaginatedHistory().map((cita) => (
                      <tr key={cita.id} className="hover:bg-[#2563EB]/5 transition-all duration-300 group">
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-500 dark:text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">#{cita.id}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-900 dark:text-[#F8FAFC] uppercase italic tracking-tighter">{cita.servicio?.nombre}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded border border-[#2563EB]/20">{cita.vehiculo?.placa}</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase italic">{cita.vehiculo?.modelo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center text-slate-500 dark:text-[#94A3B8] text-[11px] font-bold italic uppercase tracking-wider">
                            <span className="mr-2 opacity-50">📅</span>
                            {new Date(cita.fecha).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center text-slate-900 dark:text-[#F8FAFC] text-[11px] font-black italic">
                            <span className="mr-2 opacity-50 text-[#2563EB]">⏰</span>
                            {cita.hora_inicio.substring(0, 5)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[10px]">👤</div>
                            <span className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">{cita.empleado?.nombre || 'Por asignar'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${
                            cita.estado === 'FINALIZADO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-900 dark:text-white' :
                            cita.estado === 'PENDIENTE' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-900 dark:text-white' :
                            'bg-red-500/10 text-red-500 border-red-500/20 group-hover:bg-red-500 group-hover:text-slate-900 dark:text-white'
                          }`}>
                            {cita.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center text-slate-500 dark:text-[#94A3B8] italic font-medium text-sm space-y-3">
                        <p>
                          {hasActiveFilters ? "No history items match the selected filters." : "No hay servicios finalizados en el historial."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={() => setFilters({
                              searchTerm: '',
                              fromDate: '',
                              toDate: '',
                              serviceFilter: '',
                              vehicleTypeFilter: '',
                              statusFilters: []
                            })}
                            className="text-[#2563EB] text-sm font-bold hover:text-[#1d4ed8] transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {historialServicios.length > 0 && (
              <div className="px-6 py-3 border-t border-[#2a2d3a] flex items-center justify-between">
                {/* Left: Showing x-y of z results */}
                <div className="text-[#94A3B8] text-sm">
                  Showing {((currentPage - 1) * rowsPerPage) + 1}–
                  {Math.min(currentPage * rowsPerPage, historialServicios.length)} of {historialServicios.length} results
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[#94A3B8] text-sm">Rows per page:</span>
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="h-8 px-2 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl text-[#F8FAFC] text-sm focus:outline-none focus:border-[#2563EB]/50"
                    >
                      <option value={5}>5</option>
                      <option value={7}>7</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                  
                  {/* Page buttons */}
                  <div className="flex items-center gap-1">
                    {/* Previous button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                        currentPage === 1
                          ? 'opacity-35 cursor-not-allowed'
                          : 'text-[#94A3B8] hover:bg-[#1a1d27] hover:border border-[#2a2d3a]'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {(() => {
                      const totalPages = Math.ceil(historialServicios.length / rowsPerPage);
                      const pageNumbers = getPageNumbers();
                      const firstPage = 1;
                      const lastPage = totalPages;
                      
                      return (
                        <>
                          {/* Show first page and ellipsis if needed */}
                          {pageNumbers[0] > firstPage && (
                            <>
                              <button
                                onClick={() => setCurrentPage(firstPage)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#1a1d27] hover:border border-[#2a2d3a] transition-all"
                              >
                                {firstPage}
                              </button>
                              {pageNumbers[0] > firstPage + 1 && (
                                <span className="text-[#94A3B8] px-1">...</span>
                              )}
                            </>
                          )}
                          
                          {/* Show visible page numbers */}
                          {pageNumbers.map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                                page === currentPage
                                  ? 'bg-[#2563EB] text-white'
                                  : 'text-[#94A3B8] hover:bg-[#1a1d27] hover:border border-[#2a2d3a]'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          {/* Show last page and ellipsis if needed */}
                          {pageNumbers[pageNumbers.length - 1] < lastPage && (
                            <>
                              {pageNumbers[pageNumbers.length - 1] < lastPage - 1 && (
                                <span className="text-[#94A3B8] px-1">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(lastPage)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#94A3B8] hover:bg-[#1a1d27] hover:border border-[#2a2d3a] transition-all"
                              >
                                {lastPage}
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Next button */}
                    <button
                      onClick={() => setCurrentPage(prev => {
                        const totalPages = Math.ceil(historialServicios.length / rowsPerPage);
                        return Math.min(totalPages, prev + 1);
                      })}
                      disabled={currentPage === Math.ceil(historialServicios.length / rowsPerPage)}
                      className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                        currentPage === Math.ceil(historialServicios.length / rowsPerPage)
                          ? 'opacity-35 cursor-not-allowed'
                          : 'text-[#94A3B8] hover:bg-[#1a1d27] hover:border border-[#2a2d3a]'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Citas;
