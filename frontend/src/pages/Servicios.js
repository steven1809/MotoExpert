import { useEffect, useState } from "react";
import CardServicio from "../components/CardServicio";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Servicios({ setView }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editServicio, setEditServicio] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    duracion: "",
    incluye: "",
    beneficios: ""
  });

  useEffect(() => {
    setUserRole(localStorage.getItem("role") || "");
    fetchServicios();
  }, []);

  const fetchServicios = () => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/servicios`)
      .then((res) => res.json())
      .then((data) => {
        setServicios(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setServicios([]);
        setError(`No se pudieron cargar los servicios. Verifica que el backend esté corriendo en ${API_BASE_URL}`);
      })
      .finally(() => setLoading(false));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (servicio = null) => {
    if (servicio) {
      setEditServicio(servicio);
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion,
        precio: servicio.precio,
        duracion: servicio.duracion,
        incluye: Array.isArray(servicio.incluye) ? servicio.incluye.join(", ") : (servicio.incluye || ""),
        beneficios: Array.isArray(servicio.beneficios) ? servicio.beneficios.join(", ") : (servicio.beneficios || "")
      });
    } else {
      setEditServicio(null);
      setFormData({ nombre: "", descripcion: "", precio: "", duracion: "", incluye: "", beneficios: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const method = editServicio ? "PATCH" : "POST";
    const url = editServicio 
      ? `${API_BASE_URL}/servicios/${editServicio.id}` 
      : `${API_BASE_URL}/servicios`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          precio: Number(formData.precio),
          duracion: Number(formData.duracion)
        })
      });

      if (response.ok) {
        setShowModal(false);
        fetchServicios();
      } else {
        alert("Error al guardar el servicio");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) fetchServicios();
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const normalizeSlug = (text) => {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  };

  useEffect(() => {
    if (!loading && servicios.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        const slug = hash.replace('#', '');
        setTimeout(() => {
          const element = document.getElementById(slug);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [loading, servicios]);

  const serviciosFiltrados = servicios.filter((servicio) =>
    servicio.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4">
        {/* Modal Admin */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 italic">
                {editServicio ? "Editar Servicio" : "Añadir Nuevo Servicio"}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Nombre del Servicio</label>
                  <input name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Descripción</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Precio ($)</label>
                  <input name="precio" type="number" value={formData.precio} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Duración (min)</label>
                  <input name="duracion" type="number" value={formData.duracion} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" required />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Incluye (separado por comas)</label>
                  <input name="incluye" value={formData.incluye} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Beneficios (separado por comas)</label>
                  <input name="beneficios" value={formData.beneficios} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-4 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-700 transition-all">Cancelar</button>
                  <button type="submit" className="px-8 py-2 bg-blue-600 text-slate-900 dark:text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white italic tracking-tighter uppercase">Servicios <span className="text-blue-500">Especializados</span></h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl font-medium">
              Soluciones profesionales diseñadas para mantener tus vehículos en óptimas condiciones.
            </p>
          </div>
          
          {userRole === "admin" && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transform hover:scale-105 transition-all flex items-center space-x-2"
            >
              <span>+ Añadir Nuevo Servicio</span>
            </button>
          )}
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
            className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xl font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviciosFiltrados.map((servicio) => {
            const slug = normalizeSlug(servicio.nombre);
            const isAutoExpand = window.location.hash === `#${slug}`;

            return (
              <div key={servicio.id} id={slug} className="scroll-mt-32">
                <CardServicio 
                  servicio={servicio} 
                  isAdmin={userRole === "admin"}
                  onEdit={() => handleOpenModal(servicio)}
                  onDelete={() => handleDelete(servicio.id)}
                  autoExpand={isAutoExpand}
                  setView={setView}
                />
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-10 flex flex-col items-center">
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
          <div className="text-center py-16 bg-slate-100 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 mt-10">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No se encontraron servicios</h3>
            <p className="text-slate-500 dark:text-slate-400">No se encontraron servicios que coincidan con tu búsqueda: <span className="text-blue-500 font-bold">"{filtroBusqueda}"</span></p>
            <button 
              onClick={() => setFiltroBusqueda("")}
              className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-medium underline"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

        {!loading && !error && servicios.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
            No hay servicios registrados todavía.
          </div>
        )}
      </div>
  );
}
