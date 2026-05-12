import React, { Component } from "react";
import { ThemeContext } from '../context/ThemeContext';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      isScrolled: false
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    if (window.scrollY > 20) {
      this.setState({ isScrolled: true });
    } else {
      this.setState({ isScrolled: false });
    }
  };

  toggleMenu = () => {
    this.setState((prevState) => ({ open: !prevState.open }));
  };

  renderMenuItems = (isMobile = false) => {
    const { setView, userRole } = this.props;
    const baseClass = isMobile 
      ? "text-xl font-medium text-slate-900 dark:text-[#F8FAFC] py-4 border-b border-slate-200 dark:border-white/5 text-left hover:text-[#2563EB] transition-colors" 
      : "text-sm font-medium text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors relative group";
    
    const adminClass = isMobile
      ? "text-xl font-bold text-[#2563EB] py-4 border-b border-slate-200 dark:border-white/5 text-left flex items-center space-x-2 hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
      : "text-xs font-bold text-[#2563EB] hover:text-[#2563EB]/80 transition-colors border border-[#2563EB]/30 px-3 py-1 rounded-full bg-[#2563EB]/10 uppercase tracking-widest";

    const employeeClass = isMobile
      ? "text-xl font-bold text-emerald-400 py-4 border-b border-slate-200 dark:border-white/5 text-left flex items-center space-x-2 hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors"
      : "text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-400/30 px-3 py-1 rounded-full bg-emerald-400/10 uppercase tracking-widest";

    const handleClick = (view) => {
      setView(view);
      if (isMobile) this.toggleMenu();
    };

    // Botones base comunes para todos
    const items = [
      <button key="inicio" onClick={() => handleClick("dashboard")} className={baseClass}>
        Inicio
        {!isMobile && <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2563EB] transition-all group-hover:w-full"></span>}
      </button>,
      <button key="servicios" onClick={() => handleClick("servicios")} className={baseClass}>
        Servicios
        {!isMobile && <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2563EB] transition-all group-hover:w-full"></span>}
      </button>
    ];

    // Lógica condicional estricta por Rol
    switch (userRole?.toLowerCase()) {
      case 'admin':
        items.push(
          <button key="admin" onClick={() => handleClick("users")} className={adminClass}>
            {isMobile && <span className="mr-2 text-sm italic opacity-50">#</span>}Admin
          </button>
        );
        break;

      case 'empleado':
        items.push(
          <button key="empleado" onClick={() => handleClick("panel_empleado")} className={employeeClass}>
            {isMobile && <span className="mr-2 text-sm italic opacity-50">#</span>}Staff
          </button>
        );
        break;

      case 'user':
      case 'cliente':
      case 'usuario':
      default:
        // Clientes / Usuarios por defecto ven Vehículos y Citas
        items.push(
          <button key="vehiculos" onClick={() => handleClick("vehiculos")} className={baseClass}>
            Vehículos
            {!isMobile && <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2563EB] transition-all group-hover:w-full"></span>}
          </button>
        );
        items.push(
          <button key="citas" onClick={() => handleClick("citas")} className={baseClass}>
            Citas
            {!isMobile && <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2563EB] transition-all group-hover:w-full"></span>}
          </button>
        );
        break;
    }

    return items;
  };

  render() {
    const { handleLogout, unreadNotifications, resetUnreadNotifications } = this.props;
    const { open, isScrolled } = this.state;
    const { setView } = this.props;
    const userName = localStorage.getItem('userName') || 'Usuario';
    const initial = userName.charAt(0).toUpperCase();

    return (
      <ThemeContext.Consumer>
        {({ isDark, toggleTheme }) => (
          <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isScrolled 
              ? 'bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-3' 
              : 'bg-transparent py-6'
          }`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
              
              {/* Logo */}
              <div 
                className="flex items-center space-x-3 cursor-pointer group" 
                onClick={() => setView("dashboard")}
              >
                <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-2xl shadow-[#2563EB]/40 group-hover:scale-110 transition-transform">
                  <span className="text-xl font-black text-white italic" translate="no">M</span>
                </div>
                <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-[#F8FAFC] italic uppercase">
                  Moto<span className="text-[#2563EB]">Expert</span>
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-10">
                {this.renderMenuItems(false)}

                <div className="flex items-center space-x-6 border-l border-slate-200 dark:border-white/10 pl-10">
                  {/* Theme Toggle Button */}
                  <button 
                    onClick={toggleTheme}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:text-white text-slate-700 hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-xs font-black uppercase tracking-widest"
                  >
                    {isDark ? '☀️ CLARO' : '🌙 OSCURO'}
                  </button>

                  {/* Ícono de Notificaciones */}
                  {['user', 'cliente', 'usuario'].includes(this.props.userRole?.toLowerCase()) && (
                    <div className="relative">
                      <button 
                        onClick={resetUnreadNotifications}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:border-[#2563EB] transition-all shadow-xl group relative"
                        title="Notificaciones"
                      >
                        <svg className="w-5 h-5 text-slate-500 dark:text-[#94A3B8] group-hover:text-[#2563EB] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg animate-pulse">
                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                          </span>
                        )}
                      </button>

                      {/* Panel dropdown */}
                      {this.props.showNotifPanel && (
                        <div className="absolute right-0 top-14 w-80 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-[#F8FAFC] uppercase tracking-widest">Notificaciones</span>
                            <span className="text-xs text-slate-500 dark:text-[#94A3B8]">{(this.props.notifications || []).length} total</span>
                          </div>
                          <div className="max-h-72 overflow-y-auto">
                            {(this.props.notifications || []).length === 0 ? (
                              <div className="px-4 py-6 text-center text-slate-500 dark:text-[#94A3B8] text-sm">
                                Sin notificaciones
                              </div>
                            ) : (
                              (this.props.notifications || []).map(n => (
                                <div key={n.id} className={`px-4 py-3 border-b border-slate-200 dark:border-white/5 flex items-start space-x-3 ${!n.read ? 'bg-[#2563EB]/5' : ''}`}>
                                  <span className="text-lg mt-0.5">{n.type === 'success' ? '✅' : '🔧'}</span>
                                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Ícono de Perfil */}
                  <button 
                    onClick={() => setView("cuenta")} 
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:border-[#2563EB] transition-all shadow-xl group overflow-hidden"
                    title="Mi Cuenta"
                  >
                    <div className="text-[#2563EB] font-black text-sm group-hover:scale-110 transition-transform italic">
                      {initial}
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-[#F8FAFC] text-xs font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-white/10 transition-all active:scale-95"
                  >
                    Salir
                  </button>
                </div>
              </nav>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl"
                onClick={this.toggleMenu}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Overlay & Sidebar */}
            {open && (
              <div className="fixed inset-0 z-[9999] md:hidden">
                <div 
                  className="absolute inset-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md"
                  onClick={this.toggleMenu}
                ></div>
                
                <div className="absolute top-0 right-0 w-[80%] h-full bg-white dark:bg-[#020617] border-l border-slate-200 dark:border-white/5 p-8 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
                  <div className="flex items-center space-x-4 pb-8 border-b border-slate-200 dark:border-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-[#2563EB] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-[#2563EB]/40 italic">
                      {initial}
                    </div>
                    <div>
                      <p className="text-slate-900 dark:text-[#F8FAFC] font-black italic uppercase tracking-tighter text-lg leading-none">{userName}</p>
                      <button 
                        onClick={() => { setView("cuenta"); this.toggleMenu(); }}
                        className="text-xs text-[#2563EB] font-bold uppercase tracking-widest mt-2"
                      >
                        Perfil →
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 pt-4">
                    {this.renderMenuItems(true)}
                  </div>

                  <button
                    onClick={() => { handleLogout(); this.toggleMenu(); }}
                    className="w-full py-5 bg-slate-100 dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] font-black uppercase tracking-widest rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl active:scale-95 transition-all mt-auto"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </header>
        )}
      </ThemeContext.Consumer>
    );
  }
}

export default Navbar;
