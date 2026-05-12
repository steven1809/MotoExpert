import React, { Component } from "react";

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      isScrolled: false,
      themeSpin: false
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    this.setState({ isScrolled: window.scrollY > 10 });
  };

  toggleMenu = () => {
    this.setState((prevState) => ({ open: !prevState.open }));
  };

  getNavItems = () => {
    const role = (this.props.userRole || '').toLowerCase();

    const base = [
      { key: 'dashboard', label: 'Inicio', view: 'dashboard', icon: 'home' },
      { key: 'servicios', label: 'Servicios', view: 'servicios', icon: 'grid' },
    ];

    if (role === 'admin') {
      base.push({ key: 'users', label: 'Usuarios', view: 'users', icon: 'users' });
      base.push({ key: 'vehiculos', label: 'Vehículos', view: 'vehiculos', icon: 'car' });
      base.push({ key: 'citas', label: 'Citas', view: 'citas', icon: 'calendar' });
      return base;
    }

    if (role === 'empleado' || role === 'trabajador') {
      base.push({ key: 'panel_empleado', label: 'Panel', view: 'panel_empleado', icon: 'wrench' });
      base.push({ key: 'citas', label: 'Citas', view: 'citas', icon: 'calendar' });
      return base;
    }

    base.push({ key: 'vehiculos', label: 'Vehículos', view: 'vehiculos', icon: 'car' });
    base.push({ key: 'citas', label: 'Citas', view: 'citas', icon: 'calendar' });
    return base;
  };

  renderIcon = (name, active = false) => {
    const stroke = active ? '#FFFFFF' : 'var(--mx-text)';
    const props = { className: "w-5 h-5", fill: "none", stroke, viewBox: "0 0 24 24" };

    switch (name) {
      case 'home':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10.5L12 3l9 7.5V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V10.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 21V12h6v9" />
          </svg>
        );
      case 'grid':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
          </svg>
        );
      case 'users':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 8a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 20v-2a4 4 0 00-3-3.87" />
          </svg>
        );
      case 'car':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 13l2-5a2 2 0 011.9-1.3h10.2A2 2 0 0119 8l2 5" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13h14v6a1 1 0 01-1 1h-1a2 2 0 01-2-2H9a2 2 0 01-2 2H6a1 1 0 01-1-1v-6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.5 10h9" />
          </svg>
        );
      case 'calendar':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3v3M16 3v3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7v13a2 2 0 002 2h10a2 2 0 002-2V7" />
          </svg>
        );
      case 'wrench':
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.7 6.3a4 4 0 00-5.6 5.6l-5.1 5.1a2 2 0 102.8 2.8l5.1-5.1a4 4 0 005.6-5.6l-3 3-2-2 3-3z" />
          </svg>
        );
      default:
        return (
          <svg {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16" />
          </svg>
        );
    }
  };

  renderNavButtons = (isMobile = false) => {
    const { setView, view: activeView } = this.props;
    const items = this.getNavItems();

    const base =
      "w-full flex items-center gap-3 px-4 py-3 text-left mx-subtitle text-[12px] tracking-[0.22em] uppercase transition-all duration-200 ease-out";

    return items.map((it) => {
      const active = activeView === it.view;
      const cls = active
        ? `${base} bg-[var(--mx-blue)] text-white`
        : `${base} bg-transparent text-[var(--mx-text)] hover:bg-[var(--mx-blue)] hover:text-white`;

      return (
        <button
          key={it.key}
          onClick={() => {
            setView(it.view);
            if (isMobile) this.toggleMenu();
          }}
          className={cls}
        >
          {this.renderIcon(it.icon, active)}
          <span className="flex-1">{it.label}</span>
          {active && <span className="w-[2px] h-6 bg-white" />}
        </button>
      );
    });
  };

  render() {
    const { handleLogout, unreadNotifications, resetUnreadNotifications } = this.props;
    const { open, isScrolled, themeSpin } = this.state;
    const userName = localStorage.getItem('userName') || 'Usuario';
    const initial = userName.charAt(0).toUpperCase();
    const role = (this.props.userRole || '').toLowerCase();
    const showBell = ['user', 'cliente', 'usuario'].includes(role);
    const theme = this.props.theme || 'light';
    const themeIcon = theme === 'dark' ? '☀️' : '🌙';

    return (
      <>
        <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[280px] bg-[var(--mx-bg)] border-r-[2px] border-r-[var(--mx-blue)] z-50 flex-col">
          <div className="h-[76px] px-8 flex items-center border-b border-b-[var(--mx-border)]">
            <button onClick={() => this.props.setView("dashboard")} className="mx-subtitle text-[16px] tracking-[0.22em] uppercase text-[var(--mx-text)]" translate="no">
              MOTO<span className="text-[var(--mx-blue)]">EXPERT</span>
            </button>
          </div>

          <div className="px-4 py-6 flex-1 flex flex-col gap-2">
            {this.renderNavButtons(false)}
          </div>

          <div className="px-8 py-6 border-t border-t-[var(--mx-border)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => this.props.setView("cuenta")}
                className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center mx-subtitle text-[12px] tracking-[0.12em] uppercase text-[var(--mx-text)]"
                title="Mi Cuenta"
              >
                {initial}
              </button>
              <div className="min-w-0">
                <div className="mx-subtitle text-[12px] tracking-[0.14em] uppercase text-[var(--mx-text)] truncate">{userName}</div>
                <div className="text-[11px] text-[var(--mx-text-2)] tracking-[0.14em] uppercase truncate">{role || 'usuario'}</div>
              </div>
            </div>

            <button onClick={handleLogout} className="mt-5 w-full mx-btn mx-btn-outline py-3 text-[11px]">
              Salir
            </button>
          </div>
        </aside>

        <header
          className={`fixed top-0 left-0 right-0 md:left-[280px] h-[76px] bg-[var(--mx-bg)] border-b border-b-[var(--mx-border)] z-40 transition-shadow duration-300 ${
            isScrolled ? 'shadow-[0_10px_30px_rgba(5,1,15,0.06)]' : ''
          }`}
        >
          <div className="h-full px-5 md:px-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 md:hidden">
              <button
                className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center"
                onClick={this.toggleMenu}
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>

              <button onClick={() => this.props.setView("dashboard")} className="mx-subtitle text-[14px] tracking-[0.22em] uppercase text-[var(--mx-text)]" translate="no">
                MOTO<span className="text-[var(--mx-blue)]">EXPERT</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)] truncate">
                  Buenos días, {userName}
                </div>
                <div className="text-[11px] tracking-[0.18em] uppercase text-[var(--mx-text-2)] truncate">
                  Panel editorial
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-[520px] hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="BUSCAR"
                  className="w-full px-4 py-3 border border-[var(--mx-border)] rounded-[8px] bg-[var(--mx-bg)] text-[12px] tracking-[0.22em] uppercase outline-none focus:border-[var(--mx-blue)]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mx-text-2)]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  this.setState({ themeSpin: true });
                  this.props.onToggleTheme && this.props.onToggleTheme();
                  window.setTimeout(() => this.setState({ themeSpin: false }), 420);
                }}
                className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center hover:border-[var(--mx-blue)] transition-colors"
                style={{ transform: themeSpin ? 'rotate(360deg)' : 'rotate(0deg)', transition: 'transform 400ms ease' }}
                title="Tema"
                aria-label="Cambiar tema"
              >
                <span className="text-[16px] leading-none">{themeIcon}</span>
              </button>

              {showBell && (
                <div className="relative">
                  <button
                    onClick={resetUnreadNotifications}
                    className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center hover:border-[var(--mx-blue)] transition-colors relative"
                    title="Notificaciones"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-[var(--mx-blue)] text-white text-[10px] mx-subtitle rounded-[8px] flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {this.props.showNotifPanel && (
                    <div className="absolute right-0 top-12 w-80 bg-[var(--mx-bg)] border border-[var(--mx-border)] rounded-[8px] shadow-[0_18px_40px_rgba(5,1,15,0.10)] overflow-hidden">
                      <div className="px-4 py-3 border-b border-b-[var(--mx-border)] flex items-center justify-between">
                        <span className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">Notificaciones</span>
                        <span className="text-[11px] tracking-[0.14em] uppercase text-[var(--mx-text-2)]">{(this.props.notifications || []).length}</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {(this.props.notifications || []).length === 0 ? (
                          <div className="px-4 py-6 text-center text-[var(--mx-text-2)] text-[12px]">
                            Sin notificaciones
                          </div>
                        ) : (
                          (this.props.notifications || []).map(n => (
                            <div key={n.id} className={`px-4 py-3 border-b border-b-[var(--mx-border)] flex items-start gap-3 ${!n.read ? 'bg-[var(--mx-bg-2)]' : ''}`}>
                              <span className="text-[12px] mt-[2px] text-[var(--mx-blue)] mx-subtitle">{n.type === 'success' ? 'OK' : 'UPD'}</span>
                              <p className="text-[12px] text-[var(--mx-text-2)] leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => this.props.setView("cuenta")}
                className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center mx-subtitle text-[12px] tracking-[0.12em] uppercase hover:border-[var(--mx-blue)] transition-colors"
                title="Mi Cuenta"
              >
                {initial}
              </button>
            </div>
          </div>
        </header>

        {open && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/30" onClick={this.toggleMenu} />
            <div className="absolute top-0 left-0 h-full w-[82%] bg-[var(--mx-bg)] border-r border-r-[var(--mx-border)]">
              <div className="h-[76px] px-6 flex items-center justify-between border-b border-b-[var(--mx-border)]">
                <div className="mx-subtitle text-[14px] tracking-[0.22em] uppercase" translate="no">
                  MOTO<span className="text-[var(--mx-blue)]">EXPERT</span>
                </div>
                <button
                  className="w-10 h-10 rounded-[8px] border border-[var(--mx-border)] flex items-center justify-center"
                  onClick={this.toggleMenu}
                  aria-label="Cerrar menú"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-4 py-6 flex flex-col gap-2">
                {this.renderNavButtons(true)}
              </div>

              <div className="px-6 py-6 border-t border-t-[var(--mx-border)]">
                <button onClick={handleLogout} className="w-full mx-btn mx-btn-outline py-3 text-[11px]">
                  Salir
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

