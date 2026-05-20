import { useEffect, useMemo, useState } from "react";
import CardServicio from "../components/CardServicio";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const normalizeText = (t) =>
  (t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getCategoryTags = (servicio) => {
  const n = normalizeText(servicio?.nombre);
  const tags = [];
  if (n.includes("interior")) tags.push("Interior");
  if (n.includes("exterior")) tags.push("Exterior");
  if (n.includes("detailing") || n.includes("detail")) tags.push("Detailing");
  if (n.includes("express")) tags.push("Express");
  if (n.includes("premium")) tags.push("Premium");
  return tags.length ? tags : ["Todos"];
};

export default function Servicios({ setView }) {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
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

  const featuredServiceId = useMemo(() => {
    const byName = servicios.find((s) => normalizeText(s?.nombre).includes("lavado premium"));
    if (byName?.id) return byName.id;
    const byPrice = [...servicios]
      .filter((s) => s && typeof s.precio !== "undefined")
      .sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0))[0];
    return byPrice?.id ?? null;
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const term = normalizeText(filtroBusqueda);
    return servicios.filter((servicio) => {
      const nameMatches = normalizeText(servicio?.nombre).includes(term);
      if (!nameMatches) return false;
      if (categoryFilter === "Todos") return true;
      const tags = getCategoryTags(servicio);
      return tags.includes(categoryFilter);
    });
  }, [categoryFilter, filtroBusqueda, servicios]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] pb-24 animate-in fade-in duration-700">
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

        <div className="max-w-7xl mx-auto px-6 pt-8 space-y-6">
          <div className="flex flex-col gap-2">
            <div className="text-sm font-black text-slate-900 dark:text-white">Servicios</div>
            <div className="text-sm text-slate-600 dark:text-[#94A3B8]">
              Explora nuestros servicios y agenda el que mejor se adapte a tu vehículo.
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative w-full lg:max-w-[520px]">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full h-11 pl-12 pr-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:border-[#2563EB]/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              {["Todos", "Express", "Premium", "Detailing", "Interior", "Exterior"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoryFilter(c)}
                  className={`h-9 px-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-colors ${
                    categoryFilter === c
                      ? "bg-[#2563EB]/15 border-[#2563EB]/25 text-[#60A5FA]"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10"
                  }`}
                >
                  {c}
                </button>
              ))}

              {userRole === "admin" && (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="h-9 px-4 rounded-2xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                >
                  + Añadir servicio
                </button>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                Todos nuestros servicios incluyen productos premium
              </div>
              <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Utilizamos productos de alta calidad que cuidan y protegen tu vehículo.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-[#94A3B8]">
              <div className="inline-flex items-center gap-2">
                <span className="h-9 w-9 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center">✓</span>
                Productos premium
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-9 w-9 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center">✓</span>
                Personal especializado
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="h-9 w-9 rounded-2xl bg-[#2563EB]/15 border border-[#2563EB]/20 text-[#60A5FA] flex items-center justify-center">✓</span>
                Garantía de satisfacción
              </div>
            </div>
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

          {!loading && !error && serviciosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      isFeatured={featuredServiceId === servicio.id}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && servicios.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
              No hay servicios registrados todavía.
            </div>
          )}
        </div>
      </div>
  );
}
