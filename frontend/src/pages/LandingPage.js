import React, { Component } from 'react';
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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const IconWhatsapp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 12a8 8 0 0 1-11.5 7.2L4 20l.9-3.7A8 8 0 1 1 20 12Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 10.2c.3-.6.6-.7 1-.7h.7c.2 0 .5.1.6.4l.8 1.7c.1.3.1.5 0 .7l-.5.7c-.1.2-.1.4 0 .6.5.9 1.3 1.7 2.2 2.2.2.1.4.1.6 0l.7-.5c.2-.1.4-.1.7 0l1.7.8c.3.1.4.4.4.6v.7c0 .4-.1.7-.7 1-1 .6-2.2.5-3.3.1-2.2-.8-4.3-2.9-5.1-5.1-.4-1.1-.5-2.3.1-3.2Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconInstagram = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconFacebook = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 8h2V5h-2c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V8c0-.55.45-1 1-1Z" />
  </svg>
);

const IconTwitterX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 4l14 16" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 4L5 20" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

class LandingPage extends Component {
  state = {
    activeView: 'inicio',
    landingServicios: [],
    landingLoading: false,
    landingError: '',
    landingCardsVisible: true,
    landingServicioDetalleOpen: false,
    landingServicioDetalle: null,
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

  componentDidUpdate(prevProps, prevState) {
    if (this.state.activeView !== 'servicios') return;
    const viewChanged = prevState.activeView !== this.state.activeView;
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

  handleContactSubmit = (e) => {
    e.preventDefault();
    const errors = this.validateContactForm();
    if (Object.keys(errors).length > 0) {
      this.setState({ contactErrors: errors, contactSuccess: false });
      return;
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
    const { activeView } = this.state;
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
        <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
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
                ['ubicacion', 'Ubicación'],
              ].map(([key, label]) => {
                const isActive = activeView === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => this.setActiveView(key)}
                    className={`text-sm text-white/80 hover:text-white transition-colors ${
                      isActive ? 'underline underline-offset-8 decoration-white/70' : ''
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
              <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-32">
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

                <div
                  className="absolute top-0 left-0 right-0 h-[120px] z-10 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                  }}
                />

                <div className="container mx-auto px-6 relative z-20 text-center">

                  <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
                    Lavado y Mantenimiento

                    <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                      con nivel profesional
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12">
                    Agenda servicios, administra mantenimientos y dale a tu vehículo
                    el cuidado profesional que merece.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5">

                    <button
                      onClick={() => this.setActiveView('Login')}
                      className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-blue-600/30"
                    >
                      Agendar cita
                    </button>

                    <button
                      type="button"
                      onClick={() => this.setActiveView('servicios')}
                      className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
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
              <section className="py-28">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-20">
                    <span className="text-blue-400 text-sm">Nuestros servicios</span>

                    <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6 tracking-tight">
                      Cuidado completo para tu vehículo
                    </h2>

                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
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
                                ? 'bg-blue-500'
                                : categoria === 'Motor'
                                  ? 'bg-purple-500'
                                  : categoria === 'Limpieza'
                                    ? 'bg-green-500'
                                    : categoria === 'Protección'
                                      ? 'bg-yellow-500'
                                      : 'bg-orange-500';

                            return (
                              <div
                                key={servicio.id}
                                style={{
                                  transitionDelay: landingCardsVisible ? `${i * 75}ms` : '0ms',
                                }}
                                className={`group relative h-72 rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-900/30 ${landingCardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'} transition-opacity transition-transform ease-in-out`}
                              >
                                <img
                                  src={imagen}
                                  alt={nombre}
                                  className="absolute inset-0 w-full h-full object-cover object-center"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                                <div className="absolute top-4 left-4 z-10">
                                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold text-white ${badgeColor}`}>
                                    {categoria}
                                  </span>
                                </div>

                                <div className="absolute top-4 right-4 z-10 text-blue-300 font-bold">
                                  {precioShort || 'Consulta'}
                                </div>

                                <div
                                  className="absolute inset-x-0 bottom-0 z-10 p-5"
                                  style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.95))' }}
                                >
                                  <h3 className="text-white text-2xl font-bold">{nombre}</h3>

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
                                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-semibold text-sm"
                                    >
                                      <FaCalendarAlt className="w-4 h-4" />
                                      AGENDAR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => this.openLandingServicioDetalle(servicio)}
                                      className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl bg-transparent border border-gray-500 hover:border-white transition-all duration-300 text-white font-semibold text-sm"
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
              <section className="relative overflow-hidden py-24">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1600)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
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

              <section className="py-20 bg-gray-900/80">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      ['10+', 'Años de experiencia'],
                      ['15.000+', 'Vehículos atendidos'],
                      ['98%', 'Clientes satisfechos'],
                      ['6', 'Servicios especializados'],
                    ].map((s, i) => (
                      <div key={i} className="text-center rounded-2xl bg-gray-800/30 border border-white/5 p-6">
                        <div className="text-4xl font-bold text-blue-500">{s[0]}</div>
                        <div className="text-slate-300 mt-2">{s[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="py-20">
                <div className="container mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div>
                      <h3 className="text-3xl font-bold mb-6">¿Quiénes somos?</h3>
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
                        ['🎯', 'Misión', 'Ofrecer servicios de detailing de clase mundial con atención personalizada, precios justos y resultados que superan las expectativas.'],
                        ['👁️', 'Visión', 'Ser el centro de car care más reconocido de Colombia para 2027, expandiendo nuestra presencia a las principales ciudades del país.'],
                        ['💎', 'Valores', 'Calidad · Honestidad · Puntualidad · Pasión · Responsabilidad ambiental'],
                      ].map((c, i) => (
                        <div
                          key={i}
                          className="bg-gray-800/50 border border-white/5 border-l-4 border-blue-500 rounded-xl p-5 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-xl">{c[0]}</div>
                            <div className="text-white font-semibold">{c[1]}</div>
                          </div>
                          <div className="text-slate-300 leading-relaxed">{c[2]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-20 bg-gray-900/80">
                <div className="container mx-auto px-6">
                  <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-blue-400 text-sm">Tecnología & Precisión</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">Cada detalle importa</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Así como cuidamos cada milímetro de tu vehículo
                    </p>
                  </div>

                  <div className="max-w-3xl mx-auto">
                    <Car3D />
                  </div>
                </div>
              </section>

              <section className="py-20 bg-gray-900/50">
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

              <section className="py-20 bg-gray-900/50">
                <div className="container mx-auto px-6">
                  <div className="text-center mb-14">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Trabajamos con los mejores</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Productos y técnicas certificadas internacionalmente
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      ['✅', 'Certificación internacional en detailing'],
                      ['🌿', 'Productos biodegradables y eco-friendly'],
                      ['🔒', 'Garantía en todos nuestros servicios'],
                      ['🏅', 'Técnicos con formación continua'],
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
              <section className="py-20">
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
                    <div className="rounded-2xl bg-gray-800/50 p-8 border border-white/5">
                      <form onSubmit={this.handleContactSubmit} className="space-y-5">
                        <div>
                          <label className="block text-white font-semibold mb-2">Nombre completo</label>
                          <input
                            type="text"
                            name="nombre"
                            value={contactForm.nombre}
                            onChange={this.handleContactChange}
                            className={`w-full bg-gray-800/50 rounded-lg px-4 py-3 border text-white ${contactErrors.nombre ? 'border-red-500' : 'border-gray-600'}`}
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
                            className={`w-full bg-gray-800/50 rounded-lg px-4 py-3 border text-white ${contactErrors.email ? 'border-red-500' : 'border-gray-600'}`}
                            placeholder="tuemail@correo.com"
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
                            className={`w-full bg-gray-800/50 rounded-lg px-4 py-3 border text-white ${contactErrors.telefono ? 'border-red-500' : 'border-gray-600'}`}
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
                            className={`w-full bg-gray-800/50 rounded-lg px-4 py-3 border text-white ${contactErrors.servicio ? 'border-red-500' : 'border-gray-600'}`}
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
                            className={`w-full bg-gray-800/50 rounded-lg px-4 py-3 border text-white resize-none ${contactErrors.mensaje ? 'border-red-500' : 'border-gray-600'}`}
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
                            ✅ Mensaje enviado, te contactaremos pronto
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="space-y-6">
                      {[
                        ['📞', 'Teléfono', '+57 300 000 0000'],
                        ['✉️', 'Email', 'info@motoexpert.com'],
                        ['🕐', 'Horario', 'Lun-Sáb 8:00am - 6:00pm'],
                      ].map((info, i) => (
                        <div
                          key={i}
                          className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-2xl">{info[0]}</div>
                            <div>
                              <div className="text-white font-semibold">{info[1]}</div>
                              <div className="text-slate-400 mt-1">{info[2]}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">💬</div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">WhatsApp</div>
                            <div className="text-slate-400 mt-1">Escríbenos y te respondemos rápido</div>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  window.open('https://wa.me/573000000000', '_blank', 'noopener,noreferrer');
                                } catch {}
                              }}
                              className="mt-4 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-semibold"
                            >
                              Escribir por WhatsApp
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-gray-700 text-center">
                        <h3 className="text-2xl font-semibold text-white">Síguenos en redes</h3>
                        <p className="text-slate-400 mt-2">Mantente al día con nuestras novedades</p>
                        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                          {[
                            {
                              name: 'WhatsApp',
                              href: 'https://wa.me/573000000000',
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
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-blue-500 ${social.className || 'border border-white/10'}`}
                            >
                              {social.icon}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <footer className="border-t border-white/5 pt-16 pb-10">
                <div className="container mx-auto px-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight">
                        Moto<span className="text-blue-400">Expert</span>
                      </h3>
                      <p className="text-slate-500 mt-2">
                        Detailing & Car Care
                      </p>
                    </div>

                    <div className="flex gap-8 text-slate-400 text-sm">
                      <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                        Instagram
                      </a>
                      <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                        Facebook
                      </a>
                      <a href="https://wa.me/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="border-t border-white/5 mt-10 pt-8 text-center text-slate-500 text-sm">
                    © {new Date().getFullYear()} MotoExpert. Todos los derechos reservados.
                  </div>
                </div>
              </footer>
            </div>
          )}

          {activeView === 'ubicacion' && (
            <div className="pt-32 animate-in fade-in duration-200">
              <section className="py-20">
                <div className="container mx-auto px-6">
                  <div className="text-center max-w-3xl mx-auto mb-14">
                    <span className="text-blue-400 text-sm">Ubicación</span>
                    <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
                      Encuéntranos
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                      Visítanos en nuestra sede principal
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    <div className="rounded-2xl bg-gray-800/50 p-8 border border-white/5">
                      <h3 className="text-2xl font-semibold mb-6">Nuestra sede</h3>
                      <div className="space-y-4 text-slate-300">
                        <div className="flex items-start gap-3">
                          <div className="text-lg">📍</div>
                          <div>
                            <div className="font-semibold text-white">Dirección</div>
                            <div className="text-slate-400">Calle 123 # 45-67, Bogotá, Colombia</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-lg">🕐</div>
                          <div>
                            <div className="font-semibold text-white">Horario de atención</div>
                            <div className="text-slate-400">Lunes a Viernes: 8:00am - 6:00pm</div>
                            <div className="text-slate-400">Sábado: 8:00am - 2:00pm</div>
                            <div className="text-slate-400">Domingo: Cerrado</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-lg">📞</div>
                          <div>
                            <div className="font-semibold text-white">Teléfono</div>
                            <div className="text-slate-400">+57 300 000 0000</div>
                          </div>
                        </div>
                      </div>

                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Calle+123+45-67+Bogota+Colombia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl inline-block transition-all duration-300 font-semibold"
                      >
                        Cómo llegar
                      </a>
                    </div>

                    <div className="rounded-2xl bg-gray-800/50 p-8 border border-white/5">
                      <div className="bg-gray-800 rounded-2xl h-80 w-full overflow-hidden">
                        <MapContainer
                          center={[4.7110, -74.0721]}
                          zoom={15}
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[4.7110, -74.0721]}>
                            <Popup>MotoExpert - Detailing & Car Care (Bogotá)</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="py-20 bg-gray-900/50">
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
      </div>
    );
  }
}

export default LandingPage;
