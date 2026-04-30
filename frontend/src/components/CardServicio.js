import { useMemo, useState } from "react";

const SERVICIO_INFO = {
  basico: {
    nombre: "Lavado básico",
    descripcion:
      "Servicio de limpieza exterior del vehículo que incluye enjuague con agua a presión, aplicación de jabón especializado, limpieza de rines, llantas y secado manual para evitar manchas. Es ideal para mantener el carro limpio en el día a día de forma rápida y económica.",
    incluye: ["Lavado exterior", "Limpieza de rines y llantas", "Secado manual"],
    beneficios: ["Mantiene la apariencia del vehículo", "Elimina suciedad superficial", "Servicio rápido y accesible"],
    resumen: "Limpieza sencilla por fuera.",
  },
  express: {
    nombre: "Lavado express",
    descripcion:
      "Lavado exterior rápido enfocado en remover la suciedad superficial en el menor tiempo posible. Se realiza con técnicas ágiles para optimizar el tiempo sin comprometer la limpieza básica del vehículo.",
    incluye: ["Enjuague rápido", "Aplicación de jabón", "Secado básico"],
    beneficios: ["Ideal para personas con poco tiempo", "Servicio económico", "Entrega rápida"],
    resumen: "Lavado rápido y práctico.",
  },
  premium: {
    nombre: "Lavado premium",
    descripcion:
      "Servicio completo que incluye lavado exterior detallado, aspirado interior, limpieza de vidrios, tablero y superficies internas. Se enfoca en brindar una limpieza más profunda y un acabado más estético.",
    incluye: ["Lavado exterior completo", "Aspirado interior", "Limpieza de vidrios", "Limpieza de tablero y puertas"],
    beneficios: ["Mayor nivel de limpieza", "Mejora la experiencia del usuario", "Vehículo limpio por dentro y por fuera"],
    resumen: "Limpieza completa.",
  },
  motor: {
    nombre: "Lavado de motor",
    descripcion:
      "Limpieza especializada del motor utilizando productos desengrasantes y técnicas seguras que eliminan suciedad, grasa y residuos sin afectar componentes eléctricos. Se realiza con cuidado para proteger las partes sensibles.",
    incluye: ["Aplicación de desengrasante", "Limpieza controlada del motor", "Secado y revisión básica"],
    beneficios: ["Mejora la apariencia del motor", "Facilita la detección de fugas", "Contribuye al mantenimiento del vehículo"],
    resumen: "Limpieza técnica del motor.",
  },
  profunda: {
    nombre: "Limpieza profunda",
    descripcion:
      "Servicio detallado que incluye limpieza completa del interior y exterior del vehículo. Se eliminan manchas, suciedad acumulada y residuos difíciles, logrando un acabado casi como nuevo.",
    incluye: [
      "Lavado exterior completo",
      "Limpieza interior detallada",
      "Aspirado profundo",
      "Limpieza de tapicería",
      "Limpieza de vidrios y superficies",
    ],
    beneficios: ["Renovación total del vehículo", "Eliminación de olores y manchas", "Mayor confort y presentación"],
    resumen: "Limpieza total a fondo.",
  },
};

function Icon({ name }) {
  if (name === "settings") {
    return (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }

  if (name === "bag") {
    return (
      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }

  return (
    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function getIconName(nombre) {
  const normalized = (nombre || "").toLowerCase();
  if (normalized.includes("básico") || normalized.includes("basico")) return "settings";
  if (normalized.includes("premium")) return "bag";
  return "chart";
}

function normalizeText(input) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getServicioKey(nombre) {
  const n = normalizeText(nombre);
  if (n.includes("express")) return "express";
  if (n.includes("premium")) return "premium";
  if (n.includes("motor")) return "motor";
  if (n.includes("profunda")) return "profunda";
  if (n.includes("basico") || (n.includes("lavado") && n.includes("sico"))) return "basico";
  return "";
}

function formatCurrency(value) {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return value ? `$${value}` : "";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function getPreviewText(text, maxChars) {
  const t = (text || "").trim();
  if (!t) return "";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars).trim()}...`;
}

export default function CardServicio({ servicio }) {
  const [expanded, setExpanded] = useState(false);

  const meta = useMemo(() => {
    const key = getServicioKey(servicio?.nombre);
    return key ? SERVICIO_INFO[key] : null;
  }, [servicio?.nombre]);

  const nombre = meta?.nombre || servicio?.nombre || "";
  const descripcion = meta?.descripcion || servicio?.descripcion || "";
  const incluye = meta?.incluye || [];
  const beneficios = meta?.beneficios || [];
  const resumen = meta?.resumen || "";

  const precio = useMemo(() => formatCurrency(servicio?.precio), [servicio?.precio]);
  const duracion =
    typeof servicio?.duracion === "number"
      ? `${servicio.duracion} min`
      : servicio?.duracion
        ? `${servicio.duracion} min`
        : "";
  const descripcionCorta = useMemo(() => getPreviewText(descripcion, 170), [descripcion]);

  return (
    <div className="group p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-600/50 hover:bg-slate-800/50 transition-all duration-300">
      <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Icon name={getIconName(nombre)} />
      </div>
      <h3 className="text-xl font-bold mb-4 text-white">{nombre}</h3>
      <p className="text-slate-400 leading-relaxed mb-6">{expanded ? descripcion : descripcionCorta}</p>

      <div
        className={
          expanded ? "max-h-96 opacity-100 transition-all duration-300 overflow-hidden" : "max-h-0 opacity-0 transition-all duration-300 overflow-hidden"
        }
      >
        <div className="pt-2 mt-2 border-t border-slate-800">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Incluye</div>
              <ul className="space-y-2 text-slate-300 text-sm">
                {incluye.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Beneficios</div>
              <ul className="space-y-2 text-slate-300 text-sm">
                {beneficios.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {resumen && <div className="text-slate-400 text-sm italic">{`En pocas palabras: ${resumen}`}</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">
          {precio && <span>{precio}</span>}
          {precio && duracion && <span> · </span>}
          {duracion && <span>{duracion}</span>}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-blue-500 font-bold text-sm inline-flex items-center group-hover:translate-x-2 transition-transform"
        >
          {expanded ? "Ver menos" : "Ver más"}
          <svg
            className={expanded ? "w-4 h-4 ml-2 rotate-90 transition-transform" : "w-4 h-4 ml-2 transition-transform"}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
