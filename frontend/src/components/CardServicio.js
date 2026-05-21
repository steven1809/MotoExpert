import { useMemo, useState, useEffect } from "react";

import premiumImg from "../assets/services/premium.jpg";
import expressImg from "../assets/services/express.jpeg";
import interiorImg from "../assets/services/limpiezap.jpeg";
import motorImg from "../assets/services/motor.jpeg";
import protectionImg from "../assets/services/proteccionc.jpeg";
import pulidoImg from "../assets/services/pulidop.jpeg";

const SERVICIO_INFO = {
  especial: {
    nombre: "Lavado Especial",
    descripcion: "Lavado más completo para remover suciedad adherida y dejar un acabado superior. Ideal cuando el vehículo necesita un extra.",
    incluye: ["Prelavado", "Lavado exterior detallado", "Limpieza de rines y llantas", "Secado premium"],
    beneficios: ["Mejor acabado", "Mayor brillo", "Protección básica"],
    productos: "Productos premium",
    nivel: "Especial",
    recomendaciones: "Recomendado cuando el vehículo viene con suciedad difícil o después de un viaje largo.",
    imagen: "https://noticias.pro.pvt.coches.com/wp-content/uploads/2012/06/Miracle_Detail_01.jpg?force_format=original&w=1600&h=1067",
    badge: "Exterior",
    tags: ["Exterior"],
    rating: 4.8,
    reviews: 72
  },
  basico: {
    nombre: "Lavado Básico",
    descripcion: "Limpieza exterior profunda con técnica de dos cubos para evitar micro-rayones. Ideal para el mantenimiento regular.",
    incluye: ["Lavado exterior con PH Neutro", "Limpieza de rines y llantas", "Secado con microfibra premium", "Hidratación básica de llantas"],
    beneficios: ["Mantiene la estética", "Protege la pintura de contaminantes", "Evita la corrosión superficial"],
    productos: "Meguiar's Gold Class, Microfibras de 400 GSM",
    nivel: "Estándar Premium",
    recomendaciones: "Realizar cada 15 días para mantener el brillo.",
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGPhprEHv-0cx4AczUB9nO-G639m4Ti0g4RA&s",
    badge: "Exterior",
    tags: ["Exterior"],
    rating: 4.7,
    reviews: 64
  },
  express: {
    nombre: "Lavado Express",
    descripcion: "Servicio rápido y eficiente para quienes tienen poco tiempo pero exigen calidad. Limpieza exterior rápida y efectiva.",
    incluye: ["Lavado a presión", "Shampoo espumoso", "Secado rápido", "Limpieza de rines frontal"],
    beneficios: ["Ahorro de tiempo", "Limpieza inmediata", "Remoción de polvo y lodo"],
    productos: "Sonax Gloss Shampoo",
    nivel: "Esencial",
    recomendaciones: "Ideal para suciedad ligera después de un viaje corto.",
    imagen: expressImg,
    badge: "Express",
    tags: ["Exterior"],
    rating: 4.7,
    reviews: 95
  },
  premium: {
    nombre: "Lavado Premium",
    descripcion: "Tratamiento completo de detailing. Descontaminación y protección avanzada para un acabado de exhibición.",
    incluye: ["Lavado detallado con foam lance", "Descontaminación química y física (Clay bar)", "Limpieza profunda de motor", "Cera líquida de alta gama", "Limpieza interior detallada"],
    beneficios: ["Brillo extremo", "Protección UV prolongada", "Suavidad al tacto en pintura"],
    productos: "Chemical Guys VRP, CarPro IronX, Collinite 845",
    nivel: "VIP High-End",
    recomendaciones: "Recomendado cada 2-3 meses para protección total.",
    imagen: "https://www.shutterstock.com/image-photo/young-women-swimsuits-cleaning-automobile-260nw-1537318124.jpg",
    badge: "Premium",
    tags: ["Exterior", "Interior"],
    rating: 4.9,
    reviews: 120
  },
  motor: {
    nombre: "Limpieza de Motor",
    descripcion: "Limpieza técnica del vano motor utilizando productos dieléctricos y vapor. Seguridad y estética garantizada.",
    incluye: ["Desengrasado biodegradable", "Limpieza con vapor", "Soplado de humedad", "Acondicionador de plásticos y gomas"],
    beneficios: ["Previene fallas eléctricas", "Mejora la disipación de calor", "Facilita detección de fugas"],
    productos: "Koch Chemie Green Star, Gtechniq C4",
    nivel: "Técnico Especializado",
    recomendaciones: "Realizar una vez al año o después de temporadas de lluvia.",
    imagen: motorImg,
    badge: "Detailing",
    tags: ["Detailing"],
    rating: 4.8,
    reviews: 32
  },
  profunda: {
    nombre: "Limpieza Profunda",
    descripcion: "Restauración total de interiores y exteriores. Desarmado básico para llegar a cada rincón del vehículo.",
    incluye: ["Lavado de chasis", "Desmontaje de piezas para limpieza", "Limpieza de tapicería a vapor", "Desinfección con ozono"],
    beneficios: ["Ambiente libre de bacterias", "Eliminación de olores", "Estado 'como nuevo'"],
    productos: "P&S Terminator, Vapor Polti",
    nivel: "Restauración",
    recomendaciones: "Ideal para vehículos recién comprados o después de viajes largos.",
    imagen: interiorImg,
    badge: "Interior",
    tags: ["Interior"],
    rating: 4.8,
    reviews: 48
  },
  proteccion: {
    nombre: "Protección Cerámica",
    descripcion: "Protección avanzada para la pintura con acabado brillante y mayor resistencia a contaminantes y rayos UV.",
    incluye: ["Descontaminación", "Aplicación de recubrimiento", "Curado", "Revisión final"],
    beneficios: ["Mayor brillo", "Repelencia al agua", "Protección UV"],
    productos: "Recubrimiento cerámico profesional",
    nivel: "Protección",
    recomendaciones: "Ideal si buscas máxima durabilidad y fácil mantenimiento.",
    imagen: protectionImg,
    badge: "Detailing",
    tags: ["Detailing"],
    rating: 4.9,
    reviews: 52
  },
  pulido: {
    nombre: "Pulido Profesional",
    descripcion: "Corrección de pintura para remover micro-rayones y recuperar el brillo con acabado uniforme.",
    incluye: ["Inspección de pintura", "Pulido por etapas", "Sellado/Protección", "Revisión final"],
    beneficios: ["Mejor apariencia", "Superficie uniforme", "Brillo restaurado"],
    productos: "Compuestos y pads profesionales",
    nivel: "Detailing",
    recomendaciones: "Recomendado antes de aplicar protección cerámica.",
    imagen: pulidoImg,
    badge: "Detailing",
    tags: ["Detailing"],
    rating: 4.8,
    reviews: 41
  }
};

