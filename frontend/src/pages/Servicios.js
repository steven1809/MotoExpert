import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import CardServicio from "../components/CardServicio";

export default function Servicios({ embedded = false }) {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    fetch("/servicios")
      .then((res) => res.json())
      .then((data) => setServicios(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div
      className={
        embedded
          ? "bg-gradient-to-b from-light to-whiteSoft rounded-2xl border border-white/10 text-slate-900 overflow-hidden"
          : "bg-gradient-to-b from-light to-whiteSoft min-h-screen text-slate-900"
      }
    >
      {!embedded && <Navbar />}

      <h1
        className={embedded ? "text-3xl font-bold text-center pt-6 text-primary" : "text-3xl font-bold text-center mt-6 text-primary"}
        id="servicios"
      >
        Servicios de Lavado
      </h1>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {servicios.map((servicio) => (
          <CardServicio key={servicio.id} servicio={servicio} />
        ))}
      </div>
    </div>
  );
}
