import React, { Component, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Car3D from '../components/Car3D';
import premiumImg from '../assets/services/premium.jpg';
import expressImg from '../assets/services/express.jpeg';
import motorImg from '../assets/services/motor.jpeg';
import limpiezaImg from '../assets/services/limpiezap.jpeg';
import proteccionImg from '../assets/services/proteccionc.jpeg';
import pulidoImg from '../assets/services/pulidop.jpeg';
import carwashVideo from '../assets/videos/6872078-hd_1280_720_25fps.mp4';
import { FaCalendarAlt, FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import AgendamientoPublico from '../components/agendamiento/AgendamientoPublico';
import telefonoIcon from '../assets/iconos/telefono.png';
import ubicIcon from '../assets/iconos/ubicacion.png';
import relojIcon from '../assets/iconos/reloj.png';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function CountUp({ value, suffix = '', className = '' }) {
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      const from = 0;
      const to = Number(value) || 0;
      const duration = 900;
      const startAt = performance.now();

      const step = (now) => {
        const t = Math.min(1, (now - startAt) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = Math.round(from + (to - from) * eased);
        setDisplay(next);
        if (t < 1) raf = requestAnimationFrame(step);
      };

      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start();
      },
      { threshold: 0.35 }
    );
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [value]);

  const formatted = Number.isFinite(display) ? display.toLocaleString('es-CO') : String(display);

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}

class LandingPage extends Component {
  state = {
    activeView: 'inicio',
    landingServicios: [],
    landingLoading: false,
    landingError: '',
    landingCardsVisible: true,
    landingServicioDetalleOpen: false,
    landingServicioDetalle: null,
    isScrolled: false,
    contactForm: {
      nombre: '',
      email: '',
      telefono: '',
      servicio: '',
      mensaje: ''
    },
    contactErrors: {},
    contactSuccess: false,
    landingFiltros: {
      categoria: '',
      tipo_vehiculo: '',
      precio_desde: '',
      precio_hasta: '',
      duracion: '',
      orden: 'recientes'
    }
  };

