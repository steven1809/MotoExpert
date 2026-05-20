import { useMemo, useState, useEffect } from "react";

const SERVICIO_INFO = {
  basico: {
    nombre: "Lavado Básico",
    descripcion: "Limpieza exterior profunda con técnica de dos cubos para evitar micro-rayones. Ideal para el mantenimiento regular.",
    incluye: ["Lavado exterior con PH Neutro", "Limpieza de rines y llantas", "Secado con microfibra premium", "Hidratación básica de llantas"],
    beneficios: ["Mantiene la estética", "Protege la pintura de contaminantes", "Evita la corrosión superficial"],
    productos: "Meguiar's Gold Class, Microfibras de 400 GSM",
    nivel: "Estándar Premium",
    recomendaciones: "Realizar cada 15 días para mantener el brillo.",
    imagen: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800"
  },
  express: {
    nombre: "Lavado Express",
    descripcion: "Servicio rápido y eficiente para quienes tienen poco tiempo pero exigen calidad. Limpieza exterior rápida y efectiva.",
    incluye: ["Lavado a presión", "Shampoo espumoso", "Secado rápido", "Limpieza de rines frontal"],
    beneficios: ["Ahorro de tiempo", "Limpieza inmediata", "Remoción de polvo y lodo"],
    productos: "Sonax Gloss Shampoo",
    nivel: "Esencial",
    recomendaciones: "Ideal para suciedad ligera después de un viaje corto.",
    imagen: "https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&q=80&w=800"
  },
  premium: {
    nombre: "Lavado Premium",
    descripcion: "Tratamiento completo de detailing. Descontaminación y protección avanzada para un acabado de exhibición.",
    incluye: ["Lavado detallado con foam lance", "Descontaminación química y física (Clay bar)", "Limpieza profunda de motor", "Cera líquida de alta gama", "Limpieza interior detallada"],
    beneficios: ["Brillo extremo", "Protección UV prolongada", "Suavidad al tacto en pintura"],
    productos: "Chemical Guys VRP, CarPro IronX, Collinite 845",
    nivel: "VIP High-End",
    recomendaciones: "Recomendado cada 2-3 meses para protección total.",
    imagen: "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=800"
  },
  motor: {
    nombre: "Limpieza de Motor",
    descripcion: "Limpieza técnica del vano motor utilizando productos dieléctricos y vapor. Seguridad y estética garantizada.",
    incluye: ["Desengrasado biodegradable", "Limpieza con vapor", "Soplado de humedad", "Acondicionador de plásticos y gomas"],
    beneficios: ["Previene fallas eléctricas", "Mejora la disipación de calor", "Facilita detección de fugas"],
    productos: "Koch Chemie Green Star, Gtechniq C4",
    nivel: "Técnico Especializado",
    recomendaciones: "Realizar una vez al año o después de temporadas de lluvia.",
    imagen: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=800"
  },
  profunda: {
    nombre: "Limpieza Profunda",
    descripcion: "Restauración total de interiores y exteriores. Desarmado básico para llegar a cada rincón del vehículo.",
    incluye: ["Lavado de chasis", "Desmontaje de piezas para limpieza", "Limpieza de tapicería a vapor", "Desinfección con ozono"],
    beneficios: ["Ambiente libre de bacterias", "Eliminación de olores", "Estado 'como nuevo'"],
    productos: "P&S Terminator, Vapor Polti",
    nivel: "Restauración",
    recomendaciones: "Ideal para vehículos recién comprados o después de viajes largos.",
    imagen: "https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=800"
  }
};

function Icon({ name }) {
  const icons = {
    settings: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
    bag: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    ),
    chart: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    )
  };

  return (
    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name] || icons.chart}
    </svg>
  );
}

// Funciones de utilidad auxiliares
const normalizeText = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const getServicioKey = (nombre) => {
  const n = normalizeText(nombre);
  if (n.includes("express")) return "express";
  if (n.includes("premium")) return "premium";
  if (n.includes("motor")) return "motor";
  if (n.includes("profunda")) return "profunda";
  if (n.includes("basico")) return "basico";
  return "basico"; // default fallback
};

