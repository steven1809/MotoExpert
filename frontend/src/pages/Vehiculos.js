import React, { useState, useEffect } from 'react';

const Vehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: '',
    placa: '',
    color: '',
    usuarioId: ''
  });

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    try {
      console.log('Obteniendo vehículos...');
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/vehiculos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Respuesta de obtener vehículos:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Vehículos obtenidos:', data);
        setVehiculos(data);
      } else {
        setError('Error al obtener vehículos');
      }
    } catch (err) {
      console.error('Error al obtener vehículos:', err);
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Intentando crear vehículo...');
    console.log('Form data:', formData);

    try {
      const token = localStorage.getItem('token');
      console.log('Token encontrado:', token ? 'Sí' : 'No');

      if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        return;
      }

      const dataToSend = {
        ...formData,
        usuarioId: parseInt(formData.usuarioId, 10),
        anio: formData.anio ? parseInt(formData.anio, 10) : undefined
      };

      console.log('Datos a enviar:', dataToSend);

      const response = await fetch('http://localhost:3001/vehiculos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      console.log('Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('Vehículo creado:', result);
        setShowForm(false);
        setFormData({ marca: '', modelo: '', anio: '', placa: '', color: '', usuarioId: '' });
        fetchVehiculos();
        alert('Vehículo creado exitosamente!');
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        alert(`Error al crear vehículo: ${errorData.message || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
      alert('Error de conexión al servidor');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/vehiculos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchVehiculos();
      } else {
        alert('Error al eliminar vehículo');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-2xl max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Gestión de Vehículos
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Vehículo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Agregar Nuevo Vehículo</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Marca</label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({...formData, marca: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Modelo</label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Año</label>
              <input
                type="number"
                value={formData.anio}
                onChange={(e) => setFormData({...formData, anio: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Placa</label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({...formData, placa: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">ID Usuario Propietario</label>
              <input
                type="number"
                value={formData.usuarioId}
                onChange={(e) => setFormData({...formData, usuarioId: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa el ID del usuario"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Crear Vehículo
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehiculos.map((vehiculo) => (
          <div key={vehiculo.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🚗</span>
              </div>
              <button
                onClick={() => handleDelete(vehiculo.id)}
                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{vehiculo.marca} {vehiculo.modelo}</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p><span className="font-medium text-slate-400">Año:</span> {vehiculo.anio}</p>
              <p><span className="font-medium text-slate-400">Placa:</span> {vehiculo.placa}</p>
              <p><span className="font-medium text-slate-400">Color:</span> {vehiculo.color}</p>
              <p><span className="font-medium text-slate-400">Usuario ID:</span> {vehiculo.usuarioId}</p>
            </div>
          </div>
        ))}
      </div>

      {vehiculos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚗</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No hay vehículos registrados</h3>
          <p className="text-slate-400">Comienza agregando tu primer vehículo</p>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;