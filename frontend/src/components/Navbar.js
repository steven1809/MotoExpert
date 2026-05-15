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

  getMenuConfig = () => {
    const role = (this.props.userRole || "").toLowerCase();

    if (role === "admin") {
      return [
        { key: "dashboard", label: "Dashboard", view: "dashboard", icon: "grid" },
        { key: "servicios", label: "Servicios", view: "servicios", icon: "spark" },
        { key: "users", label: "Usuarios", view: "users", icon: "users" },
        { key: "cuenta", label: "Cuenta", view: "cuenta", icon: "user" },
      ];
    }

    if (role === "empleado" || role === "trabajador") {
      return [
        { key: "dashboard", label: "Dashboard", view: "dashboard", icon: "grid" },
        { key: "panel_empleado", label: "Panel", view: "panel_empleado", icon: "shield" },
        { key: "servicios", label: "Servicios", view: "servicios", icon: "spark" },
        { key: "cuenta", label: "Cuenta", view: "cuenta", icon: "user" },
      ];
    }

    return [
      { key: "dashboard", label: "Dashboard", view: "dashboard", icon: "grid" },
      { key: "servicios", label: "Servicios", view: "servicios", icon: "spark" },
      { key: "vehiculos", label: "Vehículos", view: "vehiculos", icon: "car" },
      { key: "citas", label: "Citas", view: "citas", icon: "clock" },
      { key: "cuenta", label: "Cuenta", view: "cuenta", icon: "user" },
    ];
  };

  renderIcon = (name) => {
    const common = "w-5 h-5";
    switch (name) {
      case "grid":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z" />
          </svg>
        );
      case "users":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "car":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 16l1-5a4 4 0 0 1 4-3h4a4 4 0 0 1 4 3l1 5" />
            <path d="M3 16h18" />
            <path d="M7 16v3" />
            <path d="M17 16v3" />
            <path d="M6 11h12" />
          </svg>
        );
      case "clock":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v5l3 2" />
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
        );
      case "shield":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case "spark":
      default:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
          </svg>
        );
      case "user":
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
        );
    }
  }
  
  renderNavItem = (item, isHorizontal = false) => {
    const { setView, view } = this.props;
    const isActive = view === item.view || (item.view === "dashboard" && view === "dashboard");

    return (
      <button
        key={item.key}
        onClick={() => {
          setView(item.view);
          if (this.state.open) this.toggleMenu();
        }}
        className={`relative group flex items-center transition-all duration-300 ${
          isHorizontal 
            ? "h-full px-5 gap-2.5" 
            : "w-full gap-3 px-4 py-3.5 text-left border-l-2"
        } ${
          isActive
            ? isHorizontal 
              ? "text-white" 
              : "bg-white/[0.03] border-[#7b9cff] text-white"
            : isHorizontal
              ? "text-slate-400 hover:text-white"
              : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white"
        }`}
      >
        <span className={`transition-transform duration-300 group-hover:scale-110 ${
          isActive ? "text-[#7b9cff]" : "text-slate-500 group-hover:text-[#7b9cff]"
        }`}>
          {this.renderIcon(item.icon)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] font-medium">
          {item.label}
        </span>
        
        {/* Underline effect for horizontal */}
        {isHorizontal && (
          <div className={`absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-300 ${
            isActive ? "bg-[#7b9cff] shadow-[0_0_8px_rgba(123,156,255,0.5)]" : "bg-transparent group-hover:bg-white/10"
          }`} />
        )}
      </button>
    );
  };

  render() {
    const { handleLogout, setView, userRole } = this.props;
    const { open } = this.state;
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userPicture = localStorage.getItem('userPicture');
    const role = (userRole || "user").toLowerCase();
    const isStandardUser = role === "user" || role === "cliente" || role === "usuario";
    const userRank = (userRole || "user").toUpperCase();
    const initial = userName.charAt(0).toUpperCase();
    const items = this.getMenuConfig();

    return (
      <>
        {/* Sidebar for Admin/Employee */}
        {!isStandardUser && (
          <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-[#050507] border-r border-white/[0.05] flex-col z-[60]">
            <div className="px-8 pt-8 pb-6">
              <button onClick={() => setView("dashboard")} className="group text-left w-full">
                <div className="text-white font-black text-2xl tracking-tighter transition-colors group-hover:text-[#7b9cff]">
                  MOTO<span className="text-[#7b9cff]">EXPERT</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-[1px] w-4 bg-[#7b9cff]/50" />
                  <div className="text-slate-500 text-[9px] font-mono tracking-[0.2em] uppercase">Control Panel</div>
                </div>
              </button>
            </div>

            <nav className="px-4 py-6 flex-1 space-y-1">
              {items.map(item => this.renderNavItem(item))}
            </nav>

            <div className="px-6 pb-8 space-y-6">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#3ddc84] animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400">System Status</span>
                </div>
                <div className="text-[10px] text-[#3ddc84] font-mono leading-relaxed">
                  CORE: SECURE<br/>
                  ENCRYPT: ACTIVE
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                <button
                  onClick={() => setView("cuenta")}
                  className="flex items-center gap-3 group min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#7b9cff]/10 border border-[#7b9cff]/20 flex items-center justify-center text-[#7b9cff] font-mono text-sm transition-all group-hover:bg-[#7b9cff]/20 overflow-hidden">
                    {userPicture ? (
                      <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold text-sm truncate group-hover:text-[#7b9cff] transition-colors">{userName}</div>
                    <div className="text-slate-500 text-[9px] font-mono uppercase tracking-[0.15em]">{userRank}</div>
                  </div>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl border border-white/[0.05] text-slate-400 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/5 transition-all"
                  title="Salir"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Top Navbar for Standard User (Desktop) */}
        {isStandardUser && (
          <header className="hidden md:flex fixed top-0 left-0 right-0 h-20 bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.05] z-[60] items-center justify-between px-10">
            <button onClick={() => setView("dashboard")} className="group text-left">
              <div className="text-white font-black text-2xl tracking-tighter transition-colors group-hover:text-[#7b9cff]">
                MOTO<span className="text-[#7b9cff]">EXPERT</span>
              </div>
              <div className="text-slate-500 text-[9px] font-mono uppercase tracking-[0.2em] mt-0.5">Automotive Core</div>
            </button>

            <nav className="flex h-full items-center">
              {items.map(item => this.renderNavItem(item, true))}
            </nav>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setView("cuenta")}
                className="flex items-center gap-3 group pl-4 border-l border-white/[0.05]"
              >
                <div className="text-right hidden lg:block">
                  <div className="text-white font-bold text-sm group-hover:text-[#7b9cff] transition-colors">{userName}</div>
                  <div className="text-slate-500 text-[9px] font-mono uppercase tracking-[0.15em]">{userRank}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#7b9cff]/10 border border-[#7b9cff]/20 flex items-center justify-center text-[#7b9cff] font-mono text-sm transition-all group-hover:bg-[#7b9cff]/20 group-hover:scale-105 overflow-hidden">
                  {userPicture ? (
                    <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-[#ff4d4d]/10 hover:border-[#ff4d4d]/20 transition-all font-mono text-[9px] uppercase tracking-[0.15em]"
              >
                <span>Logout</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-[#050507]/90 backdrop-blur-lg border-b border-white/[0.05]">
          <div className="h-18 px-5 flex items-center justify-between py-4">
            <button onClick={() => setView("dashboard")} className="text-left">
              <div className="text-white font-black text-xl tracking-tighter">
                MOTO<span className="text-[#7b9cff]">EXPERT</span>
              </div>
              <div className="text-slate-500 text-[9px] font-mono uppercase tracking-[0.2em]">v-0.98.4</div>
            </button>
            <button
              onClick={this.toggleMenu}
              className={`w-12 h-12 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
                open ? "bg-[#7b9cff] border-[#7b9cff] text-white shadow-[0_0_15px_rgba(123,156,255,0.4)]" : "bg-white/[0.02] border-white/[0.05] text-white"
              }`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {open && (
          <div className="fixed inset-0 z-[100] md:hidden overflow-hidden">
            <div className="absolute inset-0 bg-[#050507]/95 backdrop-blur-sm" onClick={this.toggleMenu} />
            <div className="absolute top-0 right-0 w-[85%] max-w-sm h-full bg-[#050507] border-l border-white/[0.05] flex flex-col animate-in slide-in-from-right duration-300">
              <div className="px-8 pt-10 pb-8 border-b border-white/[0.05]">
                <div className="text-white font-black text-2xl tracking-tighter">
                  MOTO<span className="text-[#7b9cff]">EXPERT</span>
                </div>
                <div className="text-slate-500 text-[10px] font-mono tracking-[0.2em] uppercase mt-1">Mobile Access</div>
              </div>
              
              <nav className="px-4 py-8 flex-1 space-y-2 overflow-y-auto">
                {items.map(item => this.renderNavItem(item))}
              </nav>

              <div className="p-8 space-y-6 border-t border-white/[0.05] bg-white/[0.01]">
                  <button
                    onClick={() => {
                      setView("cuenta");
                      this.toggleMenu();
                    }}
                    className="flex items-center gap-4 group w-full"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#7b9cff]/10 border border-[#7b9cff]/20 flex items-center justify-center text-[#7b9cff] font-mono text-lg overflow-hidden">
                      {userPicture ? (
                        <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold text-base group-hover:text-[#7b9cff] transition-colors">{userName}</div>
                      <div className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.15em]">{userRank}</div>
                    </div>
                  </button>
                
                <button
                  onClick={() => {
                    handleLogout();
                    this.toggleMenu();
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#ff4d4d]/10 border border-[#ff4d4d]/20 text-[#ff4d4d] font-mono text-xs uppercase tracking-[0.2em] hover:bg-[#ff4d4d]/20 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default Navbar;
