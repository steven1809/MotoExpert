import { useEffect, useState } from "react";
import CardServicio from "../components/CardServicio";

export default function Servicios() {
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/servicios")
      .then((res) => res.json())
      .then((data) => setServicios(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-gradient-to-b from-light to-whiteSoft">
      <h1 className="text-3xl font-bold text-center mt-6 text-primary" id="servicios">
        Servicios de Lavado 🚗💦
      </h1>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {servicios.map((servicio) => (
          <CardServicio key={servicio.id} servicio={servicio} />
        ))}
      </div>
    </div>
  );
}
