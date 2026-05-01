import React, { Component } from "react";

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  toggleMenu = () => {
    this.setState((prevState) => ({ open: !prevState.open }));
  };

  renderMenuItems = (isMobile = false) => {
    const { setView, userRole } = this.props;
    const baseClass = isMobile 
      ? "text-xl font-medium text-white py-3 border-b border-slate-800 text-left hover:text-blue-400 transition-colors" 
      : "text-sm font-medium text-slate-400 hover:text-blue-500 transition-colors";
    
    const adminClass = isMobile
      ? "text-xl font-bold text-blue-400 py-3 border-b border-slate-800 text-left flex items-center space-x-2 hover:text-white transition-colors"
      : "text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/30 px-3 py-1 rounded-md bg-blue-400/10";

    const employeeClass = isMobile
      ? "text-xl font-bold text-green-400 py-3 border-b border-slate-800 text-left flex items-center space-x-2 hover:text-white transition-colors"
      : "text-sm font-medium text-green-400 hover:text-green-300 transition-colors border border-green-400/30 px-3 py-1 rounded-md bg-green-400/10";

    const handleClick = (view) => {
      setView(view);
      if (isMobile) this.toggleMenu();
    };

    // Botones base comunes para todos
    const items = [
      <button key="inicio" onClick={() => handleClick("dashboard")} className={baseClass}>Inicio</button>,
      <button key="servicios" onClick={() => handleClick("servicios")} className={baseClass}>Servicios</button>
    ];

    // Lógica condicional estricta por Rol
    switch (userRole?.toLowerCase()) {
      case 'admin':
        items.push(
          <button key="admin" onClick={() => handleClick("users")} className={adminClass}>
            {isMobile && <span className="mr-2">👥</span>}Administración
          </button>
        );
        break;

      case 'empleado':
        items.push(
          <button key="empleado" onClick={() => handleClick("panel_empleado")} className={employeeClass}>
            {isMobile && <span className="mr-2">🛠️</span>}Panel de Trabajo
          </button>
        );
        break;

      case 'user':
      case 'cliente':
      case 'usuario':
      default:
        // Clientes / Usuarios por defecto ven Vehículos y Citas
        items.push(
          <button key="vehiculos" onClick={() => handleClick("vehiculos")} className={baseClass}>Vehículos</button>
        );
        items.push(
          <button key="citas" onClick={() => handleClick("citas")} className={baseClass}>Citas</button>
        );
        break;
    }

    return items;
  };

  render() {
    const { handleLogout } = this.props;
    const { open } = this.state;
    const { setView } = this.props; // Necesario para el logo y perfil
    const userName = localStorage.getItem('userName') || 'Usuario';
    const initial = userName.charAt(0).toUpperCase();

    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
          
          {/* Espaciador invisible para mantener flex-between en móvil */}
          <div className="md:hidden w-10"></div>

          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer absolute left-1/2 transform -translate-x-1/2 md:relative md:transform-none md:left-auto" 
            onClick={() => setView("dashboard")}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-xl font-bold text-white" translate="no">M</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              MotoExpert
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            {this.renderMenuItems(false)}

            {/* Ícono de Perfil */}
            <button 
              onClick={() => setView("cuenta")} 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-500 transition-all shadow-lg group overflow-hidden"
              title="Mi Cuenta"
            >
              <div className="text-blue-400 font-bold text-sm group-hover:text-blue-300 transition-colors">
                {initial}
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95"
            >
              Cerrar Sesión
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all border border-slate-700 shadow-lg"
            onClick={this.toggleMenu}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Menu Overlay & Sidebar */}
        {open && (
          <div className="fixed inset-0 z-[9999] md:hidden">
            {/* Fondo con desenfoque (Backdrop blur) */}
            <div 
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={this.toggleMenu}
            ></div>
            
            {/* Sidebar */}
            <div className="absolute top-0 right-0 w-[75%] h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col space-y-6 shadow-2xl transform transition-transform duration-300">
              <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
                  {initial}
                </div>
                <div>
                  <p className="text-white font-bold">{userName}</p>
                  <button 
                    onClick={() => { setView("cuenta"); this.toggleMenu(); }}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-2 flex-1">
                {this.renderMenuItems(true)}
              </div>

              <button
                onClick={() => { handleLogout(); this.toggleMenu(); }}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 mt-auto"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }
}

export default Navbar;