const normalizeText = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const getServicioKey = (nombre) => {
  const n = normalizeText(nombre);
  if (n.includes("especial")) return "especial";
  if (n.includes("express")) return "express";
  if (n.includes("premium")) return "premium";
  if (n.includes("motor")) return "motor";
  if (n.includes("proteccion") || n.includes("ceram")) return "proteccion";
  if (n.includes("pulido")) return "pulido";
  if (n.includes("profunda")) return "profunda";
  if (n.includes("basico")) return "basico";
  return "basico"; // default fallback
};

const getBadgeColor = (badge) => {
  if (badge === "Express") return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  if (badge === "Premium") return "bg-purple-500/10 text-purple-300 border-purple-500/20";
  if (badge === "Interior") return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
  if (badge === "Exterior") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  if (badge === "Detailing") return "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20";
  return "bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/20";
};

export default function CardServicio({ servicio, isAdmin, onEdit, onDelete, autoExpand, setView, isFeatured }) {
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

  const info = useMemo(() => {
    const key = getServicioKey(servicio?.nombre);
    const localMeta = SERVICIO_INFO[key] || {};

    const toArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim() !== '') return val.split(',').map(s => s.trim());
      return null;
    };

    const badge =
      servicio?.badge ||
      localMeta.badge ||
      (key === "express"
        ? "Express"
        : key === "premium"
          ? "Premium"
          : key === "profunda"
            ? "Interior"
            : key === "motor"
              ? "Detailing"
              : "Exterior");
    const tags = Array.isArray(servicio?.tags) ? servicio.tags : localMeta.tags || [];
    const rating = typeof servicio?.rating === "number" ? servicio.rating : localMeta.rating;
    const reviews = typeof servicio?.reviews === "number" ? servicio.reviews : localMeta.reviews;

    return {
      nombre: servicio?.nombre || localMeta.nombre || "Servicio",
      descripcion: servicio?.descripcion || localMeta.descripcion || "Sin descripción disponible.",
      incluye: toArray(servicio?.incluye) || localMeta.incluye || [],
      beneficios: toArray(servicio?.beneficios) || localMeta.beneficios || [],
      imagen: servicio?.imagen || localMeta.imagen || expressImg,
      badge,
      tags,
      rating,
      reviews
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
    <div className={`group relative rounded-3xl overflow-hidden border transition-colors ${
      isHighlighted ? "ring-4 ring-[#2563EB]/30 border-[#2563EB]/30" : "border-slate-200 dark:border-white/10"
    } bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10`}>
      <div className="relative h-40 bg-[#0b1220]">
        <img src={info.imagen} alt={info.nombre} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/70 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          {isFeatured && (
            <span className="px-3 py-1 rounded-full bg-[#2563EB]/15 border border-[#2563EB]/25 text-[#60A5FA] text-[10px] font-black">
              Más solicitado
            </span>
          )}
          <span className={`px-3 py-1 rounded-full border text-[10px] font-black ${getBadgeColor(info.badge)}`}>
            {info.badge}
          </span>
        </div>

        {isAdmin && (
          <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center"
              title="Editar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="h-10 w-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#E24B4A] flex items-center justify-center"
              title="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900 dark:text-white truncate">
              {info.nombre}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-[#94A3B8]">
              <div className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-[#60A5FA]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v4.5l3 1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-bold">{servicio?.duracion ? `${servicio.duracion} min` : "—"}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="text-slate-400 dark:text-white/30">•</span>
                <span className="font-bold">{info.tags?.length ? info.tags.join(" · ") : info.badge}</span>
              </div>
              {typeof info.rating === "number" && typeof info.reviews === "number" && (
                <div className="inline-flex items-center gap-1">
                  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.373 2.451a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.539 1.118L10.59 15.61a1 1 0 00-1.176 0l-3.373 2.452c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69l1.286-3.967z" />
                  </svg>
                  <span className="font-black text-slate-900 dark:text-white">{info.rating.toFixed(1)}</span>
                  <span className="text-slate-500 dark:text-white/40">({info.reviews})</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm font-black text-[#2563EB] whitespace-nowrap">
            {precioFormateado}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAgendar}
            className="flex-1 h-10 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
            Agendar
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-1 h-10 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest transition-colors inline-flex items-center justify-center gap-2"
          >
            Ver detalles
            <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className={`transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0 pointer-events-none"} ${expanded ? "max-h-[520px] mt-4" : "max-h-0 mt-0"} overflow-hidden`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                Incluye
              </div>
              <div className="mt-3 space-y-2">
                {info.incluye.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-white/80">
                    <span className="mt-0.5 text-[#60A5FA]">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                Beneficios
              </div>
              <div className="mt-3 space-y-2">
                {info.beneficios.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-white/80">
                    <span className="mt-0.5 text-emerald-400">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
