import React, { Component } from 'react';

class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
    };
  }

  toggleMenu = () => {
    this.setState((prevState) => ({
      isMenuOpen: !prevState.isMenuOpen,
    }));
  };

  render() {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        {/* HEADER / NAVBAR */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">M</span>
              </div>
              <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                MotoExpert
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#servicios" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Servicios</a>
              <a href="#nosotros" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Nosotros</a>
              <a href="#contacto" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Contacto</a>
              <button 
                onClick={this.props.onEnterLogin}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                Iniciar Sesión
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={this.toggleMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={this.state.isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {this.state.isMenuOpen && (
            <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col space-y-4">
              <a href="#servicios" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Servicios</a>
              <a href="#nosotros" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Nosotros</a>
              <a href="#contacto" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Contacto</a>
              <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Iniciar Sesión</button>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1558981403-c5f91cbba527?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
              alt="Moto Background" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950 to-slate-950"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
              Líderes en gestión de lavados
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Un click <br /> 
              y tu <span className="text-blue-600">Vehiculo</span> brilla
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              La plataforma integral para dueños de motocicletas y autos especializados. 
              Organiza tus citas, historial de lavado y servicios en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-blue-600/20">
                Agendar una Cita
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700">
                Ver Servicios
              </button>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section id="servicios" className="py-24 bg-slate-950 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Servicios Especializados</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Soluciones profesionales diseñadas para mantener tus vehiculos en óptimas condiciones.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1: lavado basico */}
              <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Basico</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio de limpieza exterior del vehículo que incluye enjuague, aplicación de jabón, limpieza de rines y secado. Es ideal para mantener el carro limpio en el día a día de forma rápida y económica.</p>
                <a href="#mantenimiento" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 2: lavado express */}
              <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Express</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Lavado exterior rápido enfocado en remover la suciedad superficial en el menor tiempo posible. No incluye detalles profundos, está pensado para personas con poco tiempo.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 3: lavado premium */}
              <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Premium</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio completo que incluye lavado exterior, aspirado interior, limpieza de vidrios, tablero y detalles generales. Deja el vehículo limpio tanto por dentro como por fuera.</p>
                <a href="#repuestos" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 4: lavado motor */}
              <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado De Motor</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Limpieza especializada del motor usando productos adecuados que eliminan grasa y suciedad sin dañar componentes. Ayuda a mejorar el mantenimiento y apariencia del motor.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 5: limpieza profunda */}
              <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Limpieza Profunda</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio detallado que incluye limpieza completa del interior y exterior del vehículo, eliminación de manchas, suciedad acumulada y acabados que dejan el carro como nuevo.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* INFO SECTION: NOSOTROS */}
        <section id="nosotros" className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">Pasión por las dos ruedas y la tecnología</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                En MotoExpert entendemos que tu motocicleta no es solo un vehículo, es tu libertad. Por eso, hemos creado una plataforma que conecta a los mejores técnicos con dueños apasionados.
              </p>
              <ul className="space-y-4">
                {[
                  "Control total de tu historial clínico mecánico",
                  "Recordatorios inteligentes de mantenimiento",
                  "Red de talleres certificados en todo el país"
                ].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-300 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-full"></div>
              <img 
                src="https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Nosotros" 
                className="relative rounded-3xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="contacto" className="bg-slate-950 pt-24 pb-12 border-t border-slate-900">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-2">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="font-bold">M</span>
                  </div>
                  <span className="text-xl font-bold tracking-tight">MotoExpert</span>
                </div>
                <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Llevando la gestión de motocicletas al siguiente nivel con tecnología de punta y servicio humano excepcional.
                </p>
                <div className="flex space-x-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full hover:bg-blue-600 hover:border-blue-600 transition-all cursor-pointer"></div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-6">Navegación</h4>
                <ul className="space-y-4 text-slate-500 text-sm">
                  <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
                  <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                  <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6">Legal</h4>
                <ul className="space-y-4 text-slate-500 text-sm">
                  <li><a href="#privacy" className="hover:text-white transition-colors">Privacidad</a></li>
                  <li><a href="#terms" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
                  <li><a href="#cookies" className="hover:text-white transition-colors">Cookies</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-900 text-center text-slate-600 text-xs">
              <p>© {new Date().getFullYear()} MotoExpert S.A.S. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

export default LandingPage;
