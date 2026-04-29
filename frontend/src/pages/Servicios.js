import { useEffect, useState } from "react";
import CardServicio from "../components/CardServicio";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <section id="servicios" className="py-24 bg-slate-950 relative rounded-3xl border border-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">Servicios Especializados</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Soluciones profesionales diseñadas para mantener tus vehiculos en óptimas condiciones.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {servicios.map((servicio) => (
            <CardServicio key={servicio.id} servicio={servicio} />
          ))}
        </div>

        {loading && (
          <div className="text-center text-slate-400 mt-10">
            Cargando servicios...
          </div>
        )}

        {!loading && error && (
          <div className="text-center text-red-300 mt-10">
            {error}
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
