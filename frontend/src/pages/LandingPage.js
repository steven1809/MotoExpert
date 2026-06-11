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
import correoIcon from '../assets/iconos/correo.png';



import { API_BASE_URL } from '../apiConfig';

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
    mobileMenuOpen: false,
    filtrosOpen: false,
    deferredPrompt: null,
    showInstallBanner: false,
    showIosInstructions: false,
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

  toggleMobileMenu = () => {
    this.setState((prev) => ({ mobileMenuOpen: !prev.mobileMenuOpen }));
  };

  toggleFiltros = () => {
    this.setState((prev) => ({ filtrosOpen: !prev.filtrosOpen }));
  };


  componentDidMount() {
    try {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.handleScroll();
    } catch {}
    this.initRevealObserver();
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  componentWillUnmount() {
    try {
      window.removeEventListener('scroll', this.handleScroll);
    } catch {}
    try {
      this.revealObserver?.disconnect?.();
    } catch {}
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
  }

  handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    this.setState({ deferredPrompt: e, showInstallBanner: true });
  };

  handleAppInstalled = () => {
    this.setState({ deferredPrompt: null, showInstallBanner: false });
  };

  handleInstallClick = async () => {
    const { deferredPrompt } = this.state;
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      this.setState({ deferredPrompt: null, showInstallBanner: false });
    }
  };

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
          : Array.isArray(data?.data)
            ? data.data
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
          <div className="container mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">

            {/* LOGO */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => this.setActiveView('inicio')}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl">
                <img
                  src={require('../assets/images/logo.png')}
                  alt="MotoExpert"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold tracking-tight">
                  Moto<span className="text-white">Expert</span>
                </h1>
                <p className="text-[11px] text-white/70">Lo mejor para tu vehiculo</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-semibold tracking-tight">
                  Moto<span className="text-white">Expert</span>
                </h1>
              </div>
            </div>

            {/* NAV DESKTOP */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8 text-xs md:text-sm">
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
                    className={`relative text-xs md:text-sm text-white/80 hover:text-white transition-colors after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gradient-to-r after:from-blue-400 after:to-cyan-300 after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                      isActive ? 'after:scale-x-100' : ''
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* ACTIONS DESKTOP */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              <button
                onClick={this.props.onEnterLogin}
                className="text-xs md:text-sm text-white/80 hover:text-white transition-colors"
              >
                Iniciar sesión
              </button>
              <button
                onClick={this.props.onEnterRegister}
                className="px-3 md:px-4 lg:px-6 py-2 md:py-3 rounded-xl bg-transparent border border-white hover:border-blue-600 hover:text-blue-600 transition-all duration-300 shadow-lg text-xs md:text-sm"
              >
                Registrarse
              </button>
            </div>

            {/* HAMBURGER MOBILE */}
            <button
              onClick={this.toggleMobileMenu}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-white/20 bg-white/5 text-white transition-all"
              type="button"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={this.state.mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* MOBILE MENU DROPDOWN */}
          {this.state.mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[rgba(5,5,20,0.97)] backdrop-blur-xl">
              <nav className="flex flex-col px-6 py-4 gap-1">
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
                      onClick={() => {
                        this.setActiveView(key);
                        this.setState({ mobileMenuOpen: false });
                      }}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-3 px-6 pb-6 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    this.props.onEnterLogin();
                    this.setState({ mobileMenuOpen: false });
                  }}
                  className="w-full py-3 rounded-xl border border-white/20 text-white/80 hover:text-white text-sm font-medium transition-all hover:bg-white/5"
                >
                  Iniciar sesión
                </button>
                <button
                  onClick={() => {
                    this.props.onEnterRegister();
                    this.setState({ mobileMenuOpen: false });
                  }}
                  className="w-full py-3 rounded-xl border border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white text-sm font-medium transition-all duration-300"
                >
                  Registrarse
                </button>
              </div>
            </div>
          )}
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
                      className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/15 transition-all duration-300"
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
              {/* SECCIÓN INSTALAR APP */}
              <section className="relative py-16 px-4 sm:px-6">
                <div className="container mx-auto max-w-2xl">
                  <div className="rounded-3xl border border-blue-500/20 bg-white/[0.03] backdrop-blur-md p-8 flex flex-col sm:flex-row items-center gap-6 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                    
                    {/* Ícono */}
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12" y2="18.01"/>
                      </svg>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-white font-bold text-xl tracking-tight">
                        Descarga la App MotoExpert
                      </h3>
                      <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                        Accede rápido desde tu celular, agenda citas y consulta tus servicios sin abrir el navegador.
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
                      {/* Android */}
                      <button
                        onClick={this.handleInstallClick}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-blue-900/30"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/>
                        </svg>
                        Instalar en Android
                      </button>

                      {/* iOS */}
                      <button
                        onClick={() => this.setState({ showIosInstructions: !this.state.showIosInstructions })}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/20 hover:border-blue-500/40 hover:bg-white/10 text-white text-sm font-semibold transition-all duration-300"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Instalar en iOS
                      </button>
                    </div>
                  </div>

                  {/* Instrucciones iOS desplegables */}
                  {this.state.showIosInstructions && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-white font-semibold text-sm mb-3">Para instalar en iPhone / iPad:</p>
                      <ol className="space-y-2 text-slate-400 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">1.</span>
                          Abre esta página en <span className="text-white font-medium">Safari</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">2.</span>
                          Toca el ícono de <span className="text-white font-medium">Compartir</span> (cuadrado con flecha ↑)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">3.</span>
                          Selecciona <span className="text-white font-medium">"Agregar a pantalla de inicio"</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 font-bold">4.</span>
                          Toca <span className="text-white font-medium">Agregar</span> — ¡listo!
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeView === 'servicios' && (
            <div className="pt-28 animate-in fade-in duration-200">
              <section data-reveal className="reveal relative py-12 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 opacity-60 diag-lines" />
                <div className="pointer-events-none absolute inset-0 grain" />
                <div className="container mx-auto px-4 sm:px-6">

                  {/* HEADER SECCIÓN */}
                  <div className="text-center mb-10">
                    <span className="text-blue-400 text-sm">Nuestros servicios</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-3 tracking-tight">
                      Cuidado completo para tu vehículo
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
                      Servicios profesionales diseñados para mantener tu vehículo limpio, protegido y en excelentes condiciones.
                    </p>
                  </div>

                  {/* BARRA SUPERIOR: contador + orden + botón filtros */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="text-gray-300 text-sm">
                      Servicios <span className="text-gray-500">|</span>{' '}
                      <span className="text-white font-semibold">{serviciosOrdenados.length}</span> servicios
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        name="orden"
                        value={landingFiltros.orden}
                        onChange={this.handleLandingFiltroChange}
                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="recientes">Recientes</option>
                        <option value="precio_asc">Menor precio</option>
                        <option value="precio_desc">Mayor precio</option>
                      </select>

                      {/* BOTÓN FILTROS */}
                      <button
                        type="button"
                        onClick={this.toggleFiltros}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                          this.state.filtrosOpen || hasActiveFilters
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-gray-800 border-gray-700 text-white hover:border-blue-500 hover:text-blue-300'
                        }`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
                        </svg>
                        Filtros
                        {hasActiveFilters && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 ml-1" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PANEL DE FILTROS DESPLEGABLE */}
                  {this.state.filtrosOpen && (
                    <div className="mb-6 rounded-2xl border border-white/10 bg-gray-800/60 backdrop-blur-md p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="text-white text-xs font-semibold mb-1.5 block uppercase tracking-wider">Categoría</label>
                          <select
                            name="categoria"
                            value={landingFiltros.categoria}
                            onChange={this.handleLandingFiltroChange}
                            className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-blue-500 ${landingFiltros.categoria ? 'border-blue-500' : 'border-gray-600'}`}
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
                          <label className="text-white text-xs font-semibold mb-1.5 block uppercase tracking-wider">Vehículo</label>
                          <select
                            name="tipo_vehiculo"
                            value={landingFiltros.tipo_vehiculo}
                            onChange={this.handleLandingFiltroChange}
                            className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-blue-500 ${landingFiltros.tipo_vehiculo ? 'border-blue-500' : 'border-gray-600'}`}
                          >
                            <option value="">Todos</option>
                            <option value="Auto">Auto</option>
                            <option value="Moto">Moto</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white text-xs font-semibold mb-1.5 block uppercase tracking-wider">Duración</label>
                          <select
                            name="duracion"
                            value={landingFiltros.duracion}
                            onChange={this.handleLandingFiltroChange}
                            className={`bg-gray-700 border text-white rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:border-blue-500 ${landingFiltros.duracion ? 'border-blue-500' : 'border-gray-600'}`}
                          >
                            <option value="">Cualquiera</option>
                            <option value="rapido">Rápido (&lt;1h)</option>
                            <option value="medio">Medio (1-3h)</option>
                            <option value="completo">Completo (&gt;3h)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-white text-xs font-semibold mb-1.5 block uppercase tracking-wider">Precio</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              name="precio_desde"
                              value={landingFiltros.precio_desde}
                              onChange={this.handleLandingFiltroChange}
                              placeholder="Desde"
                              className={`bg-gray-700 border text-white rounded-lg px-2 py-2 w-full text-sm focus:outline-none focus:border-blue-500 ${landingFiltros.precio_desde ? 'border-blue-500' : 'border-gray-600'}`}
                            />
                            <input
                              type="number"
                              name="precio_hasta"
                              value={landingFiltros.precio_hasta}
                              onChange={this.handleLandingFiltroChange}
                              placeholder="Hasta"
                              className={`bg-gray-700 border text-white rounded-lg px-2 py-2 w-full text-sm focus:outline-none focus:border-blue-500 ${landingFiltros.precio_hasta ? 'border-blue-500' : 'border-gray-600'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {hasActiveFilters && (
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={this.clearLandingFiltros}
                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                            </svg>
                            Limpiar filtros
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHIPS DE FILTROS ACTIVOS */}
                  {hasActiveFilters && chips.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {chips.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => this.clearOneFiltro(c.key)}
                          className="inline-flex items-center gap-1 bg-blue-600/20 border border-blue-500 text-blue-400 rounded-full px-3 py-1 text-xs hover:bg-blue-600/30 transition-colors"
                        >
                          <span>{c.label}</span>
                          <span className="text-blue-300">×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* LOADING */}
                  {landingLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl bg-gray-700/50 p-8 animate-pulse h-64" />
                      ))}
                    </div>
                  )}

                  {/* ERROR */}
                  {!landingLoading && landingError && (
                    <div className="text-center text-red-300 mt-10">{landingError}</div>
                  )}

                  {/* EMPTY */}
                  {!landingLoading && !landingError && serviciosOrdenados.length === 0 && (
                    <div className="text-center text-slate-300 mt-10 border border-white/5 bg-white/[0.03] rounded-3xl p-10">
                      <div className="text-4xl mb-4">🔍</div>
                      <div className="text-lg font-semibold">No encontramos servicios con esos filtros</div>
                      <div className="text-slate-400 mt-2">Intenta ajustar o limpiar los filtros</div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={this.clearLandingFiltros}
                          className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium underline transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}

                  {/* CARDS */}
                  {!landingLoading && !landingError && serviciosOrdenados.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          categoria === 'Lavado' ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : categoria === 'Motor' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500'
                          : categoria === 'Limpieza' ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : categoria === 'Protección' ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                          : 'bg-gradient-to-r from-orange-500 to-red-500';

                        return (
                          <div
                            key={servicio.id}
                            style={{ transitionDelay: landingCardsVisible ? `${i * 75}ms` : '0ms' }}
                            className={`group relative h-72 rounded-2xl overflow-hidden bg-white/[0.05] backdrop-blur-md border border-white/[0.08] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-blue-500 hover:shadow-[0_0_22px_rgba(59,130,246,0.18)] ${
                              landingCardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                            }`}
                          >
                            <img
                              src={imagen}
                              alt={nombre}
                              className="absolute inset-0 w-full h-full object-cover object-center opacity-95"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                            <div className="absolute top-4 left-4 z-10">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest text-white ${badgeColor} shadow-lg`}>
                                {categoria}
                              </span>
                            </div>

                            <div className="absolute top-4 right-4 z-10 text-blue-200/90 font-extrabold tracking-tight">
                              {precioShort || 'Consulta'}
                            </div>

                            <div
                              className="absolute inset-x-0 bottom-0 z-10 p-5 backdrop-blur-md border-t border-white/10"
                              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(0,0,0,0.95))' }}
                            >
                              <h3 className="text-white text-xl font-bold">{nombre}</h3>
                              <div className="mt-2 text-gray-300 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span>⏱ {duracion}</span>
                                <span className="text-gray-500">·</span>
                                <span>{categoria}</span>
                                <span className="text-gray-500">·</span>
                                <span>⭐ {Number.isFinite(rating) ? rating.toFixed(1) : meta.rating.toFixed(1)}</span>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof this.props.onEnterLogin === 'function') this.props.onEnterLogin();
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all duration-200 text-white font-semibold text-xs shadow-lg"
                                >
                                  <FaCalendarAlt className="w-4 h-4" />
                                  AGENDAR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => this.openLandingServicioDetalle(servicio)}
                                  className="flex-1 inline-flex items-center justify-center px-3 py-2.5 rounded-xl bg-white/5 border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200 text-white font-semibold text-xs"
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

                  {/* MODAL DETALLE */}
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
                        <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                          <div className="relative h-44">
                            <img src={imagen} alt={nombre} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/55" />
                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-600/20 border border-blue-500 text-blue-200">
                              {categoria}
                            </div>
                            <div className="absolute top-4 right-4 text-blue-300 font-bold">{precioShort || 'Consulta'}</div>
                            <button
                              type="button"
                              onClick={this.closeLandingServicioDetalle}
                              className="absolute bottom-4 right-4 w-10 h-10 rounded-full border border-white/10 bg-black/30 hover:bg-black/50 transition-all text-white text-xl"
                            >
                              ×
                            </button>
                            <div className="absolute left-5 bottom-4">
                              <div className="text-white text-xl font-bold">{nombre}</div>
                              <div className="text-gray-300 text-sm mt-1">
                                ⏱ {duracion} · ⭐ {Number.isFinite(rating) ? rating.toFixed(1) : meta.rating.toFixed(1)}{' '}
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
                              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all text-white font-semibold"
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
                  <span className="text-blue-400 text-sm">Proyecto académico</span>
                  <h2 className="text-4xl md:text-6xl font-bold mt-4 mb-6 tracking-tight">
                    Aprendiendo construyendo
                  </h2>
                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                    Somos estudiantes del SENA y MotoExpert es nuestro proyecto formativo.
                  </p>
                </div>
              </section>

              <section data-reveal className="reveal py-20">
                <div className="container mx-auto px-6">
                  <div className="grid lg:grid-cols-2 gap-12 items-start">
                    <div>
                      <h3 className="text-3xl font-bold mb-6 tracking-tight">¿Quiénes somos?</h3>
                      <div className="space-y-5 text-slate-300 leading-relaxed">
                        <p>
                          Somos un equipo de 5 estudiantes del programa ADSO (Análisis y Desarrollo de Software) del SENA, sede Ibagué, Tolima. Durante aproximadamente dos años construimos MotoExpert como proyecto formativo, aplicando conocimientos reales en análisis de requerimientos, diseño de software, desarrollo web, bases de datos y gestión de proyectos.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        ['','El proyecto','MotoExpert nació de identificar un problema real: muchos talleres de motos aún gestionan sus operaciones por WhatsApp, llamadas y hojas de cálculo. Construimos una plataforma web que centraliza citas, clientes, vehículos y servicios en un solo sistema, convirtiendo talleres tradicionales en negocios digitalmente organizados.','border-blue-500'],
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
                    <span className="text-blue-400 text-sm">Equipo SENA</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">Nuestro equipo</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      Aprendices SENA que diseñaron y desarrollaron MotoExpert
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
                    {[
                      ['Steven Díaz', 'S', ''],
                      ['Sebastián Pinilla', 'S', ''],
                      ['Andrés Montenegro', 'A', ''],
                      ['Brandon Sánchez', 'B', ''],
                      ['Alenxandro Lemus', 'A', ''],
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-gray-800/50 p-6 border border-white/5 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center flex-col gap-4 mb-5">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600/40 to-cyan-500/20 border border-blue-500/40 flex items-center justify-center text-blue-200 font-bold text-2xl">
                            {m[1]}
                          </div>
                          <div className="text-center">
                            <div className="text-white font-semibold">{m[0]}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mb-14">
                    <span className="text-blue-400 text-sm">Equipo del taller</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4">Nuestros profesionales</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg mt-4">
                      El equipo humano que hace posible cada servicio
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      ['Carlos Alberto Rodríguez', 'Mecánico Principal', 'Especialista en motores de alta cilindrada con 12 años de experiencia.', 'CR'],
                      ['Ana María Gutiérrez', 'Técnica de Mantenimiento', 'Experta en mantenimiento preventivo y diagnóstico de fallas.', 'AG'],
                      ['Luis Fernando Vélez', 'Especialista en Detailing', 'Maestro en limpieza y restauración de motos premium.', 'LV'],
                      ['Sofía Isabel Mejía', 'Coordinadora de Citas', 'Asegura una experiencia fluida desde la reserva hasta la entrega.', 'SM'],
                      ['Javier Andrés Ramírez', 'Administrador', 'Gestiona operaciones y garantiza la calidad del servicio.', 'JR'],
                      ['Paula Andrea González', 'Asesora de Servicios', 'Ayuda a elegir el mejor servicio para tu moto.', 'PG'],
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/80 p-8 border border-white/10 hover:border-blue-500/50 hover:bg-gray-800/90 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-blue-600/30 border-2 border-blue-500/30 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-blue-900/20">
                            {m[3]}
                          </div>
                          <div className="text-center space-y-2">
                            <h4 className="text-xl font-bold text-white tracking-tight">{m[0]}</h4>
                            <p className="text-blue-400 font-semibold text-sm">{m[1]}</p>
                            <p className="text-slate-400 text-sm leading-relaxed">{m[2]}</p>
                          </div>
                        </div>
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
                             Mensaje enviado correctamente. Te contactaremos pronto.
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="space-y-6 lg:translate-y-2">
                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl"><img src={telefonoIcon} alt="phone" className="w-5 h-5" /></div>
                          <div>
                            <div className="text-white font-semibold">Teléfono</div>
                            <div className="text-slate-400 mt-1">+57 316 810 6470</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl"><img src={correoIcon} alt="email" className="w-5 h-5" /></div>
                          <div>
                            <div className="text-white font-semibold">Email</div>
                            <div className="text-slate-400 mt-1">pinillvalenciak@gmail.com</div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/[0.03] p-6 border border-white/10 backdrop-blur-md shadow-lg shadow-blue-900/10 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.14)] transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="text-2xl"><img src={relojIcon} alt="time" className="w-5 h-5" /></div>
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
                            <div className="text-slate-400">SENA - Centro de Industria y Construcción<br/>Carrera 2 # 10-19, Ibagué, Tolima</div>
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
                        href="https://www.google.com/maps/search/?api=1&query=SENA+Centro+de+Industria+y+Construccion+Carrera+2+10-19+Ibague+Tolima+Colombia"
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
                            <Popup>SENA - Centro de Industria y Construcción (Ibagué)</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        {/* BANNER INSTALAR PWA */}
        {this.state.showInstallBanner && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-blue-500/30 bg-[rgba(5,10,30,0.95)] backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.2)] p-4 flex items-center gap-4">
              
              {/* Ícono */}
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <img src={require('../assets/images/logo.png')} alt="MotoExpert" className="w-8 h-8 object-contain" />
              </div>

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">Instalar MotoExpert</div>
                <div className="text-slate-400 text-xs mt-0.5">Accede rápido desde tu pantalla de inicio</div>
              </div>

              {/* Botones */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={this.handleInstallClick}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                >
                  Instalar
                </button>
                <button
                  onClick={() => this.setState({ showInstallBanner: false })}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-all"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        )}

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