  setActiveView = (activeView) => {
    this.setState({ activeView }, () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  componentDidMount() {
    try {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.handleScroll();
    } catch {}
    this.initRevealObserver();
  }

  componentWillUnmount() {
    try {
      window.removeEventListener('scroll', this.handleScroll);
    } catch {}
    try {
      this.revealObserver?.disconnect?.();
    } catch {}
  }

  handleScroll = () => {
    const next = (window.scrollY || 0) > 8;
    if (next !== this.state.isScrolled) this.setState({ isScrolled: next });
  };

  initRevealObserver = () => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    try {
      this.revealObserver?.disconnect?.();
    } catch {}

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
        });
      },
      { threshold: 0.12 }
    );

    try {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        this.revealObserver.observe(el);
      });
    } catch {}
  };

  componentDidUpdate(prevProps, prevState) {
    const viewChanged = prevState.activeView !== this.state.activeView;
    if (viewChanged) this.initRevealObserver();
    if (this.state.activeView !== 'servicios') return;
    const filtrosChanged = prevState.landingFiltros !== this.state.landingFiltros;
    if (viewChanged || filtrosChanged) {
      this.fetchLandingServicios();
    }
  }

  normalizeText = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  fixServicioNombre = (nombre) => {
    const s = String(nombre || '').trim();
    if (!s) return s;
    if (s.includes('�')) {
      const lower = s.toLowerCase();
      if (lower.includes('protecci') && lower.includes('cer')) return 'Protección Cerámica';
      if (lower.includes('pulido')) return 'Pulido Profesional';
      if (lower.includes('limpieza') && (lower.includes('prof') || lower.includes('profunda'))) return 'Limpieza Profunda';
      if (lower.includes('motor')) return 'Lavado de Motor';
      if (lower.includes('express')) return 'Lavado Express';
      if (lower.includes('premium')) return 'Lavado Premium';
    }
    const lower = s.toLowerCase();
    if (lower.includes('lavado') && lower.includes('premium')) return 'Lavado Premium';
    if (lower.includes('lavado') && lower.includes('express')) return 'Lavado Express';
    if (lower.includes('motor')) return 'Lavado de Motor';
    if (lower.includes('limpieza') && (lower.includes('prof') || lower.includes('profunda'))) return 'Limpieza Profunda';
    if (lower.includes('protecci') && lower.includes('cer')) return 'Protección Cerámica';
    if (lower.includes('pulido')) return 'Pulido Profesional';
    return s;
  };

  getCategoriaFromNombre = (nombre) => {
    const n = this.normalizeText(nombre);
    if (n.includes('motor')) return 'Motor';
    if (n.includes('pulido')) return 'Pulido';
    if (n.includes('protecc') || n.includes('ceram')) return 'Protección';
    if (n.includes('profunda') || n.includes('limpieza')) return 'Limpieza';
    if (n.includes('lavado') || n.includes('express') || n.includes('premium') || n.includes('basico')) return 'Lavado';
    return 'Lavado';
  };

  getImageForCategoria = (categoria, nombre) => {
    const cat = categoria || this.getCategoriaFromNombre(nombre);
    if (cat === 'Motor') return motorImg;
    if (cat === 'Limpieza') return limpiezaImg;
    if (cat === 'Protección') return proteccionImg;
    if (cat === 'Pulido') return pulidoImg;
    const n = this.normalizeText(nombre);
    if (n.includes('express')) return expressImg;
    return premiumImg;
  };

  formatCOP = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
  };

  formatPriceShort = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return `$${n.toLocaleString('es-CO')}`;
  };

  getTipoVehiculoBadgeFromNombre = (nombre) => {
    const n = this.normalizeText(nombre);
    if (n.includes('express')) return 'Auto · Moto · Camioneta · SUV';
    return 'Auto · Camioneta · SUV';
  };

  getLandingServicioImagenFallback = (nombre) => {
    const fixed = this.fixServicioNombre(nombre);
    const imagenesServicio = {
      'Lavado Premium': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
      'Lavado Express': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
      'Lavado de Motor': 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80',
      'Limpieza Profunda': 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
      'Protección Cerámica': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
      'Pulido Profesional': 'https://images.unsplash.com/photo-1614026480418-bd11fdb9fa06?w=800&q=80',
    };
    return imagenesServicio[fixed] || null;
  };

  getLandingServicioMetaFromNombre = (nombre) => {
    const n = this.normalizeText(nombre);
    if (n.includes('lavado') && n.includes('premium')) {
      return {
        duracion: '90min',
        rating: 4.9,
        reviews: 120,
        imagenUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
        incluye: ['Prelavado con espuma activa', 'Lavado a mano', 'Limpieza de llantas y rines', 'Secado con microfibra'],
      };
    }
    if (n.includes('express')) {
      return {
        duracion: '30min',
        rating: 4.7,
        reviews: 95,
        imagenUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
        incluye: ['Lavado exterior', 'Secado rápido', 'Limpieza de vidrios', 'Acabado rápido'],
      };
    }
    if (n.includes('motor')) {
      return {
        duracion: '60min',
        rating: 4.8,
        reviews: 32,
        imagenUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80',
        incluye: ['Desengrasado seguro', 'Limpieza detallada', 'Protección de plásticos', 'Acabado satinado'],
      };
    }
    if (n.includes('profunda') || n.includes('limpieza')) {
      return {
        duracion: '180min',
        rating: 4.8,
        reviews: 48,
        imagenUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
        incluye: ['Aspirado profundo', 'Limpieza de tapicería', 'Limpieza de paneles', 'Desinfección interior'],
      };
    }
    if (n.includes('protecc') || n.includes('ceram')) {
      return {
        duracion: '480min',
        rating: 4.7,
        reviews: 64,
        imagenUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
        incluye: ['Preparación de superficie', 'Aplicación cerámica', 'Curado inicial', 'Recomendaciones de mantenimiento'],
      };
    }
    if (n.includes('pulido')) {
      return {
        duracion: '240min',
        rating: 4.7,
        reviews: 64,
        imagenUrl: 'https://images.unsplash.com/photo-1614026480418-bd11fdb9fa06?w=800&q=80',
        incluye: ['Corrección de pintura', 'Eliminación de swirls', 'Realce de brillo', 'Sellado de acabado'],
      };
    }
    return {
      duracion: '60min',
      rating: 4.8,
      reviews: 50,
      imagenUrl: null,
      incluye: ['Atención profesional', 'Productos premium', 'Proceso seguro', 'Resultados garantizados'],
    };
  };

  openLandingServicioDetalle = (servicio) => {
    this.setState({ landingServicioDetalleOpen: true, landingServicioDetalle: servicio });
  };

  closeLandingServicioDetalle = () => {
    this.setState({ landingServicioDetalleOpen: false, landingServicioDetalle: null });
  };

  buildLandingServiciosUrl = () => {
    const f = this.state.landingFiltros;
    const params = new URLSearchParams();
    if (f.categoria) params.set('categoria', f.categoria);
    if (f.tipo_vehiculo) params.set('tipo_vehiculo', f.tipo_vehiculo);
    if (f.precio_desde) params.set('precio_desde', f.precio_desde);
    if (f.precio_hasta) params.set('precio_hasta', f.precio_hasta);
    if (f.duracion) params.set('duracion', f.duracion);
    if (f.orden) params.set('orden', f.orden);
    const qs = params.toString();
    return `${API_BASE_URL}/servicios${qs ? `?${qs}` : ''}`;
  };

  fetchLandingServicios = () => {
    this.setState({ landingLoading: true, landingError: '', landingCardsVisible: false });
    const url = this.buildLandingServiciosUrl();
    console.log('URL fetch:', url);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log('Data recibida:', data);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.servicios)
            ? data.servicios
            : Array.isArray(data?.value)
              ? data.value
              : [];
        this.setState({ landingServicios: list });
      })
      .catch(() => {
        this.setState({ landingServicios: [], landingError: `No se pudieron cargar los servicios. Verifica que el backend esté corriendo en ${API_BASE_URL}` });
      })
      .finally(() => {
        this.setState({ landingLoading: false, landingCardsVisible: true });
      });
  };

  handleLandingFiltroChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      landingCardsVisible: false,
      landingFiltros: {
        ...prev.landingFiltros,
        [name]: value
      }
    }));
  };

  clearLandingFiltros = () => {
    this.setState({
      landingCardsVisible: false,
      landingFiltros: {
        categoria: '',
        tipo_vehiculo: '',
        precio_desde: '',
        precio_hasta: '',
        duracion: '',
        orden: 'recientes'
      }
    });
  };

  clearOneFiltro = (key) => {
    if (key === 'precio') {
      this.setState((prev) => ({
        landingCardsVisible: false,
        landingFiltros: {
          ...prev.landingFiltros,
          precio_desde: '',
          precio_hasta: ''
        }
      }));
      return;
    }

    this.setState((prev) => ({
      landingCardsVisible: false,
      landingFiltros: {
        ...prev.landingFiltros,
        [key]: key === 'orden' ? 'recientes' : ''
      }
    }));
  };

  handleContactChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      contactSuccess: false,
      contactErrors: { ...prev.contactErrors, [name]: '' },
      contactForm: {
        ...prev.contactForm,
        [name]: value
      }
    }));
  };

  validateContactForm = () => {
    const f = this.state.contactForm;
    const errors = {};
    if (!f.nombre.trim()) errors.nombre = 'Requerido';
    if (!f.email.trim()) errors.email = 'Requerido';
    if (!f.telefono.trim()) errors.telefono = 'Requerido';
    if (!f.servicio.trim()) errors.servicio = 'Requerido';
    if (!f.mensaje.trim()) errors.mensaje = 'Requerido';
    return errors;
  };

  handleContactSubmit = async (e) => {
    e.preventDefault();
    const errors = this.validateContactForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ contactErrors: errors, contactSuccess: false });
      return;
    }

    const f = this.state.contactForm;
    const payload = {
      nombre: f.nombre.trim(),
      email: f.email.trim(),
      telefono: f.telefono.trim(),
      tipo_servicio: f.servicio.trim(),
      mensaje: f.mensaje.trim(),
    };

    let sent = false;
    try {
      const res = await fetch(`${API_BASE_URL}/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) sent = true;
    } catch {}

    if (!sent) {
      const subject = `Contacto MotoExpert - ${payload.nombre}`;
      const body = [
        `Nombre: ${payload.nombre}`,
        `Email: ${payload.email}`,
        `Teléfono: ${payload.telefono}`,
        `Servicio: ${payload.tipo_servicio}`,
        `Mensaje: ${payload.mensaje}`,
      ].join('\r\n');
      try {
        window.open(
          `mailto:pinillvalenciak@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        );
      } catch {}
    }

    this.setState({
      contactSuccess: true,
      contactErrors: {},
      contactForm: {
        nombre: '',
        email: '',
        telefono: '',
        servicio: '',
        mensaje: ''
      }
    });
  };

  render() {
    const { activeView, isScrolled } = this.state;
    const { landingServicios, landingLoading, landingError, landingFiltros } = this.state;
    const { landingCardsVisible } = this.state;
    const { landingServicioDetalleOpen, landingServicioDetalle } = this.state;
    const serviciosOrdenados = [...landingServicios].sort((a, b) => {
      const aPrecio = Number(a?.precio ?? 0);
      const bPrecio = Number(b?.precio ?? 0);
      if (landingFiltros.orden === 'precio_asc') return aPrecio - bPrecio;
      if (landingFiltros.orden === 'precio_desc') return bPrecio - aPrecio;
      const aId = Number(a?.id ?? 0);
      const bId = Number(b?.id ?? 0);
      return bId - aId;
    });
    const hasActiveFilters = Boolean(
      landingFiltros.categoria ||
      landingFiltros.tipo_vehiculo ||
      landingFiltros.precio_desde ||
      landingFiltros.precio_hasta ||
      landingFiltros.duracion ||
      (landingFiltros.orden && landingFiltros.orden !== 'recientes')
    );
    const chips = [];
    if (landingFiltros.categoria) chips.push({ key: 'categoria', label: landingFiltros.categoria });
    if (landingFiltros.tipo_vehiculo) chips.push({ key: 'tipo_vehiculo', label: landingFiltros.tipo_vehiculo });
    if (landingFiltros.precio_desde || landingFiltros.precio_hasta) {
      const desde = landingFiltros.precio_desde ? this.formatPriceShort(landingFiltros.precio_desde) : '';
      const hasta = landingFiltros.precio_hasta ? this.formatPriceShort(landingFiltros.precio_hasta) : '';
      const label = desde && hasta ? `${desde} - ${hasta}` : desde ? `${desde}+` : `${hasta}-`;
      chips.push({ key: 'precio', label });
    }
    const { contactForm, contactErrors, contactSuccess } = this.state;

    return (
      <div className="min-h-screen bg-[#030712] text-white overflow-hidden">

        {/* BACKGROUND */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full"></div>
        </div>

        {/* HEADER */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'backdrop-blur-xl bg-[rgba(10,10,30,0.8)] border-b border-white/10' : 'bg-transparent'
          }`}
        >
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">

            {/* LOGO */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => this.setActiveView('inicio')}
            >
              <div className="w-16 h-22 rounded-2xl bg-gradient-to-br  flex items-center justify-center shadow-xl">
                
                <img
                  src={require('../assets/images/logo.png')}
                  alt="MotoExpert"
                  className="h-30 w-auto object-contain"
                />
            
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Moto<span className="text-white">Expert</span>
                </h1>

                <p className="text-[11px] text-white/70">
                  Lo mejor para tu vehiculo
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-10 text-sm">
              {[
                ['inicio', 'Inicio'],
                ['servicios', 'Servicios'],
                ['nosotros', 'Nosotros'],
                ['contacto', 'Contacto'],
                ['agendado', 'Agendar'],
                ['ubicacion', 'Ubicación'],
              ].map(([key, label]) => {
                const isActive = activeView === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => this.setActiveView(key)}
                    className={`relative text-sm text-white/80 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-blue-400 after:to-cyan-300 after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                      isActive ? 'after:scale-x-100' : ''
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* ACTIONS */}
            <div className="flex items-center gap-4">

              <button
                onClick={this.props.onEnterLogin}
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Iniciar sesión
              </button>

              <button
                onClick={this.props.onEnterRegister}
                className="px-6 py-3 rounded-xl bg-transparent-600 border border-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300 shadow-lg"
              >
                Registrarse
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {activeView === 'inicio' && (
            <div className="animate-in fade-in duration-200">
              <section data-reveal className="reveal relative overflow-hidden min-h-screen flex items-center justify-center pt-32">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  src={carwashVideo}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                  }}
                />

                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.25))',
                  }}
                />

                <div className="absolute inset-0 z-10 opacity-70 hero-dots pointer-events-none" />

                <div
                  className="absolute top-0 left-0 right-0 h-[120px] z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                  }}
                />

                <div className="container mx-auto px-6 relative z-20 text-center">

                  <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-400">
                      Lavado y Mantenimiento
                    </span>
                    <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      con nivel profesional
                    </span>
                  </h1>

                  <div className="max-w-xl mx-auto glow-underline" />

                  <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12">
                    Agenda servicios, administra mantenimientos y dale a tu vehículo
                    el cuidado profesional que merece.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5">

                    <button
                      onClick={() => {
                        try {
                          localStorage.setItem('motoexpert_post_login_redirect', 'citas');
                        } catch {}
                        if (typeof this.props.onEnterLogin === 'function') this.props.onEnterLogin();
                      }}
                      className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all duration-300 shadow-xl shadow-blue-600/20"
                    >
                      Agendar cita
                    </button>

                    <button
                      type="button"
                      onClick={() => this.setActiveView('servicios')}
                      className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/15 transition-all duration-300"
                    >
                      Explorar servicios
                    </button>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24">
                    {[
                      ['+15K', 'Servicios realizados'],
                      ['10+', 'Años de experiencia'],
                      ['98%', 'Clientes satisfechos'],
                      ['24/7', 'Reservas online'],
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-md p-6"
                      >
                        <h3 className="text-3xl font-bold mb-2">
                          {item[0]}
                        </h3>

                        <p className="text-sm text-slate-400">
                          {item[1]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeView === 'servicios' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section data-reveal className="reveal relative py-28 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-60 diag-lines" />
                <div className="pointer-events-none absolute inset-0 grain" />
                <div className="container mx-auto px-6">
                  <div className="text-center lg:text-left mb-16 lg:mb-18">
                    <span className="text-blue-400 text-sm">Nuestros servicios</span>

                    <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 tracking-tight">
                      Cuidado completo para tu vehículo
                    </h2>

                    <p className="text-slate-400 max-w-2xl mx-auto lg:mx-0 text-lg leading-relaxed">
                      Servicios profesionales diseñados para mantener tu vehículo limpio, protegido y en excelentes condiciones.
                    </p>
                  </div>

                  <div className="flex gap-6">
                    <aside className="w-72 flex-shrink-0">
                      <div className="sticky top-4 bg-gray-800/50 rounded-xl p-6 border border-white/5">
                        <div className="text-white font-semibold mb-5">Filtros</div>

                        <div className="space-y-5">
                          <div>
                            <label className="text-white font-semibold mb-2 block">Categoría</label>
                            <select
                              name="categoria"
                              value={landingFiltros.categoria}
                              onChange={this.handleLandingFiltroChange}
                              className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full ${landingFiltros.categoria ? 'border-blue-500' : 'border-gray-600'}`}
                            >
                              <option value="">Todas</option>
                              <option value="Lavado">Lavado</option>
                              <option value="Motor">Motor</option>
                              <option value="Limpieza">Limpieza</option>
                              <option value="Protección">Protección</option>
                              <option value="Pulido">Pulido</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-white font-semibold mb-2 block">Tipo de Vehículo</label>
                            <select
                              name="tipo_vehiculo"
                              value={landingFiltros.tipo_vehiculo}
                              onChange={this.handleLandingFiltroChange}
                              className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full ${landingFiltros.tipo_vehiculo ? 'border-blue-500' : 'border-gray-600'}`}
                            >
                              <option value="">Todos</option>
                              <option value="Auto">Auto</option>
                              <option value="Moto">Moto</option>
                              <option value="Camioneta">Camioneta</option>
                              <option value="SUV">SUV</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-white font-semibold mb-2 block">Precio</label>
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                name="precio_desde"
                                value={landingFiltros.precio_desde}
                                onChange={this.handleLandingFiltroChange}
                                placeholder="Desde"
                                className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full ${landingFiltros.precio_desde ? 'border-blue-500' : 'border-gray-600'}`}
                              />
                              <input
                                type="number"
                                name="precio_hasta"
                                value={landingFiltros.precio_hasta}
                                onChange={this.handleLandingFiltroChange}
                                placeholder="Hasta"
                                className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full ${landingFiltros.precio_hasta ? 'border-blue-500' : 'border-gray-600'}`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-white font-semibold mb-2 block">Duración</label>
                            <select
                              name="duracion"
                              value={landingFiltros.duracion}
                              onChange={this.handleLandingFiltroChange}
                              className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full ${landingFiltros.duracion ? 'border-blue-500' : 'border-gray-600'}`}
                            >
                              <option value="">Cualquiera</option>
                              <option value="rapido">Rápido (&lt;1h)</option>
                              <option value="medio">Medio (1-3h)</option>
                              <option value="completo">Completo (&gt;3h)</option>
                            </select>
                          </div>

                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={this.clearLandingFiltros}
                              className="text-red-400 hover:text-red-300 text-sm mt-4"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </div>
                    </aside>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-8">
                        <div className="text-gray-300 text-sm">
                          Servicios <span className="text-gray-500">|</span> {serviciosOrdenados.length} servicios
                        </div>
                        <select
                          name="orden"
                          value={landingFiltros.orden}
                          onChange={this.handleLandingFiltroChange}
                          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="recientes">Recientes</option>
                          <option value="precio_asc">Menor precio</option>
                          <option value="precio_desc">Mayor precio</option>
                        </select>
                      </div>

                      {hasActiveFilters && chips.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {chips.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => this.clearOneFiltro(c.key)}
                              className="inline-flex items-center gap-1 bg-blue-600/20 border border-blue-500 text-blue-400 rounded-full px-3 py-1 text-sm"
                            >
                              <span>{c.label}</span>
                              <span>×</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {landingLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className="rounded-xl bg-gray-700/50 p-8 animate-pulse"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-black/20" />
                                <div className="h-6 w-24 rounded-full bg-black/20" />
                              </div>
                              <div className="h-7 w-3/4 rounded bg-black/20 mb-4" />
                              <div className="h-4 w-full rounded bg-black/20 mb-2" />
                              <div className="h-4 w-5/6 rounded bg-black/20 mb-6" />
                              <div className="flex items-center justify-between">
                                <div className="h-5 w-24 rounded bg-black/20" />
                                <div className="h-5 w-20 rounded bg-black/20" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!landingLoading && landingError && (
                        <div className="text-center text-red-300 mt-10">
                          {landingError}
                        </div>
                      )}

                      {!landingLoading && !landingError && serviciosOrdenados.length === 0 && (
                        <div className="text-center text-slate-300 mt-10 border border-white/5 bg-white/[0.03] rounded-3xl p-10">
                          <div className="text-4xl mb-4">🔍</div>
                          <div className="text-lg font-semibold">No encontramos servicios con esos filtros</div>
                          <div className="text-slate-400 mt-2">Intenta ajustar o limpiar los filtros</div>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={this.clearLandingFiltros}
                              className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium underline transition-colors duration-300"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      )}

                      {!landingLoading && !landingError && serviciosOrdenados.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {serviciosOrdenados.map((servicio, i) => {
                            const nombre = this.fixServicioNombre(servicio?.nombre || 'Servicio');
                            const categoria = this.getCategoriaFromNombre(nombre);
                            const precioShort = this.formatPriceShort(servicio?.precio);
                            const meta = this.getLandingServicioMetaFromNombre(nombre);
                            const duracionValue =
                              servicio?.duracion ??
                              servicio?.duracion_min ??
                              servicio?.duracionMin ??
                              meta.duracion;
                            const duracion = typeof duracionValue === 'number' ? `${duracionValue}min` : (duracionValue || meta.duracion);
                            const rating = Number(servicio?.rating ?? meta.rating);
                            const imagen =
                              servicio?.imagen_url ||
                              servicio?.image_url ||
                              this.getLandingServicioImagenFallback(nombre) ||
                              meta.imagenUrl ||
                              this.getImageForCategoria(categoria, nombre);

                            const badgeColor =
                              categoria === 'Lavado'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                : categoria === 'Motor'
                                  ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                                  : categoria === 'Limpieza'
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                    : categoria === 'Protección'
                                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                      : 'bg-gradient-to-r from-orange-500 to-red-500';

                            const variant = i % 3;
                            const cardExtra =
                              variant === 0
                                ? 'lg:translate-y-2 lg:h-[19rem]'
                                : variant === 1
                                  ? 'lg:-translate-y-1 lg:h-[18rem]'
                                  : 'lg:translate-y-4 lg:h-[20rem]';

                            return (
                              <div
                                key={servicio.id}
                                style={{
                                  transitionDelay: landingCardsVisible ? `${i * 75}ms` : '0ms',
                                }}
                                className={`group relative h-72 rounded-2xl overflow-hidden bg-white/[0.05] backdrop-blur-md border border-white/[0.08] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-blue-500 hover:shadow-[0_0_22px_rgba(59,130,246,0.18)] ${cardExtra} ${landingCardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} transition-opacity transition-transform`}
                              >
                                <img
                                  src={imagen}
                                  alt={nombre}
                                  className="absolute inset-0 w-full h-full object-cover object-center opacity-95"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
                                <div className="absolute inset-0 opacity-40 carbon-fiber" />

                                <div className="absolute top-4 left-4 z-10">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest text-white ${badgeColor} shadow-lg shadow-black/20 ring-1 ring-white/10`}>
                                    {categoria}
                                  </span>
                                </div>

                                <div className="absolute top-4 right-4 z-10 text-blue-200/90 font-extrabold tracking-tight">
                                  {precioShort || 'Consulta'}
                                </div>

                                <div
                                  className="absolute inset-x-0 bottom-0 z-10 p-6 backdrop-blur-md border-t border-white/10"
                                  style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(0,0,0,0.95))' }}
                                >
                                  <h3 className="text-white text-2xl font-bold">{nombre}</h3>
                                  <div className="mt-3 h-px w-16 bg-gradient-to-r from-white/0 via-white/25 to-white/0" />

                                  <div className="mt-2 text-gray-300 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span>⏱ {duracion}</span>
                                    <span className="text-gray-500">·</span>
                                    <span>{categoria}</span>
                                    <span className="text-gray-500">·</span>
                                    <span>⭐ {Number.isFinite(rating) ? rating.toFixed(1) : meta.rating.toFixed(1)}</span>
                                  </div>

                                  <div className="mt-4 flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (typeof this.props.onEnterLogin === 'function') this.props.onEnterLogin();
                                      }}
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-out text-white font-semibold text-sm shadow-lg shadow-blue-900/20"
                                    >
                                      <FaCalendarAlt className="w-5 h-5" />
                                      AGENDAR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => this.openLandingServicioDetalle(servicio)}
                                      className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200 ease-out text-white font-semibold text-sm backdrop-blur-md"
                                    >
                                      VER DETALLES
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {landingServicioDetalleOpen && landingServicioDetalle && (() => {
                        const nombre = this.fixServicioNombre(landingServicioDetalle?.nombre || 'Servicio');
                        const descripcion = landingServicioDetalle?.descripcion || 'Sin descripción';
                        const categoria = this.getCategoriaFromNombre(nombre);
                        const tipoVehiculo = this.getTipoVehiculoBadgeFromNombre(nombre);
                        const meta = this.getLandingServicioMetaFromNombre(nombre);
                        const imagen =
                          landingServicioDetalle?.imagen_url ||
                          landingServicioDetalle?.image_url ||
                          this.getLandingServicioImagenFallback(nombre) ||
                          meta.imagenUrl ||
                          this.getImageForCategoria(categoria, nombre);
                        const precioShort = this.formatPriceShort(landingServicioDetalle?.precio);
                        const duracionValue =
                          landingServicioDetalle?.duracion ??
                          landingServicioDetalle?.duracion_min ??
                          landingServicioDetalle?.duracionMin ??
                          meta.duracion;
                        const duracion = typeof duracionValue === 'number' ? `${duracionValue}min` : (duracionValue || meta.duracion);
                        const rating = Number(landingServicioDetalle?.rating ?? meta.rating);
                        const reviews = Number(landingServicioDetalle?.reviews ?? meta.reviews);

                        return (
                          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6">
                            <button
                              type="button"
                              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                              onClick={this.closeLandingServicioDetalle}
                              aria-label="Cerrar"
                            />
                            <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl overflow-hidden">
                              <div className="relative h-44">
                                <img src={imagen} alt={nombre} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/55" />
                                <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-600/20 border border-blue-500 text-blue-200">
                                  {categoria}
                                </div>
                                <div className="absolute top-4 right-4 text-blue-300 font-bold">
                                  {precioShort || 'Consulta'}
                                </div>
                                <button
                                  type="button"
                                  onClick={this.closeLandingServicioDetalle}
                                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full border border-white/10 bg-black/30 hover:bg-black/50 transition-all duration-300 text-white"
                                  aria-label="Cerrar"
                                >
                                  ×
                                </button>
                                <div className="absolute left-5 bottom-4">
                                  <div className="text-white text-2xl font-bold">{nombre}</div>
                                  <div className="text-gray-300 text-sm mt-1">
                                    ⏱ {duracion} <span className="text-gray-500">·</span> ⭐ {Number.isFinite(rating) ? rating.toFixed(1) : meta.rating.toFixed(1)}{' '}
                                    <span className="text-gray-500">({Number.isFinite(reviews) ? reviews : meta.reviews} reseñas)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-6">
                                <div className="text-slate-300 leading-relaxed">{descripcion}</div>

                                <div className="mt-6">
                                  <div className="text-white font-semibold mb-3">¿Qué incluye?</div>
                                  <ul className="grid gap-2 text-slate-300">
                                    {meta.incluye.slice(0, 4).map((item) => (
                                      <li key={item} className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-[2px]">•</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="mt-6">
                                  <div className="text-white font-semibold mb-3">Vehículos compatibles</div>
                                  <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-slate-200 text-sm">
                                    {tipoVehiculo}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    this.closeLandingServicioDetalle();
                                    if (typeof this.props.onEnterLogin === 'function') this.props.onEnterLogin();
                                  }}
                                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-semibold"
                                >
                                  <FaCalendarAlt className="w-5 h-5" />
                                  Agendar ahora
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeView === 'nosotros' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section data-reveal className="reveal relative overflow-hidden py-24">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="absolute inset-0 opacity-30 carbon-fiber pointer-events-none" />
                <div className="absolute inset-0 grain pointer-events-none" />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(3,7,18,0.85), rgba(3,7,18,0.75))',
                  }}
                />

                <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
                  <span className="text-blue-400 text-sm">Nuestra historia</span>
                  <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
                    Más de 10 años cuidando lo que más valoras
                  </h2>
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                    Nacimos con una sola misión: devolverte el orgullo de manejar un vehículo impecable. Hoy somos el centro de detailing de mayor confianza en la región.
                  </p>
                </div>
              </section>

              <section data-reveal className="reveal relative py-20 bg-gray-900/80 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-35 diag-lines" />
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      [10, '+', 'Años de experiencia'],
                      [15000, '+', 'Vehículos atendidos'],
                      [98, '%', 'Clientes satisfechos'],
                      [6, '', 'Servicios especializados'],
                    ].map((s, i) => (
                      <div
                        key={i}
                        className={`text-center rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md p-6 shadow-lg shadow-blue-900/10 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-blue-500/35 hover:shadow-[0_0_18px_rgba(59,130,246,0.14)] ${i % 2 === 0 ? 'md:-translate-y-1' : 'md:translate-y-1'}`}
                      >
                        <div className="text-3xl md:text-[34px] font-extrabold text-blue-500 tracking-tight">
                          <CountUp value={s[0]} suffix={s[1]} />
                        </div>
                        <div className="text-slate-300 mt-2 text-sm">{s[2]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section data-reveal className="reveal py-20">
                <div className="container mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div>
                      <h3 className="text-3xl font-bold mb-6 tracking-tight">¿Quiénes somos?</h3>
                      <div className="space-y-5 text-slate-300 leading-relaxed">
                        <p>
                          MotoExpert nació en 2014 en Bogotá como un pequeño taller familiar con grandes sueños. Lo que comenzó con dos empleados y un local de 40m² hoy se ha convertido en un centro especializado con tecnología de punta y un equipo de más de 10 profesionales certificados.
                        </p>
                        <p>
                          Nos especializamos en lavado, detailing, protección cerámica y pulido profesional para todo tipo de vehículos. Cada servicio es realizado con productos premium importados y técnicas certificadas internacionalmente.
                        </p>
                        <p>
                          Nuestra filosofía es simple: tratamos cada vehículo como si fuera el nuestro.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        ['🎯','Misión','Ofrecer servicios de detailing de clase mundial con atención personalizada, precios justos y resultados que superan las expectativas.','border-blue-500'],
                        ['🔭', 'Visión', 'Ser el centro de car care más reconocido de Colombia para 2027, expandiendo nuestra presencia a las principales ciudades del país.', 'border-purple-500'],
                        ['💎', 'Valores', 'Calidad · Honestidad · Puntualidad · Pasión · Responsabilidad ambiental', 'border-green-500'],
                      ].map((c, i) => (
                        <div
                          key={i}
                          className={`bg-white/[0.03] border border-white/10 backdrop-blur-md border-l-4 ${c[3]} rounded-2xl p-6 shadow-lg shadow-blue-900/10 hover:-translate-y-1 hover:border-white/20 transition-all duration-200 ease-out`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-2xl">{c[0]}</div>
                            <div className="text-white font-semibold text-lg">{c[1]}</div>
                          </div>
                          <div className="text-slate-300 leading-relaxed">{c[2]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section data-reveal className="reveal py-20 bg-gray-900/80">
                <div className="container mx-auto px-6">
                  <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-blue-400 text-sm">Tecnología & Precisión</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">Cada detalle importa</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Así como cuidamos cada milímetro de tu vehículo
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto rounded-2xl ">
                    <Car3D />
                  </div>
                </div>
              </section>

              <section data-reveal className="reveal py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-14">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">El equipo detrás de la magia</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Profesionales certificados apasionados por los vehículos
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      ['Carlos Rodríguez', 'Especialista Senior en Detailing', 'Especialista en corrección y acabado profesional.', ['Pulido', 'Corrección de pintura', 'Detailing'], 'C'],
                      ['María González', 'Técnica en Protección Cerámica', 'Enfoque en recubrimientos premium y protección.', ['Cerámica', 'PPF', 'Nano recubrimientos'], 'M'],
                      ['Juan Martínez', 'Experto en Lavado y Mantenimiento', 'Procesos rápidos con resultados impecables.', ['Lavado Premium', 'Motor', 'Tapicería'], 'J'],
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/40 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center text-blue-200 font-bold text-2xl">
                            {m[4]}
                          </div>
                          <div>
                            <div className="text-white font-semibold">{m[0]}</div>
                            <div className="text-blue-400 text-sm font-semibold">{m[1]}</div>
                          </div>
                        </div>
                        <div className="text-slate-400 text-sm mb-5">{m[2]}</div>
                        <div className="flex flex-wrap gap-2">
                          {m[3].map((tag) => (
                            <span
                              key={tag}
                              className="bg-blue-600/20 border border-blue-500 text-blue-300 rounded-full px-3 py-1 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section data-reveal className="reveal py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-14">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Trabajamos con los mejores</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Productos y técnicas certificadas internacionalmente
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      ['🏆', 'Certificación internacional en detailing'],
                      ['🌿', 'Productos biodegradables y eco-friendly'],
                      ['🛡️', 'Garantía en todos nuestros servicios'],
                      ['👨‍🔧', 'Técnicos con formación continua'],
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
                      >
                        <div className="text-2xl mb-3">{c[0]}</div>
                        <div className="text-slate-300">{c[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeView === 'contacto' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section data-reveal className="reveal relative py-20 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-25 carbon-fiber" />
                <div className="pointer-events-none absolute inset-0 grain" />
                <div className="container mx-auto px-6">
                  <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="text-blue-400 text-sm">Contáctanos</span>
                    <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
                      ¿Tienes alguna pregunta?
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                      Estamos aquí para ayudarte
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="rounded-3xl bg-white/[0.03] p-8 border border-white/[0.08] backdrop-blur-md shadow-2xl shadow-blue-900/10 lg:-translate-y-1">
                      <form onSubmit={this.handleContactSubmit} className="space-y-5">
                        <div>
                        <h1 className="text-white text-center  mb-10">Escribenos Aquí</h1>
                          <label className="block text-white font-semibold mb-2">Nombre completo</label>
                          <input
                            type="text"
                            name="nombre"
                            value={contactForm.nombre}
                            onChange={this.handleContactChange}
                            className={`w-full bg-gray-800/40 rounded-lg px-4 py-3 border text-white placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${contactErrors.nombre ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="Tu nombre"
                          />
                          {contactErrors.nombre && <div className="text-red-400 text-sm mt-2">{contactErrors.nombre}</div>}
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2">Email</label>
                          <input
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={this.handleContactChange}
                            className={`w-full bg-gray-800/40 rounded-lg px-4 py-3 border text-white placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${contactErrors.email ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="tu email@correo.com"
                          />
                          {contactErrors.email && <div className="text-red-400 text-sm mt-2">{contactErrors.email}</div>}
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2">Teléfono</label>
                          <input
                            type="tel"
                            name="telefono"
                            value={contactForm.telefono}
                            onChange={this.handleContactChange}
                            className={`w-full bg-gray-800/40 rounded-lg px-4 py-3 border text-white placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${contactErrors.telefono ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="+57 300 000 0000"
                          />
                          {contactErrors.telefono && <div className="text-red-400 text-sm mt-2">{contactErrors.telefono}</div>}
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2">Tipo de servicio</label>
                          <select
                            name="servicio"
                            value={contactForm.servicio}
                            onChange={this.handleContactChange}
                            className={`w-full bg-gray-800/40 rounded-lg px-4 py-3 border text-white transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${contactErrors.servicio ? 'border-red-500' : 'border-gray-600'}`}
                          >
                            <option value="">Selecciona una opción</option>
                            <option value="Lavado Premium">Lavado Premium</option>
                            <option value="Lavado Express">Lavado Express</option>
                            <option value="Lavado de Motor">Lavado de Motor</option>
                            <option value="Limpieza Profunda">Limpieza Profunda</option>
                            <option value="Protección Cerámica">Protección Cerámica</option>
                            <option value="Pulido Profesional">Pulido Profesional</option>
                          </select>
                          {contactErrors.servicio && <div className="text-red-400 text-sm mt-2">{contactErrors.servicio}</div>}
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2">Mensaje</label>
                          <textarea
                            name="mensaje"
                            value={contactForm.mensaje}
                            onChange={this.handleContactChange}
                            rows={5}
                            className={`w-full bg-gray-800/40 rounded-lg px-4 py-3 border text-white resize-none placeholder:text-slate-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${contactErrors.mensaje ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="Cuéntanos cómo podemos ayudarte"
                          />
                          {contactErrors.mensaje && <div className="text-red-400 text-sm mt-2">{contactErrors.mensaje}</div>}
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-6 py-4 transition-all duration-300"
                        >
                          Enviar mensaje
                        </button>

                        {contactSuccess && (
                          <div className="text-emerald-300 text-sm mt-2">
                            ✅ Mensaje enviado correctamente. Te contactaremos pronto.
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="space-y-6 lg:translate-y-2">
                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">📞</div>
                          <div>
                            <div className="text-white font-semibold">Teléfono</div>
                            <div className="text-slate-400 mt-1">+57 316 810 6470</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">✉️</div>
                          <div>
                            <div className="text-white font-semibold">Email</div>
                            <div className="text-slate-400 mt-1">pinillvalenciak@gmail.com</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">🕐</div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">Horario</div>
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Lunes</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Martes</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Miércoles</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Jueves</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Viernes</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Sábado</span>
                                <span className="text-white">8:00am - 6:00pm</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Domingo</span>
                                <span className="text-red-400">Cerrado</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeView === 'agendado' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section className="relative py-16 overflow-hidden"> 
                <div className="pointer-events-none absolute inset-0 opacity-25 carbon-fiber" /> 
                <div className="container mx-auto px-6"> 
                  <div className="text-center max-w-3xl mx-auto mb-12"> 
                    <span className="text-blue-400 text-sm">Reserva en línea</span> 
                    <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-4 tracking-tight"> 
                      Agenda tu servicio 
                    </h2> 
                    <p className="text-slate-400 text-lg leading-relaxed"> 
                      Rápido, fácil y sin filas. Tu cita confirmada en minutos. 
                    </p> 
                  </div> 
                  <AgendamientoPublico /> 
                </div> 
              </section>
            </div>
          )}

          {activeView === 'ubicacion' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section data-reveal className="reveal relative py-20 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-25 carbon-fiber" />
                <div className="pointer-events-none absolute inset-0 grain" />
                <div className="container mx-auto px-6">
                  <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="text-blue-400 text-sm">Ubicación</span>
                    <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
                      Encuéntranos
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                      Visítanos en nuestra sede en Ibagué
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="rounded-3xl bg-white/[0.03] p-8 border border-white/[0.08] backdrop-blur-md shadow-2xl shadow-blue-900/10 hover:border-blue-500/25 transition-all duration-200 ease-out lg:translate-y-2">
                      <h3 className="text-2xl font-semibold mb-6">Nuestra sede</h3>
                      <div className="space-y-4 text-slate-300">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                            <img src={ubicIcon} alt="ubicacion" className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Dirección</div>
                            <div className="text-slate-400">Ibagué, Tolima, Colombia</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                            <img src={relojIcon} alt="reloj" className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Horario de atención</div>
                            <div className="text-slate-400">Lun-Sáb 8:00am - 6:00pm</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                            <img src={telefonoIcon} alt="telefono" className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Teléfono</div>
                            <div className="text-slate-400">+57 316 810 6470</div>
                          </div>
                        </div>
                      </div>

                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Ibague+Tolima+Colombia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md text-white font-semibold transition-all duration-200 ease-out hover:bg-white/15 hover:border-blue-500/45 hover:shadow-[0_0_18px_rgba(59,130,246,0.18)]"
                      >
                        Cómo llegar
                      </a>
                    </div>

                    <div className="rounded-3xl bg-white/[0.03] p-8 border border-white/[0.08] backdrop-blur-md shadow-2xl shadow-blue-900/10 hover:border-blue-500/25 transition-all duration-200 ease-out lg:-translate-y-2">
                      <div className="bg-gray-900/40 border border-white/10 rounded-3xl h-80 w-full overflow-hidden shadow-[0_0_16px_rgba(59,130,246,0.10)]">
                        <MapContainer
                          center={[4.4389, -75.2322]}
                          zoom={15}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[4.4389, -75.2322]}>
                            <Popup>MotoExpert - Detailing & Car Care (Ibagué)</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section data-reveal className="reveal py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      ['🚗', 'Parqueadero disponible', 'Amplio espacio para tu vehículo'],
                      ['♿', 'Accesible', 'Instalaciones adaptadas para todos'],
                      ['🔒', 'Seguridad', 'Zona vigilada las 24 horas'],
                    ].map((c, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
                      >
                        <div className="text-2xl mb-3">{c[0]}</div>
                        <div className="text-lg font-semibold mb-2">{c[1]}</div>
                        <div className="text-slate-400">{c[2]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        <footer className="bg-gray-950 border-t border-gray-800">
          <div className="container mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <img src={require('../assets/images/logo.png')} alt="MotoExpert" className="h-10 w-auto object-contain" />
                <div>
                  <div className="text-lg font-semibold tracking-tight">
                    Moto<span className="text-blue-400">Expert</span>
                  </div>
                  <div className="text-sm text-slate-500">Lavado del mas alto nivel</div>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-end gap-4">
                {[
                  {
                    name: 'WhatsApp',
                    href: 'https://wa.me/573168106470',
                    icon: <FaWhatsapp className="w-6 h-6 text-white" />,
                    style: { backgroundColor: '#25D366' },
                  },
                  {
                    name: 'Instagram',
                    href: 'https://www.instagram.com/',
                    icon: <FaInstagram className="w-6 h-6 text-white" />,
                    style: { background: 'linear-gradient(135deg, #E1306C 0%, #833AB4 100%)' },
                  },
                  {
                    name: 'Facebook',
                    href: 'https://www.facebook.com/',
                    icon: <FaFacebook className="w-6 h-6 text-white" />,
                    style: { backgroundColor: '#1877F2' },
                  },
                  {
                    name: 'X (Twitter)',
                    href: 'https://twitter.com/',
                    icon: <FaTwitter className="w-6 h-6 text-white" />,
                    style: { backgroundColor: '#1DA1F2' },
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    style={social.style}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-500 border border-white/10"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
            <div className="text-center text-slate-500 text-sm">© 2024 MotoExpert. Todos los derechos reservados.</div>
          </div>
        </footer>
      </div>
    );
  }
}

export default LandingPage;
