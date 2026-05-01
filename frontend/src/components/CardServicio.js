import { useMemo, useState } from "react";

const SERVICIO_INFO = {
  basico: {
    nombre: "Lavado básico",
    descripcion: "Servicio de limpieza exterior del vehículo que incluye enjuague con agua a presión, aplicación de jabón especializado, limpieza de rines, llantas y secado manual para evitar manchas.",
    incluye: ["Lavado exterior", "Limpieza de rines y llantas", "Secado manual"],
    beneficios: ["Mantiene la apariencia", "Elimina suciedad superficial"],
    resumen: "Limpieza sencilla por fuera.",
  },
  // ... (puedes mantener los demás como fallback)
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
  return "";
};

export default function CardServicio({ servicio, isAdmin, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

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
      resumen: localMeta.resumen || ""
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
    <div className="group relative p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
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

      <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon name={servicio?.nombre?.toLowerCase().includes("premium") ? "bag" : "settings"} />
      </div>

      <h3 className="text-xl font-bold mb-4 text-white">{info.nombre}</h3>
      
      <p className="text-slate-400 leading-relaxed mb-6">
        {expanded ? info.descripcion : `${info.descripcion.substring(0, 120)}...`}
      </p>

      {/* Contenido Expandible */}
      <div className={`overflow-hidden transition-all duration-500 ${expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="pt-4 mt-2 border-t border-slate-800 space-y-6">
          
          {/* Listado Incluye */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">Incluye</div>
            <ul className="space-y-2 text-slate-300 text-sm">
              {info.incluye.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Listado Beneficios */}
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">Beneficios</div>
            <ul className="space-y-2 text-slate-300 text-sm">
              {info.beneficios.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer de la Card */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
        <div className="flex flex-col">
          <span className="text-white font-bold">{precioFormateado}</span>
          <span className="text-xs text-slate-500">{servicio?.duracion} min aprox.</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 font-bold text-sm hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          {expanded ? "Ver menos" : "Ver más"}
          <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}