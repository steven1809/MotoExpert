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
        { key: "dashboard", label: "Inicio", view: "dashboard", icon: "grid" },
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
  };

  renderNavItem = (item) => {
    const { setView, view } = this.props;
    const isActive = view === item.view || (item.view === "dashboard" && view === "dashboard");

    return (
      <button
        key={item.key}
        onClick={() => {
          setView(item.view);
          if (this.state.open) this.toggleMenu();
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.1em] border-l-2 transition-colors ${
          isActive
            ? "bg-[#1a1a2e] border-[#7b9cff] text-white"
            : "bg-transparent border-transparent text-slate-300 hover:bg-[#1a1a2e]/60 hover:border-[#7b9cff]/60 hover:text-white"
        }`}
      >
        <span className="text-[#7b9cff]">{this.renderIcon(item.icon)}</span>
        <span>{item.label}</span>
      </button>
    );
  };

  render() {
    const { handleLogout } = this.props;
    const { open } = this.state;
    const { setView, userRole } = this.props;
    const userName = localStorage.getItem('userName') || 'Usuario';
    const userRank = (userRole || "user").toUpperCase();
    const initial = userName.charAt(0).toUpperCase();
    const items = this.getMenuConfig();

    return (
      <>
        <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-[#0a0a0d] border-r border-white/[0.08] flex-col">
          <div className="px-6 pt-6 pb-5 border-b border-white/[0.08]">
            <button onClick={() => setView("dashboard")} className="text-left w-full">
              <div className="text-white font-sans text-xl">MOTOEXPERT</div>
              <div className="text-slate-500 text-[11px] font-mono tracking-[0.12em] uppercase">v-1.0</div>
            </button>
          </div>

          <nav className="px-3 py-4 flex-1 space-y-1">
            {items.map(this.renderNavItem)}
          </nav>

          <div className="px-4 pb-6 space-y-4 border-t border-white/[0.08]">
            <div className="pt-5">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#3ddc84]/30 bg-[#0a0a0d]">
                <span className="w-2 h-2 rounded-full bg-[#3ddc84]" />
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#3ddc84]">
                  System Secure / Encryption Active
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setView("cuenta")}
                className="flex items-center gap-3 text-left flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a0a0d] border border-white/[0.08] flex items-center justify-center text-white font-mono text-sm">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{userName}</div>
                  <div className="text-slate-500 text-[11px] font-mono uppercase tracking-[0.12em] truncate">
                    {userRank}
                  </div>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl border border-[#ff4d4d]/40 text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors font-mono text-[11px] uppercase tracking-[0.12em]"
              >
                Cerrar Sesion
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }
}

export default Navbar;
