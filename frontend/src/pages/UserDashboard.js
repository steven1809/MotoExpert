import React, { Component } from 'react';
import MapView from '../components/MapView';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class UserDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      servicios: [],
      misVehiculos: [],
      citas: [],
      previousCitas: [],
      nowTs: Date.now(),
      displayStats: {
        vehiculos: 0,
        citas: 0,
        pendientes: 0,
        completadas: 0,
      },
    };
    this.pollingInterval = null;
    this.nowInterval = null;
    this.revealObserver = null;
    this.countAnim = null;
  }

  readJsonOrThrow = async (response, context) => {
    if (!response.ok) {
      throw new Error(`${context}: Network response was not ok`);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`${context}: Response is not JSON`);
    }
    return response.json();
  };

  componentDidMount() {
    this.fetchInitialFormData();
    this.fetchCitas();
    // Poll every 12 seconds
    this.pollingInterval = setInterval(this.fetchCitas, 12000);
    this.nowInterval = setInterval(() => this.setState({ nowTs: Date.now() }), 1000);
    this.setupReveal();
  }

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.nowInterval) clearInterval(this.nowInterval);
    if (this.revealObserver) this.revealObserver.disconnect();
    if (this.countAnim) cancelAnimationFrame(this.countAnim);
  }

  componentDidUpdate(prevProps, prevState) {
    const citasChanged = prevState.citas !== this.state.citas;
    const vehiculosChanged = prevState.misVehiculos !== this.state.misVehiculos;

    if ((citasChanged || vehiculosChanged) && !this.state.loading) {
      this.setupReveal();
      this.animateStats(this.getTargetStats());
    }
  }

  handleDirectionsClick = () => {
    window.open(
      "https://www.google.com/maps?q=MotoExpert",
      "_blank"
    );
  };

  fetchInitialFormData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [serviciosRes, vehiculosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers })
      ]);

      let serviciosData = [];
      let vehiculosData = [];

      try {
        serviciosData = await this.readJsonOrThrow(serviciosRes, 'servicios');
      } catch (error) {
        console.error('Error fetching servicios:', error);
      }

      try {
        vehiculosData = await this.readJsonOrThrow(vehiculosRes, 'vehiculos');
      } catch (error) {
        console.error('Error fetching vehiculos:', error);
      }

      this.setState({ servicios: serviciosData, misVehiculos: vehiculosData, loading: false });
    } catch (err) {
      console.error('Error fetching form data:', err);
      this.setState({ loading: false });
    }
  };

  fetchCitas = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      const data = await this.readJsonOrThrow(response, 'citas');
      const citas = Array.isArray(data) ? data : [];
      this.checkForStatusChanges(citas);
      this.setState((prev) => ({
        citas,
        previousCitas: prev.citas,
      }));
    } catch (err) {
      console.error('Error fetching citas:', err);
      this.setState({ loading: false });
    }
  };

  checkForStatusChanges = (newCitas) => {
    const { previousCitas } = this.state;
    const { showToast } = this.props;

    if (!showToast) return;

    newCitas.forEach(newCita => {
      const oldCita = previousCitas.find(c => c.id === newCita.id);
      
      if (oldCita && oldCita.estado !== newCita.estado) {
        // Status changed!
        if (oldCita.estado === 'PENDIENTE' && newCita.estado === 'EN PROCESO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha comenzado. ¡Estamos trabajando en tu vehículo!`, 'info');
        } else if (oldCita.estado === 'EN PROCESO' && newCita.estado === 'FINALIZADO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha sido completado. ¡Tu vehículo está listo!`, 'success');
        }
      }
    });
  };

  setupReveal = () => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (nodes.length === 0) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add('mx-reveal--in'));
      return;
    }

    if (this.revealObserver) this.revealObserver.disconnect();
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('mx-reveal--in');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );

    nodes.forEach((n) => this.revealObserver.observe(n));
  };

  getTargetStats = () => {
    const vehiculos = (this.state.misVehiculos || []).length;
    const citas = (this.state.citas || []).length;
    const pendientes = (this.state.citas || []).filter((c) => (c.estado || '').toUpperCase() !== 'FINALIZADO').length;
    const completadas = (this.state.citas || []).filter((c) => (c.estado || '').toUpperCase() === 'FINALIZADO').length;
    return { vehiculos, citas, pendientes, completadas };
  };

  animateStats = (target) => {
    const start = performance.now();
    const from = { ...this.state.displayStats };
    const to = { ...target };
    const duration = 900;

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      const next = {
        vehiculos: Math.round(from.vehiculos + (to.vehiculos - from.vehiculos) * eased),
        citas: Math.round(from.citas + (to.citas - from.citas) * eased),
        pendientes: Math.round(from.pendientes + (to.pendientes - from.pendientes) * eased),
        completadas: Math.round(from.completadas + (to.completadas - from.completadas) * eased),
      };

      this.setState({ displayStats: next });
      if (t < 1) this.countAnim = requestAnimationFrame(step);
    };

    if (this.countAnim) cancelAnimationFrame(this.countAnim);
    this.countAnim = requestAnimationFrame(step);
  };

  parseCitaDate = (cita) => {
    const rawDate = cita?.fecha;
    const rawTime = cita?.hora_inicio;
    if (!rawDate) return null;

    if (rawTime) {
      const time = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
      const d = new Date(`${rawDate}T${time}`);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const d2 = new Date(rawDate);
    if (!Number.isNaN(d2.getTime())) return d2;
    return null;
  };

  getNextCita = () => {
    const now = this.state.nowTs;
    const upcoming = (this.state.citas || [])
      .filter((c) => {
        const estado = (c.estado || '').toUpperCase();
        if (estado === 'FINALIZADO') return false;
        const d = this.parseCitaDate(c);
        return d && d.getTime() >= now;
      })
      .sort((a, b) => (this.parseCitaDate(a)?.getTime() || 0) - (this.parseCitaDate(b)?.getTime() || 0));

    return upcoming[0] || null;
  };

  getCountdownParts = (targetDate) => {
    const diff = Math.max(0, targetDate.getTime() - this.state.nowTs);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  };

  buildServicesByMonth = () => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date(this.state.nowTs);
    const buckets = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, name: monthNames[d.getMonth()], servicios: 0 });
    }

    const index = new Map(buckets.map((b, idx) => [b.key, idx]));
    (this.state.citas || []).forEach((c) => {
      const d = this.parseCitaDate(c);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = index.get(key);
      if (idx === undefined) return;
      buckets[idx].servicios += 1;
    });

    return buckets.map(({ name, servicios }) => ({ name, servicios }));
  };

  handleSaberMas = (servicio) => {
    const slug = servicio.nombre.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/\s+/g, '-') // Espacios por guiones
      .replace(/[^\w-]/g, ''); // Quitar caracteres especiales
    
    window.location.hash = slug;
    this.props.setView('servicios');
  };

  handleAgendarServicio = (servicio) => {
    const { misVehiculos } = this.state;
    const { setView } = this.props;

    localStorage.setItem('selectedServiceId', servicio.id);

    if (misVehiculos && misVehiculos.length > 0) {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('citas');
    } else {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('vehiculos');
    }
  };

  render() {
    const { servicios, loading, displayStats } = this.state;
    const { setView } = this.props;

    if (loading) {
      return (
        <div className="mx-container py-14">
          <div className="mx-card bg-white border-[var(--mx-border)] p-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--mx-blue)]" />
          </div>
        </div>
      );
    }

    const userName = localStorage.getItem('userName') || 'Usuario';
    const nextCita = this.getNextCita();
    const nextDate = nextCita ? this.parseCitaDate(nextCita) : null;
    const countdown = nextDate ? this.getCountdownParts(nextDate) : null;
    const chartData = this.buildServicesByMonth();

    const recent = [...(this.state.citas || [])]
      .sort((a, b) => (this.parseCitaDate(b)?.getTime() || 0) - (this.parseCitaDate(a)?.getTime() || 0))
      .slice(0, 8);

    const badge = (estadoRaw) => {
      const estado = (estadoRaw || '').toUpperCase();
      if (estado === 'FINALIZADO') return 'bg-[var(--mx-blue)] text-white';
      if (estado === 'PENDIENTE') return 'bg-[#C08A00] text-white';
      if (estado === 'EN PROCESO') return 'bg-[#0E9F6E] text-white';
      return 'bg-[var(--mx-text)] text-white';
    };

    return (
      <div className="mx-container py-10 space-y-12">
        <section data-reveal className="mx-reveal mx-card bg-white border-[var(--mx-border)] p-8 mx-diagonal-cut overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-8 relative">
              <div className="absolute -top-10 -left-2 mx-h1 text-[160px] leading-none text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none" aria-hidden="true">
                01
              </div>
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Cliente</div>
              <h1 className="mx-h1 text-[72px] sm:text-[86px] text-[var(--mx-text)]">
                BUENOS DÍAS,<br />
                <span className="text-[var(--mx-blue)]">{String(userName).toUpperCase()}</span>
              </h1>
              <div className="mt-4 text-[14px] text-[var(--mx-text-2)] max-w-[70ch]">
                Tu tablero: citas, historial y métricas con lectura editorial. Sin ruido. Solo control.
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="mx-card bg-[var(--mx-bg-2)] border-[var(--mx-border)] p-6">
                <div className="mx-subtitle text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">Acciones rápidas</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => setView('citas')} className="mx-btn mx-btn-primary py-3 text-[11px]">
                    Agendar
                  </button>
                  <button onClick={() => setView('vehiculos')} className="mx-btn mx-btn-outline py-3 text-[11px]">
                    Vehículos
                  </button>
                </div>
                <div className="mt-4 h-[2px] w-full bg-[var(--mx-blue)] opacity-15" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { idx: 0, label: 'Vehículos', value: displayStats.vehiculos, meta: 'Registrados' },
            { idx: 1, label: 'Citas', value: displayStats.citas, meta: 'Total' },
            { idx: 2, label: 'Pendientes', value: displayStats.pendientes, meta: 'En cola' },
            { idx: 3, label: 'Completadas', value: displayStats.completadas, meta: 'Historial' },
          ].map((s) => (
            <div key={s.label} data-reveal className="mx-reveal">
              <div className={`mx-card p-6 ${s.idx === 0 ? 'bg-[var(--mx-blue)] text-white border-[var(--mx-blue)]' : 'bg-white text-[var(--mx-text)] border-[var(--mx-border)] border-l-[3px] border-l-[var(--mx-blue)]'}`}>
                <div className={`mx-subtitle text-[11px] tracking-[0.22em] uppercase ${s.idx === 0 ? 'text-[rgba(255,255,255,0.72)]' : 'text-[var(--mx-text-2)]'}`}>
                  {s.label}
                </div>
                <div className={`mt-2 mx-h1 text-[56px] leading-none ${s.idx === 0 ? 'text-white' : 'text-[var(--mx-text)]'}`}>
                  {s.value}
                </div>
                <div className={`mt-3 text-[12px] tracking-[0.18em] uppercase ${s.idx === 0 ? 'text-[rgba(255,255,255,0.72)]' : 'text-[var(--mx-text-2)]'}`}>
                  {s.meta}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div data-reveal className="mx-reveal lg:col-span-7">
            <div className="mx-card bg-white border-[var(--mx-border)] overflow-hidden">
              <div className="px-8 py-7 border-b border-b-[var(--mx-border)] flex items-center gap-6">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Historial de servicios</div>
                <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
                <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">02</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white">
                      {['Servicio', 'Vehículo', 'Fecha', 'Estado'].map((h) => (
                        <th key={h} className="px-8 py-4 text-[11px] tracking-[0.22em] uppercase text-[var(--mx-text-2)] font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-[13px] text-[var(--mx-text-2)]">
                          Sin servicios todavía.
                        </td>
                      </tr>
                    ) : (
                      recent.map((c) => {
                        const d = this.parseCitaDate(c);
                        return (
                          <tr
                            key={c.id}
                            className="group relative odd:bg-white even:bg-[var(--mx-bg-2)] transition-colors before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0 before:bg-[var(--mx-blue)] before:transition-all before:duration-200 before:ease-out group-hover:before:w-[3px]"
                          >
                            <td className="px-8 py-5 text-[13px] text-[var(--mx-text)]">
                              {c.servicio?.nombre || 'Servicio'}
                            </td>
                            <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">
                              {c.vehiculo?.placa || '—'}
                            </td>
                            <td className="px-8 py-5 text-[13px] text-[var(--mx-text-2)]">
                              {d ? d.toLocaleDateString() : '—'}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`inline-flex items-center px-3 py-2 rounded-[8px] mx-subtitle text-[10px] tracking-[0.22em] uppercase ${badge(c.estado)}`}>
                                {c.estado || '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-8 py-6 border-t border-t-[var(--mx-border)] flex items-center justify-between">
                <div className="text-[12px] tracking-[0.18em] uppercase text-[var(--mx-text-2)]">
                  Actualiza cada 12s
                </div>
                <button onClick={() => setView('citas')} className="mx-btn mx-btn-outline px-5 py-3 text-[11px]">
                  Ver citas
                </button>
              </div>
            </div>
          </div>

          <div data-reveal className="mx-reveal lg:col-span-5">
            <div className="mx-card bg-[var(--mx-blue)] border-[var(--mx-blue)] text-white p-8">
              <div className="flex items-center justify-between gap-6">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[rgba(255,255,255,0.78)]">Próxima cita</div>
                <div className="mx-h1 text-[40px] leading-none text-white opacity-[0.65]">03</div>
              </div>

              {nextCita && nextDate && countdown ? (
                <>
                  <div className="mt-6 mx-h1 text-[54px] leading-none">
                    {String(nextDate.getDate()).padStart(2, '0')}/{String(nextDate.getMonth() + 1).padStart(2, '0')}
                  </div>
                  <div className="mt-2 text-[13px] text-[rgba(255,255,255,0.80)]">
                    {nextCita.servicio?.nombre || 'Servicio'} · {nextCita.vehiculo?.placa || '—'} · {nextCita.hora_inicio?.substring(0, 5) || ''}
                  </div>

                  <div className="mt-8 grid grid-cols-4 gap-3">
                    {[
                      { k: 'Días', v: countdown.days },
                      { k: 'Horas', v: countdown.hours },
                      { k: 'Min', v: countdown.minutes },
                      { k: 'Seg', v: countdown.seconds },
                    ].map((p) => (
                      <div key={p.k} className="mx-card bg-[rgba(0,26,219,0.65)] border-[rgba(255,255,255,0.16)] p-4">
                        <div className="mx-h1 text-[34px] leading-none text-white">{String(p.v).padStart(2, '0')}</div>
                        <div className="mt-2 mx-subtitle text-[10px] tracking-[0.22em] uppercase text-[rgba(255,255,255,0.72)]">{p.k}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button onClick={() => setView('citas')} className="mx-btn mx-btn-outline border-white text-white hover:bg-white hover:text-[var(--mx-blue)] py-3 text-[11px]">
                      Cancelar
                    </button>
                    <button onClick={() => setView('citas')} className="mx-btn bg-white text-[var(--mx-blue)] border border-white py-3 text-[11px] hover:bg-[rgba(255,255,255,0.90)]">
                      Reagendar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-6 mx-h1 text-[54px] leading-none">—</div>
                  <div className="mt-2 text-[13px] text-[rgba(255,255,255,0.80)]">
                    No tienes una cita programada.
                  </div>
                  <div className="mt-8">
                    <button onClick={() => setView('citas')} className="mx-btn bg-white text-[var(--mx-blue)] border border-white px-6 py-3 text-[11px] hover:bg-[rgba(255,255,255,0.90)]">
                      Agendar ahora
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div data-reveal className="mx-reveal lg:col-span-7">
            <div className="mx-card bg-white border-[var(--mx-border)] p-8">
              <div className="flex items-center justify-between gap-6">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Gráfica de servicios</div>
                <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
                <div className="mx-h1 text-[40px] leading-none text-[var(--mx-text)] opacity-[0.18]">04</div>
              </div>

              <div className="mt-8" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="name" stroke="#4A5568" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#4A5568" fontSize={12} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }} itemStyle={{ color: '#05010F' }} />
                    <Bar dataKey="servicios" fill="#0047FF" radius={[8, 8, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div data-reveal className="mx-reveal lg:col-span-5">
            <div className="mx-card bg-white border-[var(--mx-border)] overflow-hidden">
              <div className="px-8 py-7 border-b border-b-[var(--mx-border)] flex items-center gap-6">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Servicios destacados</div>
                <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
              </div>

              <div className="p-8 grid grid-cols-1 gap-4">
                {(servicios || []).slice(0, 3).map((s, idx) => (
                  <div key={s.id} className="mx-card mx-card-hover-up border-[var(--mx-border)] p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <div className="mx-subtitle text-[12px] tracking-[0.18em] uppercase text-[var(--mx-text)] truncate">{s.nombre}</div>
                        <div className="mt-2 text-[13px] text-[var(--mx-text-2)] leading-relaxed">{s.descripcion}</div>
                      </div>
                      <div className="mx-h1 text-[44px] leading-none text-[var(--mx-blue)] opacity-[0.22]">{String(idx + 1).padStart(2, '0')}</div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button onClick={() => this.handleAgendarServicio(s)} className="mx-btn mx-btn-primary px-5 py-3 text-[11px]">
                        Agendar
                      </button>
                      <button onClick={() => this.handleSaberMas(s)} className="mx-btn mx-btn-outline px-5 py-3 text-[11px]">
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section data-reveal className="mx-reveal">
          <div className="mx-card bg-white border-[var(--mx-border)] overflow-hidden">
            <div className="px-8 py-7 border-b border-b-[var(--mx-border)] flex items-center gap-6">
              <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Sede</div>
              <div className="h-[2px] flex-1 bg-[var(--mx-blue)] opacity-20" />
            </div>

            <div className="relative h-[420px]">
              <MapView />
              <div className="absolute left-6 bottom-6 right-6 md:right-auto md:w-[420px] mx-card bg-white border-[var(--mx-border)] p-6">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">MotoExpert</div>
                <div className="mt-2 text-[13px] text-[var(--mx-text-2)]">Ubicación y acceso directo.</div>
                <div className="mt-5">
                  <button onClick={this.handleDirectionsClick} className="mx-btn mx-btn-primary px-6 py-3 text-[11px]">
                    Cómo llegar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default UserDashboard;
