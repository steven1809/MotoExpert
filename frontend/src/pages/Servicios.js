import { useEffect, useState } from "react";
import CardServicio from "../components/CardServicio";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch("http://localhost:3000/servicios")
      .then((res) => res.json())
      .then((data) => {
        setServicios(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setServicios([]);
        setError("No se pudieron cargar los servicios. Verifica que el backend esté corriendo en http://localhost:3000");
      })
      .finally(() => setLoading(false));
  }, []);

  const serviciosFiltrados = servicios.filter((servicio) =>
    servicio.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <section id="servicios" className="py-24 bg-slate-950 relative rounded-3xl border border-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold mb-4 text-white">Servicios Especializados</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Soluciones profesionales diseñadas para mantener tus vehiculos en óptimas condiciones.
          </p>
        </div>

        {/* Buscador de Servicios */}
        <div className="max-w-md mx-auto mb-12 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar servicio (ej: Motor)..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviciosFiltrados.map((servicio) => (
            <CardServicio key={servicio.id} servicio={servicio} />
          ))}
        </div>

        {loading && (
          <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            Cargando servicios...
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-300 mt-10">
            {error}
          </div>
        )}

        {!loading && !error && servicios.length > 0 && serviciosFiltrados.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 mt-10">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron servicios</h3>
            <p className="text-slate-400">No se encontraron servicios que coincidan con tu búsqueda: <span className="text-blue-500 font-bold">"{filtroBusqueda}"</span></p>
            <button 
              onClick={() => setFiltroBusqueda("")}
              className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {!loading && !error && servicios.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            No hay servicios registrados todavía.
          </div>
        )}
      </div>
    </section>
  );
}
