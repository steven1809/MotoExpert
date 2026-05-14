import React, { Component } from 'react';
import HeroBackgroundSlider from '../components/HeroBackgroundSlider';
import premiumImg from '../assets/services/premium.jpg';
import expressImg from '../assets/services/express.jpeg';
import motorImg from '../assets/services/motor.jpeg';
import limpiezaImg from '../assets/services/limpiezap.jpeg';
import proteccionImg from '../assets/services/proteccionc.jpeg';
import pulidoImg from '../assets/services/pulidop.jpeg';

class LandingPage extends Component {
  state = {
    isMenuOpen: false,
  };

  toggleMenu = () => {
    this.setState((prev) => ({
      isMenuOpen: !prev.isMenuOpen,
    }));
  };

  render() {
    return (
      <div className="min-h-screen bg-[#030712] text-white overflow-hidden">

        {/* BACKGROUND */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full"></div>
        </div>

        {/* HEADER */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/70 backdrop-blur-xl border-b border-white/5">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">

            {/* LOGO */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                  Moto<span className="text-blue-400">Expert</span>
                </h1>

                <p className="text-[11px] text-slate-400">
                  Detailing & Car Care
                </p>
              </div>
            </div>

            {/* NAV */}
            <nav className="hidden md:flex items-center gap-10 text-sm text-slate-300">
              <a href="#inicio" className="hover:text-white transition-colors">
                Inicio
              </a>

              <a href="#servicios" className="hover:text-white transition-colors">
                Servicios
              </a>

              <a href="#nosotros" className="hover:text-white transition-colors">
                Nosotros
              </a>

              <a href="#contacto" className="hover:text-white transition-colors">
                Contacto
              </a>
            </nav>

            {/* ACTIONS */}
            <div className="hidden md:flex items-center gap-4">

              <button
                onClick={this.props.onEnterLogin}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Iniciar sesión
              </button>

              <button
                onClick={this.props.onEnterRegister}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-600/30"
              >
                Registrarse
              </button>
            </div>

            {/* MOBILE BUTTON */}
            <button
              className="md:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
              onClick={this.toggleMenu}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    this.state.isMenuOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
            </button>
          </div>

          {/* MOBILE MENU */}
          {this.state.isMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-[#030712] z-[100] flex flex-col justify-center items-center gap-8">

              <button
                className="absolute top-8 right-8"
                onClick={this.toggleMenu}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <a href="#inicio" className="text-3xl font-semibold">
                Inicio
              </a>

              <a href="#servicios" className="text-3xl font-semibold">
                Servicios
              </a>

              <a href="#nosotros" className="text-3xl font-semibold">
                Nosotros
              </a>

              <a href="#contacto" className="text-3xl font-semibold">
                Contacto
              </a>
            </div>
          )}
        </header>

        {/* HERO */}
        <section
          id="inicio"
          className="relative min-h-screen flex items-center justify-center pt-32"
        >
          <HeroBackgroundSlider />

          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/40 via-[#030712]/70 to-[#030712]"></div>

          <div className="container mx-auto px-6 relative z-10 text-center">

            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/10 mb-8">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>

              <span className="text-sm text-blue-300">
                Servicio premium para tu vehículo
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
              Lavado y detailing

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
                onClick={this.props.onEnterLogin}
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all duration-300 shadow-xl shadow-blue-600/30"
              >
                Agendar cita
              </button>

              <button className="px-8 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
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

        {/* SERVICES */}
        <section id="servicios" className="py-28 relative z-10">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Lavado Premium',
                  description:
                    'Lavado completo con productos de alta calidad, brillo profundo y acabado impecable para todo tipo de vehículos.',
                  bg: premiumImg,
                },
                {
                  title: 'Lavado Express',
                  description:
                    'Servicio rápido y eficiente ideal para mantener tu vehículo limpio en poco tiempo y con excelentes resultados.',
                  bg: expressImg,
                },
                {
                  title: 'Lavado de Motor',
                  description:
                    'Limpieza especializada del motor eliminando grasa y suciedad sin afectar los componentes eléctricos.',
                  bg: motorImg,
                },
                {
                  title: 'Limpieza Profunda',
                  description:
                    'Desinfección y limpieza interior detallada de tapicería, alfombras, techo y paneles del vehículo.',
                  bg: limpiezaImg,
                },
                {
                  title: 'Protección Cerámica',
                  description:
                    'Aplicación de recubrimiento cerámico que protege la pintura contra rayos UV, agua y contaminantes.',
                  bg: proteccionImg,
                },
                {
                  title: 'Pulido Profesional',
                  description:
                    'Corrección de imperfecciones y recuperación del brillo original de la pintura con técnicas profesionales.',
                  bg: pulidoImg,
                },
              ].map((service, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] p-8 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 bg-cover bg-center"
                  style={service.bg ? { backgroundImage: `url(${service.bg})` } : undefined}
                >
                  {service.bg && (
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-[#030712]/45 to-[#030712]/30" />
                  )}

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                      <div className="w-6 h-6 rounded-full bg-blue-400"></div>
                    </div>

                    <h3 className="text-2xl font-semibold mb-4">{service.title}</h3>

                    <p className="text-slate-400 leading-relaxed mb-8">{service.description}</p>

                    <button className="text-blue-400 hover:text-blue-300 transition-colors">
                      Saber más →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NOSOTROS */}
        <section id="nosotros" className="py-28 relative z-10">
          <div className="container mx-auto px-6">

            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div>

                <span className="text-blue-400 text-sm">
                  Sobre MotoExpert
                </span>

                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-8 tracking-tight">
                  Tecnología, detalle y experiencia
                </h2>

                <p className="text-slate-300 text-lg leading-relaxed mb-8">
                  En MotoExpert trabajamos con procesos modernos y atención
                  profesional para ofrecer resultados de alta calidad.
                </p>

                <div className="space-y-5">

                  {[
                    'Productos premium',
                    'Personal capacitado',
                    'Reservas online',
                    'Atención rápida',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">

                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      </div>

                      <span className="text-slate-300 text-lg">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">

                <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-[40px]"></div>

                <img
                  src="https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=1200"
                  alt="MotoExpert"
                  className="relative rounded-[32px] border border-white/10 shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          id="contacto"
          className="border-t border-white/5 pt-16 pb-10 relative z-10"
        >
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

                <a href="#" className="hover:text-white transition-colors">
                  Instagram
                </a>

                <a href="#" className="hover:text-white transition-colors">
                  Facebook
                </a>

                <a href="#" className="hover:text-white transition-colors">
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
    );
  }
}

export default LandingPage;
