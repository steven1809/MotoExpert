import React, { Component } from 'react';

const MOTOEXPERT_PLACEHOLDER_IMG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1000" viewBox="0 0 1400 1000">
    <rect width="1400" height="1000" fill="#0A0F1E"/>
    <path d="M940 0h460v640z" fill="#0047FF"/>
    <path d="M0 790h1400" stroke="#0047FF" stroke-width="2" opacity="0.75"/>
    <g opacity="0.35">
      <path d="M90 130h520" stroke="#4D8AFF" stroke-width="2"/>
      <path d="M90 170h420" stroke="#4D8AFF" stroke-width="2"/>
      <path d="M90 210h480" stroke="#4D8AFF" stroke-width="2"/>
    </g>
    <text x="90" y="520" font-family="Bebas Neue, sans-serif" font-size="160" fill="#F9FAFB">MOTO</text>
    <text x="340" y="520" font-family="Bebas Neue, sans-serif" font-size="160" fill="#0047FF">EXPERT</text>
    <text x="92" y="600" font-family="Outfit, sans-serif" font-size="28" fill="#9CA3AF" letter-spacing="6">EDITORIAL GARAGE</text>
  </svg>`
)}`;

class LandingPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      isScrolled: false,
      themeSpin: false,
    };
    this.revealObserver = null;
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    this.handleScroll();
    this.setupReveal();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    if (this.revealObserver) this.revealObserver.disconnect();
  }

  handleScroll = () => {
    const isScrolled = window.scrollY > 16;
    if (isScrolled !== this.state.isScrolled) this.setState({ isScrolled });
  };

  setupReveal = () => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (nodes.length === 0) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      nodes.forEach((n) => n.classList.add('mx-reveal--in'));
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('mx-reveal--in');
          this.revealObserver?.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );

    nodes.forEach((n) => this.revealObserver.observe(n));
  };

  toggleMenu = () => {
    this.setState((prevState) => ({
      isMenuOpen: !prevState.isMenuOpen,
    }));
  };

  render() {
    const { isMenuOpen, isScrolled, themeSpin } = this.state;
    const theme = this.props.theme || 'light';
    const themeIcon = theme === 'dark' ? '☀️' : '🌙';
    return (
      <div className="min-h-screen bg-[var(--mx-bg)] text-[var(--mx-text)]">
        <header
          className={`fixed top-0 left-0 right-0 z-50 bg-[var(--mx-bg)] border-b-[2px] border-b-[var(--mx-blue)] transition-all duration-300 ${
            isScrolled ? 'shadow-[0_10px_30px_rgba(5,1,15,0.06)]' : ''
          }`}
        >
          <div className="mx-container h-20 flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-baseline gap-2"
            >
              <span className="mx-subtitle text-[18px] tracking-[0.22em] text-[var(--mx-text)]" translate="no">
                MOTO<span className="text-[var(--mx-blue)]">EXPERT</span>
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="mx-link-underline mx-subtitle text-[12px] tracking-[0.22em] text-[var(--mx-text)] uppercase">Inicio</a>
              <a href="#servicios" className="mx-link-underline mx-subtitle text-[12px] tracking-[0.22em] text-[var(--mx-text)] uppercase">Servicios</a>
              <a href="#nosotros" className="mx-link-underline mx-subtitle text-[12px] tracking-[0.22em] text-[var(--mx-text)] uppercase">Nosotros</a>
              <a href="#contacto" className="mx-link-underline mx-subtitle text-[12px] tracking-[0.22em] text-[var(--mx-text)] uppercase">Contacto</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
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
              <button onClick={this.props.onEnterLogin} className="mx-btn mx-btn-outline px-5 py-2 text-[11px]">
                Acceder
              </button>
              <button onClick={this.props.onEnterRegister} className="mx-btn mx-btn-primary px-5 py-2 text-[11px]">
                Registrarse
              </button>
            </div>

            <button
              className="md:hidden w-10 h-10 border border-[var(--mx-border)] rounded-[8px] flex items-center justify-center"
              onClick={this.toggleMenu}
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden border-t border-[var(--mx-border)] bg-[var(--mx-bg)]">
              <div className="mx-container py-6 flex flex-col gap-4">
                <a href="#inicio" className="mx-subtitle text-[12px] tracking-[0.22em] uppercase" onClick={this.toggleMenu}>Inicio</a>
                <a href="#servicios" className="mx-subtitle text-[12px] tracking-[0.22em] uppercase" onClick={this.toggleMenu}>Servicios</a>
                <a href="#nosotros" className="mx-subtitle text-[12px] tracking-[0.22em] uppercase" onClick={this.toggleMenu}>Nosotros</a>
                <a href="#contacto" className="mx-subtitle text-[12px] tracking-[0.22em] uppercase" onClick={this.toggleMenu}>Contacto</a>
                <div className="pt-4 flex gap-3">
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
                  <button onClick={this.props.onEnterLogin} className="mx-btn mx-btn-outline px-5 py-3 text-[11px] flex-1">
                    Acceder
                  </button>
                  <button onClick={this.props.onEnterRegister} className="mx-btn mx-btn-primary px-5 py-3 text-[11px] flex-1">
                    Registrarse
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="pt-20">
          <section id="inicio" className="mx-diagonal-cut bg-[var(--mx-bg)]">
            <div className="mx-container py-[120px] grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 relative">
                <div
                  className="absolute -top-10 -left-2 text-[140px] lg:text-[180px] leading-none mx-h1 text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none"
                  aria-hidden="true"
                >
                  01
                </div>

                <div data-reveal className="mx-reveal" style={{ transitionDelay: '0ms' }}>
                  <h1 className="mx-h1 text-[64px] sm:text-[76px] lg:text-[92px]">
                    <span className="text-[var(--mx-text)]">TU VEHÍCULO.</span>
                    <br />
                    <span className="text-[var(--mx-blue)]">SIEMPRE IMPECABLE.</span>
                  </h1>
                </div>

                <p data-reveal className="mx-reveal mt-6 text-[15px] sm:text-[16px] text-[var(--mx-text-2)] max-w-[52ch]" style={{ transitionDelay: '140ms' }}>
                  Control editorial del cuidado: agenda, seguimiento y resultado. Un sistema limpio, rápido y obsesionado con el detalle.
                </p>

                <div data-reveal className="mx-reveal mt-10 flex flex-col sm:flex-row gap-4 items-start" style={{ transitionDelay: '260ms' }}>
                  <button onClick={this.props.onEnterLogin} className="mx-btn mx-btn-primary px-7 py-4 text-[11px]">
                    Agendar ahora
                  </button>
                  <a href="#servicios" className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)] inline-flex items-center gap-2 group">
                    Ver servicios
                    <span className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div data-reveal className="mx-reveal" style={{ transitionDelay: '120ms' }}>
                  <div className="relative">
                    <div className="w-full aspect-[4/5] bg-[var(--mx-blue)] rounded-[8px] transform rotate-[3deg]" />
                    <div className="absolute inset-0 transform rotate-[-2deg] translate-x-3 -translate-y-3">
                      <div className="w-full h-full rounded-[8px] border border-[rgba(255,255,255,0.35)] bg-[var(--mx-bg)] overflow-hidden">
                        <div className="h-full w-full bg-[var(--mx-bg-2)] flex items-center justify-center">
                          <div className="w-[78%] h-[78%] border border-[var(--mx-border)] rounded-[8px] relative">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_14px,rgba(0,71,255,0.08)_15px),linear-gradient(to_bottom,transparent_0,transparent_14px,rgba(0,71,255,0.08)_15px)] bg-[size:15px_15px]" />
                            <div className="absolute left-5 bottom-5 mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text)]">
                              Placeholder imagen
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[var(--mx-blue)]">
            <div className="mx-container py-10">
              <div className="grid grid-cols-1 md:grid-cols-3">
                {[
                  { title: 'Agenda Inteligente', desc: 'Disponibilidad clara y confirmación inmediata.', icon: '⚡' },
                  { title: 'Historial Editorial', desc: 'Tu vehículo como un archivo: limpio y consultable.', icon: '📓' },
                  { title: 'Calidad Controlada', desc: 'Proceso estandarizado, resultado impecable.', icon: '◆' },
                ].map((f, idx) => (
                  <div
                    key={f.title}
                    data-reveal
                    className={`mx-reveal px-8 py-8 ${idx !== 0 ? 'md:border-l md:border-l-[rgba(255,255,255,0.35)]' : ''}`}
                    style={{ transitionDelay: `${idx * 100}ms` }}
                  >
                    <div className="mx-card bg-[rgba(0,26,219,0.78)] border-[rgba(255,255,255,0.18)] px-6 py-7 mx-card-hover-up">
                      <div className="text-white text-2xl">{f.icon}</div>
                      <div className="mt-4 mx-subtitle text-[14px] tracking-[0.18em] uppercase text-white">{f.title}</div>
                      <div className="mt-2 text-[13px] text-[rgba(255,255,255,0.86)]">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="servicios" className="bg-[var(--mx-bg-2)]">
            <div className="mx-container py-[120px] relative">
              <div className="absolute -top-8 right-0 text-[140px] lg:text-[180px] leading-none mx-h1 text-[var(--mx-blue)] opacity-[0.10] select-none pointer-events-none" aria-hidden="true">
                02
              </div>

              <div data-reveal className="mx-reveal">
                <h2 className="mx-h2 text-[56px] sm:text-[64px] lg:text-[72px] text-[var(--mx-text)]">
                  Servicios Especializados
                </h2>
              </div>

              <div data-reveal className="mx-reveal mt-3 text-[15px] text-[var(--mx-text-2)] max-w-[70ch]" style={{ transitionDelay: '120ms' }}>
                Tres tratamientos base — diseñados como piezas de revista: directos, medibles y con terminación impecable.
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Lavado Editorial', desc: 'Exterior + detalles esenciales. Rápido, limpio, constante.' },
                  { title: 'Interior de Precisión', desc: 'Cabina, tapicería y superficies con protocolo de control.' },
                  { title: 'Protección Azul', desc: 'Acabado y sellado para mantener presencia y brillo.' },
                ].map((s, idx) => (
                  <div
                    key={s.title}
                    data-reveal
                    className="mx-reveal"
                    style={{ transitionDelay: `${idx * 120}ms` }}
                  >
                    <div className="mx-card mx-card-hover-up p-7 border-t-[3px] border-t-[var(--mx-blue)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="mx-subtitle text-[14px] tracking-[0.16em] uppercase text-[var(--mx-text)]">{s.title}</div>
                          <div className="mt-3 text-[13px] text-[var(--mx-text-2)] leading-relaxed">{s.desc}</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[var(--mx-blue)] flex items-center justify-center text-white text-sm">
                          {idx + 1}
                        </div>
                      </div>
                      <button onClick={this.props.onEnterLogin} className="mt-6 mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-blue)] inline-flex items-center gap-2 group">
                        Agendar
                        <span className="transition-transform duration-200 ease-out group-hover:translate-x-1">→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="nosotros" className="bg-[var(--mx-bg)]">
            <div className="mx-container py-[120px]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                <div data-reveal className="mx-reveal lg:col-span-6">
                  <div className="h-full bg-[var(--mx-blue)] rounded-[8px] p-6">
                    <div className="h-full bg-[rgba(255,255,255,0.08)] rounded-[8px] overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 86%, 0 100%)' }}>
                      <img
                        src={MOTOEXPERT_PLACEHOLDER_IMG}
                        alt="MotoExpert"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                <div data-reveal className="mx-reveal lg:col-span-6 relative" style={{ transitionDelay: '140ms' }}>
                  <div className="absolute -top-10 -right-4 text-[140px] lg:text-[180px] leading-none mx-h1 text-[var(--mx-text)] opacity-[0.06] select-none pointer-events-none" aria-hidden="true">
                    03
                  </div>

                  <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-blue)]">
                    Editorial / Magazine
                  </div>
                  <h2 className="mx-h2 mt-3 text-[56px] sm:text-[64px] text-[var(--mx-text)]">
                    Precisión.
                    <br />
                    Disciplina.
                  </h2>
                  <p className="mt-5 text-[15px] text-[var(--mx-text-2)] leading-relaxed max-w-[64ch]">
                    MotoExpert opera con un lenguaje visual y operativo claro: líneas finas, métricas visibles y ejecución repetible. Si el resultado no se puede auditar, no existe.
                  </p>

                  <div className="mt-10 grid grid-cols-2 gap-8">
                    {[
                      { n: '10+', label: 'AÑOS' },
                      { n: '15K+', label: 'SERVICIOS' },
                    ].map((st) => (
                      <div key={st.label}>
                        <div className="mx-h1 text-[54px] text-[var(--mx-text)] leading-none">{st.n}</div>
                        <div className="mt-2 h-[2px] w-16 bg-[var(--mx-blue)]" />
                        <div className="mt-2 mx-subtitle text-[12px] tracking-[0.22em] uppercase text-[var(--mx-text-2)]">{st.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer id="contacto" className="bg-[#05010F] text-white">
            <div className="h-[2px] bg-[var(--mx-blue)]" />
            <div className="mx-container py-16">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                  <div className="mx-subtitle text-[18px] tracking-[0.22em] uppercase" translate="no">
                    MOTO<span className="text-[var(--mx-blue)]">EXPERT</span>
                  </div>
                  <div className="mt-4 text-[13px] text-[rgba(255,255,255,0.68)] max-w-[48ch]">
                    Sistema editorial de servicios y seguimiento. Calidad visible. Proceso repetible.
                  </div>
                </div>

                <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
                  {[
                    { title: 'Secciones', links: [{ t: 'Inicio', h: '#inicio' }, { t: 'Servicios', h: '#servicios' }, { t: 'Nosotros', h: '#nosotros' }] },
                    { title: 'Cuenta', links: [{ t: 'Acceder', h: '#', onClick: this.props.onEnterLogin }, { t: 'Registrarse', h: '#', onClick: this.props.onEnterRegister }] },
                    { title: 'Redes', links: [{ t: 'Instagram', h: '#' }, { t: 'Facebook', h: '#' }, { t: 'X', h: '#' }] },
                  ].map((col) => (
                    <div key={col.title}>
                      <div className="mx-subtitle text-[12px] tracking-[0.22em] uppercase text-white">{col.title}</div>
                      <div className="mt-4 flex flex-col gap-3">
                        {col.links.map((l) => (
                          <a
                            key={l.t}
                            href={l.h}
                            onClick={(e) => {
                              if (!l.onClick) return;
                              e.preventDefault();
                              l.onClick();
                            }}
                            className="text-[12px] text-[rgba(255,255,255,0.70)] hover:text-[var(--mx-blue)] transition-colors"
                          >
                            {l.t}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-14 pt-10 border-t border-t-[rgba(0,71,255,0.5)] flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="text-[12px] text-[rgba(255,255,255,0.55)]">
                  © {new Date().getFullYear()} MotoExpert.
                </div>
                <div className="text-[12px] text-[rgba(255,255,255,0.55)]">
                  Hecho con disciplina visual.
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    );
  }
}

export default LandingPage;
