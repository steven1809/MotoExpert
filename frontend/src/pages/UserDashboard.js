import React, { Component } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import MapView from '../components/MapView';
import premiumImg from "../assets/services/premium.jpg";
import ServiceReportCard from '../components/ServiceReportCard';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class UserDashboard extends Component {
  constructor(props) {
    super(props);
    const userId = localStorage.getItem('userId');
    const onboardingSeen = localStorage.getItem(`onboarding_seen_${userId}`) === 'true';
    
    this.state = {
      loading: true,
      servicios: [],
      misVehiculos: [],
      citas: [],
      previousCitas: [],
      onboardingSeen,
      ratings: [],
    };
    this.pollingInterval = null;
  }

  componentDidMount() {
    this.fetchInitialFormData();
    this.fetchCitas();
    // Poll every 12 seconds
    this.pollingInterval = setInterval(this.fetchCitas, 12000);
  }

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  handleDirectionsClick = () => {
    window.open(
      "https://www.google.com/maps?q=MotoExpert",
      "_blank"
    );
  };

  checkAndUpdateOnboarding = (vehiculos, citas) => {
    const userId = localStorage.getItem('userId');
    const hasVehicles = vehiculos && vehiculos.length > 0;
    const hasCompletedCitas = citas && citas.some(c => c.estado === 'FINALIZADO');
    
    if (hasVehicles && hasCompletedCitas) {
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
      if (!this.state.onboardingSeen) {
        this.setState({ onboardingSeen: true });
      }
    }
  };

  fetchInitialFormData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [serviciosRes, vehiculosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/servicios`, { headers }),
        fetch(`${API_BASE_URL}/vehiculos`, { headers })
      ]);
      if (serviciosRes.ok && vehiculosRes.ok) {
        const [serviciosData, vehiculosData] = await Promise.all([
          serviciosRes.json(),
          vehiculosRes.json()
        ]);
        this.setState({ servicios: serviciosData, misVehiculos: vehiculosData, loading: false });
        // Check onboarding after we have data
        this.checkAndUpdateOnboarding(vehiculosData, this.state.citas);
      } else {
        this.setState({ loading: false });
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      this.setState({ loading: false });
    }
  };

  fetchCitas = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const response = await fetch(`${API_BASE_URL}/citas`, { headers });
      if (response.ok) {
        const data = await response.json();
        this.checkForStatusChanges(data);
        this.setState(prev => ({ 
          citas: data, 
          previousCitas: prev.citas 
        }));
        // Check onboarding after we have citas
        this.checkAndUpdateOnboarding(this.state.misVehiculos, data);
        // Fetch ratings for citas
        this.fetchRatingsForCitas(data, headers);
      }
    } catch (err) {
      console.error('Error fetching citas:', err);
    }
  };

  fetchRatingsForCitas = async (citas, headers) => {
    const ratings = [];
    for (const cita of citas.filter(c => c.estado === 'FINALIZADO')) {
      try {
        const response = await fetch(`${API_BASE_URL}/ratings/cita/${cita.id}`, { headers });
        if (response.ok) {
          const rating = await response.json();
          if (rating) ratings.push(rating);
        }
      } catch (err) {
        console.error(`Error fetching rating for cita ${cita.id}:`, err);
      }
    }
    this.setState({ ratings });
  };

  submitRating = async ({ citaId, specialistRating, serviceRating, comment }) => {
    const token = localStorage.getItem('token');
    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    try {
      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ citaId, specialistRating, serviceRating, comment }),
      });

      if (response.ok) {
        const newRating = await response.json();
        this.setState(prev => ({ 
          ratings: [...prev.ratings, newRating],
          citas: prev.citas.map(c => 
            c.id === citaId ? { ...c, rated: true } : c
          )
        }));
        if (this.props.showToast) {
          this.props.showToast('Thank you for your feedback!', 'success');
        }
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  checkForStatusChanges = (newCitas) => {
    const { previousCitas } = this.state;
    const { showToast } = this.props;

    if (!showToast) return;

    newCitas.forEach(newCita => {
      const oldCita = previousCitas.find(c => c.id === newCita.id);
      
      if (oldCita && oldCita.estado !== newCita.estado) {
        // Status changed!
        if (oldCita.estado === 'PENDIENTE' && newCita.estado === 'EN PROCESO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha comenzado. ¡Estamos trabajando en tu vehículo!`, 'info');
        } else if (oldCita.estado === 'EN PROCESO' && newCita.estado === 'FINALIZADO') {
          showToast(`Tu servicio ${newCita.servicio?.nombre} ha sido completado. ¡Tu vehículo está listo!`, 'success');
        }
      }
    });
  };

  handleSaberMas = (servicio) => {
    const slug = servicio.nombre.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/\s+/g, '-') // Espacios por guiones
      .replace(/[^\w-]/g, ''); // Quitar caracteres especiales
    
    window.location.hash = slug;
    this.props.setView('servicios');
  };

  handleAgendarServicio = (servicio) => {
    const { misVehiculos } = this.state;
    const { setView } = this.props;

    localStorage.setItem('selectedServiceId', servicio.id);

    if (misVehiculos && misVehiculos.length > 0) {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('citas');
    } else {
      localStorage.setItem('pendingAction', 'agendar_cita');
      setView('vehiculos');
    }
  };

  render() {
    const { servicios, loading, citas, onboardingSeen } = this.state;
    const { setView } = this.props;
    
    // Get latest completed citas with reports
    const completedCitasWithReports = citas
      .filter(c => c.estado === 'FINALIZADO' && c.report && c.report.workPerformed)
      .sort((a, b) => new Date(b.completedAt || b.fecha) - new Date(a.completedAt || a.fecha))
      .slice(0, 5);

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>;

    return (
      <div className="space-y-24 animate-in fade-in duration-700 pb-32 bg-white dark:bg-[#020617]">
        {/* ENCABEZADO DE BIENVENIDA PREMIUM */}
        <header className="relative min-h-[60vh] flex items-center justify-center overflow-hidden rounded-[3rem] border border-slate-200 dark:border-white/5 mx-6 mt-6">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=1920" 
              className="w-full h-full object-cover opacity-30"
              alt="Welcome background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-[#020617]/80 to-[#020617]" />
          </div>

          <div className="relative z-10 text-center space-y-8 px-6">
            <div className="inline-block px-4 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-bottom duration-700">
              Panel de Control Premium
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-[#F8FAFC] sans tracking-tighter italic uppercase leading-none">
              Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-blue-400">MotoExpert</span>
            </h1>
            <p className="text-slate-500 dark:text-[#94A3B8] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
              Gestiona tu flota personal y agenda servicios de detailing con el estándar más alto de la industria.
            </p>
          </div>
        </header>

        {/* BENEFICIOS / TIPS REDISEÑADOS */}
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Agenda Inteligente', desc: 'Reserva servicios en segundos.', icon: '' },
            { title: 'Gestión de Flota', desc: 'Control total de tus vehículos.', icon: '' },
            { title: 'Soporte VIP', desc: 'Atención prioritaria 24/7.', icon: '' }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/5 hover:border-[#2563EB]/30 transition-all duration-500 shadow-2xl group">
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-[#F8FAFC] mb-2">{item.title}</h3>
              <p className="text-slate-500 dark:text-[#94A3B8] text-sm font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* LAYOUT DE INSTRUCCIONES PREMIUM OR LATEST SERVICE REPORTS */}
        <div className="container mx-auto px-6">
          {!onboardingSeen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LADO IZQUIERDO: VEHÍCULOS */}
              <div className="bg-slate-100 dark:bg-[#111827] p-10 rounded-[2.5rem] transition-all flex flex-col h-full group border border-slate-200 dark:border-white/5 hover:border-purple-500/20 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-xl shadow-inner">1</div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">Mi Flota Personal</h2>
                </div>
                <ul className="space-y-4 mb-10 flex-grow text-slate-500 dark:text-[#94A3B8] font-medium">
                  {[
                    "Añade un nuevo vehículo a tu perfil.",
                    "Especifica placa, marca y modelo.",
                    "Sincroniza el historial de servicios.",
                    "Administra múltiples vehículos."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start space-x-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600/10 text-purple-500 rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => this.props.setView('vehiculos')}
                  className="w-full py-5 bg-slate-200 dark:bg-[#1e293b] hover:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-slate-200 dark:border-white/5 shadow-2xl transition-all active:scale-95"
                >
                  Mis Vehículos
                </button>
              </div>
              {/* LADO DERECHO: CITAS */}
              <div className="bg-slate-100 dark:bg-[#111827] p-10 rounded-[2.5rem] transition-all flex flex-col h-full group border border-slate-200 dark:border-white/5 hover:border-[#2563EB]/20 shadow-2xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center text-xl shadow-inner">2</div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">Gestión de Citas</h2>
                </div>
                <ul className="space-y-4 mb-10 flex-grow text-slate-500 dark:text-[#94A3B8] font-medium">
                  {[
                    "Selecciona tu vehículo registrado.",
                    "Elige el servicio premium deseado.",
                    "Define fecha y hora en tiempo real.",
                    "Confirma y recibe tu código VIP."
                  ].map((step, i) => (
                    <li key={i} className="flex items-start space-x-4">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#2563EB]/10 text-[#2563EB] rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</span>
                      <span className="text-sm">{step}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => this.props.setView('citas')}
                  className="w-full py-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#2563EB]/20 transition-all active:scale-95"
                >
                  Agendar Cita
                </button>
              </div>
            </div>
          ) : (
            /* LATEST SERVICE REPORTS SECTION */
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
                <h2 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">
                  Latest Service Reports
                </h2>
              </div>

              {completedCitasWithReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedCitasWithReports.map(cita => (
                    <ServiceReportCard 
                      key={cita.id} 
                      cita={cita} 
                      rating={this.state.ratings.find(r => r.cita.id === cita.id)} 
                      onSubmitRating={this.submitRating}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-slate-100 dark:bg-[#111827] p-12 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/5 text-center">
                  <div className="text-4xl mb-4 opacity-30">📋</div>
                  <p className="text-slate-500 dark:text-[#94A3B8] italic font-medium">
                    No service reports yet. Your completed services will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SERVICIOS PREMIUM CAROUSEL */}
        <section className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <div className="text-[#2563EB] text-[10px] font-black uppercase tracking-[0.3em]">Catálogo Detailing</div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter leading-none">
                Servicios <span className="text-[#2563EB]">Exclusivos</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-[#94A3B8] max-w-sm text-sm font-medium">
              Cada proceso está diseñado para elevar la estética y proteger la integridad de tu vehículo.
            </p>
          </div>

          <div className="relative px-6">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{ clickable: true, dynamicBullets: true }}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-20"
            >
              {servicios.map((s, idx) => {
                const mockImages = [
                  premiumImg,
                ];
                const bgImage = mockImages[idx % mockImages.length];

                return (
                  <SwiperSlide key={s.id}>
                    <div
                      className="group relative h-[360px] w-full overflow-hidden rounded-[3rem] bg-slate-100 dark:bg-[#111827] shadow-2xl transition-all duration-700 border border-slate-200 dark:border-white/5 hover:border-[#2563EB]/40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    >
                      <div className="absolute inset-0 z-10 bg-[#020617]/30" />
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#020617]/85 via-[#020617]/30 to-transparent" />
                      <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                        <div className="space-y-6 transform transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                          <h4 className="text-3xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">{s.nombre}</h4>
                          <p className="text-slate-500 dark:text-[#94A3B8] text-sm line-clamp-2 leading-relaxed font-medium">{s.descripcion}</p>
                          
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                              onClick={() => this.handleAgendarServicio(s)}
                              className="flex-1 py-5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-[#2563EB]/20 active:scale-95"
                            >
                              Agendar Ahora
                            </button>
                            <button 
                              onClick={() => this.handleSaberMas(s)}
                              className="flex-1 py-5 bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300 dark:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 backdrop-blur-xl transition-all active:scale-95"
                            >
                              Saber Más
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
            
            <div className="swiper-button-prev-custom absolute left-10 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-2xl bg-white dark:bg-[#020617]/50 p-5 text-white backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:bg-[#2563EB] transition-all hidden lg:flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </div>
            <div className="swiper-button-next-custom absolute right-10 top-1/2 z-30 -translate-y-1/2 cursor-pointer rounded-2xl bg-white dark:bg-[#020617]/50 p-5 text-white backdrop-blur-xl border border-slate-200 dark:border-white/5 hover:bg-[#2563EB] transition-all hidden lg:flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </div>
          </div>
        </section>

        {/* MAPA PREMIUM */}
        <div className="container mx-auto px-6 py-20">
          <div className="rounded-[3rem] overflow-hidden border border-slate-200 dark:border-white/5 shadow-2xl relative group h-[500px]">
            <MapView />
            <div className="absolute bottom-10 left-10 right-10 p-8 bg-white dark:bg-[#020617]/60 backdrop-blur-2xl border border-slate-200 dark:border-white/5 rounded-3xl z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] italic uppercase tracking-tighter">Nuestra Sede Central</h3>
                  <p className="text-slate-500 dark:text-[#94A3B8] font-medium">Ubicación estratégica para el cuidado de tu motor.</p>
                </div>
                <button
                  onClick={this.handleDirectionsClick}
                  className="bg-white hover:bg-blue-700 hover:text-white text-[#020617] font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transform transition-all active:scale-95 flex items-center justify-center mx-auto space-x-2"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Cómo llegar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default UserDashboard;