export default function CardServicio({ servicio, isAdmin, onEdit, onDelete, autoExpand, setView }) {
  const [expanded, setExpanded] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const handleAgendar = () => {
    localStorage.setItem('selectedServiceId', servicio.id);
    localStorage.setItem('pendingAction', 'agendar_cita');
    if (setView) {
      setView('citas');
    }
  };

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true);
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [autoExpand]);

  // 1. Procesar datos de la Base de Datos o Fallback local
  const info = useMemo(() => {
    const key = getServicioKey(servicio?.nombre);
    const localMeta = SERVICIO_INFO[key] || {};

    // Función para convertir string separado por comas a Array
    const toArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim() !== '') return val.split(',').map(s => s.trim());
      return null;
    };

    return {
      nombre: servicio?.nombre || localMeta.nombre || "Servicio",
      descripcion: servicio?.descripcion || localMeta.descripcion || "Sin descripción disponible.",
      incluye: toArray(servicio?.incluye) || localMeta.incluye || [],
      beneficios: toArray(servicio?.beneficios) || localMeta.beneficios || [],
      productos: localMeta.productos || "Línea Premium MotoExpert",
      nivel: localMeta.nivel || "Detailing Profesional",
      recomendaciones: localMeta.recomendaciones || "Seguir el plan de mantenimiento sugerido.",
      imagen: localMeta.imagen || "https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=800"
    };
  }, [servicio]);

  const precioFormateado = useMemo(() => {
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      maximumFractionDigits: 0 
    }).format(servicio?.precio || 0);
  }, [servicio?.precio]);

  return (
    <div className={`group relative bg-slate-900 border transition-all duration-700 overflow-hidden ${
      expanded ? "rounded-[3rem] ring-2 ring-blue-600/20" : "rounded-3xl"
    } ${
      isHighlighted ? "animate-pulse ring-4 ring-blue-600/50 shadow-[0_0_50px_rgba(37,99,235,0.3)]" : "border-slate-800"
    } hover:border-blue-600/50 hover:shadow-2xl hover:shadow-blue-600/10`}>
      
      {/* Imagen Principal (Solo visible cuando está expandido) */}
      <div className={`relative transition-all duration-700 overflow-hidden ${expanded ? "h-64" : "h-0"}`}>
        <img src={info.imagen} alt={info.nombre} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute top-6 left-6">
          <span className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {info.nivel}
          </span>
        </div>
      </div>

      <div className="p-8">
        {/* Botones de Admin */}
        {isAdmin && (
          <div className="absolute top-4 right-4 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
              title="Editar Servicio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
              title="Eliminar Servicio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-6 mb-6">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner border border-blue-600/10">
            <Icon name={servicio?.nombre?.toLowerCase().includes("premium") ? "bag" : "settings"} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{info.nombre}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{info.nivel}</span>
            </div>
          </div>
        </div>
        
        <p className="text-slate-400 leading-relaxed mb-6 font-medium">
          {expanded ? info.descripcion : `${info.descripcion.substring(0, 100)}...`}
        </p>

        {/* Contenido Expandible */}
        <div className={`overflow-hidden transition-all duration-700 ${expanded ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="pt-8 mt-6 border-t border-slate-800 space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Listado Incluye */}
              <div className="space-y-4">
                <div className="text-[10px] text-blue-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-blue-600" /> Qué Incluye
                </div>
                <ul className="space-y-3">
                  {info.incluye.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm font-medium">
                      <span className="mt-1 text-blue-500 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Listado Beneficios */}
              <div className="space-y-4">
                <div className="text-[10px] text-emerald-500 uppercase tracking-[0.2em] font-black flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-emerald-600" /> Beneficios
                </div>
                <ul className="space-y-3">
                  {info.beneficios.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm font-medium">
                      <span className="mt-1 text-emerald-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/50 p-6 rounded-2xl border border-white/5">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Productos Utilizados</div>
                <div className="text-sm text-slate-300 font-bold">{info.productos}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Recomendación VIP</div>
                <div className="text-sm text-slate-300 font-bold italic">"{info.recomendaciones}"</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer de la Card */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-800/50 gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tighter">{precioFormateado}</span>
              <div className="flex items-center gap-2 text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest">⏱️ {servicio?.duracion} MIN</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-1 sm:flex-none px-6 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              {expanded ? "Menos Info" : "Ver Más"}
            </button>
            <button
              onClick={handleAgendar}
              className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              Agendar Ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
