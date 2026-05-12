import React, { Component } from 'react';
import HeroBackgroundSlider from '../components/HeroBackgroundSlider';

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
      <div className="min-h-screen bg-[#020617] text-[#F8FAFC] font-sans">
        {/* HEADER / NAVBAR */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          this.state.isScrolled ? 'bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'
        }`}>
          <div className="container mx-auto px-6 flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-2xl shadow-[#2563EB]/40 group-hover:scale-110 transition-transform">
                <span className="text-xl font-black text-white italic" translate="no">M</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-[#F8FAFC] italic uppercase">
                Moto<span className="text-[#2563EB]">Expert</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <a href="#inicio" className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">Inicio</a>
              <a href="#servicios" className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">Servicios</a>
              <a href="#nosotros" className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">Nosotros</a>
              <a href="#contacto" className="text-sm font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">Contacto</a>
              
              <div className="flex items-center space-x-4 border-l border-white/10 pl-10 ml-4">
                <button 
                  onClick={this.props.onEnterLogin}
                  className="text-sm font-bold uppercase tracking-widest text-[#F8FAFC] hover:text-[#2563EB] transition-colors"
                >
                  Acceder
                </button>
                <button 
                  onClick={this.props.onEnterRegister}
                  className="px-8 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-2xl shadow-[#2563EB]/20 active:scale-95"
                >
                  Registrarse
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 text-white rounded-xl border border-white/10" onClick={this.toggleMenu}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={this.state.isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Overlay */}
          {this.state.isMenuOpen && (
            <div className="md:hidden fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-2xl p-8 flex flex-col justify-center items-center space-y-8">
              <button className="absolute top-8 right-8 text-white" onClick={this.toggleMenu}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <a href="#inicio" className="text-3xl font-black uppercase italic tracking-tighter text-white" onClick={this.toggleMenu}>Inicio</a>
              <a href="#servicios" className="text-3xl font-black uppercase italic tracking-tighter text-white" onClick={this.toggleMenu}>Servicios</a>
              <a href="#nosotros" className="text-3xl font-black uppercase italic tracking-tighter text-white" onClick={this.toggleMenu}>Nosotros</a>
              <a href="#contacto" className="text-3xl font-black uppercase italic tracking-tighter text-white" onClick={this.toggleMenu}>Contacto</a>
              <button onClick={this.props.onEnterLogin} className="w-full py-5 bg-[#2563EB] text-white font-black uppercase tracking-widest rounded-2xl">Acceder Ahora</button>
            </div>
          )}
        </header>

        {/* HERO SECTION */}
        <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
          <HeroBackgroundSlider />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-block px-6 py-2 mb-8 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] animate-in fade-in zoom-in duration-1000">
              Estándar de Excelencia Automotriz
            </div>
            <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.9] text-[#F8FAFC] italic uppercase tracking-tighter animate-in fade-in slide-in-from-bottom-10 duration-1000">
              Tu vehículo.<br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-blue-400">Siempre impecable.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#94A3B8] mb-12 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
              Agenda servicios, controla mantenimientos y dale a tu vehículo el cuidado premium que merece en el centro de detailing más avanzado.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <button 
                onClick={this.props.onEnterLogin}
                className="group relative w-full sm:w-auto px-12 py-6 bg-[#2563EB] text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl overflow-hidden shadow-2xl shadow-[#2563EB]/40 transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">Agendar Cita</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
              <button 
                className="w-full sm:w-auto px-12 py-6 bg-white/5 hover:bg-white/10 text-[#F8FAFC] font-black text-sm uppercase tracking-[0.2em] rounded-2xl border border-white/10 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
              >
                Ver Servicios
              </button>
            </div>
          </div>
        </section>

        {/* BENEFICIOS SECTION */}
        <section id="beneficios" className="py-32 bg-[#020617] relative overflow-hidden">
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Agenda Inteligente', desc: 'Reserva en segundos desde cualquier dispositivo.', icon: '⚡' },
                { title: 'Historial Digital', desc: 'Control total de cada servicio realizado.', icon: '📊' },
                { title: 'Atención Premium', desc: 'Personal certificado y productos de alta gama.', icon: '💎' }
              ].map((item, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-[#111827] border border-white/5 hover:border-[#2563EB]/30 transition-all duration-500 shadow-2xl">
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-[#F8FAFC] mb-3">{item.title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Fondo sutil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#2563EB]/5 blur-[120px] rounded-full pointer-events-none" />
        </section>
        

        {/* SERVICES SECTION */}
        <section id="servicios" className="py-24 bg-slate-950 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl text-white font-bold mb-4">Servicios Especializados</h2>
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
                <h3 className="text-xl text-white font-bold mb-4">Lavado Basico</h3>
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
                <h3 className="text-xl text-white font-bold mb-4">Lavado Express</h3>
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
                <h3 className="text-xl text-white font-bold mb-4">Lavado Premium</h3>
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
                <h3 className="text-xl text-white font-bold mb-4">Lavado De Motor</h3>
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
                <h3 className="text-xl text-white font-bold mb-4">Limpieza Profunda</h3>
                <p className="text-slate-400 leading-relaxed mb-6">Servicio detallado que incluye limpieza completa del interior y exterior del vehículo, eliminación de manchas, suciedad acumulada y acabados que dejan el carro como nuevo.</p>
                <a href="#diagnostico" className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform">
                  Saber más <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* NOSOTROS SECTION */}
        <section id="nosotros" className="py-32 bg-[#020617] relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                <div className="inline-block px-4 py-1 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-widest">
                  Nuestra Filosofía
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-[#F8FAFC] italic uppercase tracking-tighter leading-none">
                  Pasión por la <br />
                  <span className="text-[#2563EB]">Perfección</span>
                </h2>
                <p className="text-[#94A3B8] text-lg leading-relaxed font-medium">
                  En MotoExpert no solo lavamos vehículos, redefinimos el concepto de cuidado automotriz. 
                  Combinamos tecnología alemana, productos biodegradables de alta gama y un equipo apasionado para que cada detalle cuente.
                </p>
                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div>
                    <div className="text-3xl font-black text-[#F8FAFC] mb-1 italic tracking-tighter uppercase">10+ Años</div>
                    <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Experiencia</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-[#F8FAFC] mb-1 italic tracking-tighter uppercase">15k+</div>
                    <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Servicios</div>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative group animate-in fade-in slide-in-from-right duration-1000">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#2563EB]/20 to-transparent blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <img 
                  src="https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=1200" 
                  alt="Detailing Premium" 
                  className="relative rounded-[2.5rem] shadow-2xl border border-white/5 transition-transform duration-700 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="contacto" className="bg-[#020617] pt-32 pb-16 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
              <div className="md:col-span-5 space-y-8">
                <div className="flex items-center space-x-3 group">
                  <div className="w-12 h-12 bg-[#2563EB] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#2563EB]/40 italic">
                    <span className="text-2xl font-black text-white" translate="no">M</span>
                  </div>
                  <span className="text-3xl font-black tracking-tighter text-[#F8FAFC] italic uppercase">Moto<span className="text-[#2563EB]">Expert</span></span>
                </div>
                <p className="text-[#94A3B8] text-lg max-w-sm leading-relaxed font-medium">
                  El estándar más alto en detailing y gestión automotriz. Tecnología y pasión al servicio de tu vehículo.
                </p>
                <div className="flex space-x-6">
                  {['Instagram', 'Twitter', 'Facebook'].map((social) => (
                    <a key={social} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-[#94A3B8] hover:text-[#2563EB] transition-colors">
                      {social}
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F8FAFC]">Servicios</h4>
                <ul className="space-y-4 text-sm font-medium text-[#94A3B8]">
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Lavado Premium</a></li>
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Detailing Interior</a></li>
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Ceramic Coating</a></li>
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Mantenimiento</a></li>
                </ul>
              </div>

              <div className="md:col-span-2 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F8FAFC]">Compañía</h4>
                <ul className="space-y-4 text-sm font-medium text-[#94A3B8]">
                  <li><a href="#nosotros" className="hover:text-[#F8FAFC] transition-colors">Nosotros</a></li>
                  <li><a href="#inicio" className="hover:text-[#F8FAFC] transition-colors">Historia</a></li>
                  <li><a href="#contacto" className="hover:text-[#F8FAFC] transition-colors">Contacto</a></li>
                </ul>
              </div>

              <div className="md:col-span-3 space-y-8">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#F8FAFC]">Legal</h4>
                <ul className="space-y-4 text-sm font-medium text-[#94A3B8]">
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Privacidad</a></li>
                  <li><a href="#" className="hover:text-[#F8FAFC] transition-colors">Términos</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
              <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} MotoExpert Detailing Studio.
              </p>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#94A3B8]">
                <span>Diseñado para</span>
                <span className="text-[#F8FAFC]">Amantes del motor</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}

export default LandingPage;
