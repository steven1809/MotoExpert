export default function CardServicio({ servicio }) {
  return (
    <div className="bg-whiteSoft rounded-2xl shadow-md p-5 hover:shadow-xl transition border border-gray-200">
      <h2 className="text-xl font-bold text-primary">{servicio.nombre}</h2>

      <p className="text-gray-600 mt-2">{servicio.descripcion}</p>

      <p className="text-secondary font-bold mt-3 text-lg">${servicio.precio}</p>

      <button className="mt-4 w-full bg-secondary text-white py-2 rounded-xl hover:bg-primary transition">
        Agendar lavado 🚿
      </button>
    </div>
  );
}
