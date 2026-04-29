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
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            
            {/* Logo (Left Section) */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold" translate="no">M</span>
              </div>
              <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                MotoExpert
              </span>
            </div>

            {/* Desktop Navigation (Right Section) */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors">Inicio</a>
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
            <button className="md:hidden text-slate-400 hover:text-white" onClick={this.toggleMenu}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={this.state.isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {this.state.isMenuOpen && (
            <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col space-y-4">
              <a href="#inicio" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Inicio</a>
              <a href="#servicios" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Servicios</a>
              <a href="#nosotros" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Nosotros</a>
              <a href="#contacto" className="text-slate-400 py-2 border-b border-slate-800" onClick={this.toggleMenu}>Contacto</a>
              <button onClick={this.props.onEnterLogin} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg mt-2">Iniciar Sesión</button>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden">
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
              <a href="#contacto" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-xl shadow-blue-600/20">
                Agendar una Cita
              </a>
              <a href="#servicios" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700">
                Ver Servicios
              </a>
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

            <div className="flex flex-wrap justify-center gap-8">
              {/* Card 1: lavado basico */}
              <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] max-w-md group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.25c-3 4.5-6 8.25-6 11.25a6 6 0 1012 0c0-3-3-6.75-6-11.25z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Basico</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio de limpieza exterior del vehículo que incluye enjuague, aplicación de jabón, limpieza de rines y secado. Es ideal para mantener el carro limpio en el día a día de forma rápida y económica.</p>
                <a href="#mantenimiento" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 2: lavado express */}
              <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] max-w-md group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Express</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Lavado exterior rápido enfocado en remover la suciedad superficial en el menor tiempo posible. No incluye detalles profundos, está pensado para personas con poco tiempo.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 3: lavado premium */}
              <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] max-w-md group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.85a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado Premium</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio completo que incluye lavado exterior, aspirado interior, limpieza de vidrios, tablero y detalles generales. Deja el vehículo limpio tanto por dentro como por fuera.</p>
                <a href="#repuestos" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 4: lavado motor */}
              <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] max-w-md group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Lavado De Motor</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Limpieza especializada del motor usando productos adecuados que eliminan grasa y suciedad sin dañar componentes. Ayuda a mejorar el mantenimiento y apariencia del motor.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>

              {/* Card 5: limpieza profunda */}
              <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] max-w-md group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
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
              <p className="text-slate-400 text-lg leading-relaxed mb-6">En MotoExpert brindamos soluciones modernas y confiables para el cuidado, mantenimiento y atención integral de vehículos.Creamos una plataforma digital pensada para facilitar la vida de nuestros clientes, permitiendo agendar servicios de forma rápida, segura y sencilla.Nuestro compromiso es ofrecer calidad, confianza y atención profesional en cada servicio.              </p>
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
                    <span className="font-bold text-white" translate="no">M</span>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">MotoExpert</span>
                </div>
                <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">
                  Llevando la gestión de motocicletas al siguiente nivel con tecnología de punta y servicio humano excepcional.
                </p>
                <div className="flex space-x-4">
                  {/* Facebook */}
                  <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full hover:bg-blue-600 hover:border-blue-600 transition-all text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </a>
                  {/* Instagram */}
                  <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full hover:bg-pink-600 hover:border-pink-600 transition-all text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                  </a>
                  {/* Twitter */}
                  <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full hover:bg-sky-500 hover:border-sky-500 transition-all text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  </a>
                  {/* LinkedIn */}
                  <a href="#" className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-full hover:bg-blue-800 hover:border-blue-800 transition-all text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" /></svg>
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-bold mb-6">Navegación</h4>
                <ul className="space-y-4 text-slate-500 text-sm">
                  <li><a href="#servicios" className="hover:text-white transition-colors">Servicios</a></li>
                  <li><a href="#nosotros" className="hover:text-white transition-colors">Nosotros</a></li>
                  <li><a href="#contacto" className="hover:text-white transition-colors">Contacto</a></li>
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
              <p>© {new Date().getFullYear()} MotoExpert </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

export default LandingPage;
