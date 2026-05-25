import React, { useEffect, useState } from 'react';
import { getServicios } from '../../../services/agendamiento.service';
import ServiceCard from '../ui/ServiceCard';
import SkeletonCard from '../ui/SkeletonCard';

const StepVehiculoServicio = ({ data, onChange, errors }) => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const data = await getServicios();
        setServicios(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, []);

  return (
    <div className="space-y-8">
      {/* Datos del Vehículo */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">
          Datos del Vehículo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Tipo de Vehículo
            </label>
            <select
              value={data.tipoVehiculo}
              onChange={(e) => onChange({ tipoVehiculo: e.target.value })}
              className="w-full bg-gray-900 border-2 border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Automóvil">Automóvil</option>
              <option value="Camioneta SUV">Camioneta SUV</option>
              <option value="Camioneta pickup">Camioneta pickup</option>
              <option value="Moto">Moto</option>
              <option value="Van/Furgón">Van/Furgón</option>
              <option value="Campero">Campero</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Placa
            </label>
            <input
              type="text"
              value={data.placa}
              onChange={(e) => onChange({ placa: e.target.value.toUpperCase() })}
              className={`w-full bg-gray-900 border-2 ${
                errors.placa ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
              } rounded-xl px-4 py-3 text-white outline-none transition-all`}
              placeholder="ABC123"
            />
            {errors.placa && <span className="text-red-400 text-xs mt-1 block">{errors.placa}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Marca
            </label>
            <input
              type="text"
              value={data.marca}
              onChange={(e) => onChange({ marca: e.target.value })}
              className={`w-full bg-gray-900 border-2 ${
                errors.marca ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
              } rounded-xl px-4 py-3 text-white outline-none transition-all`}
              placeholder="Chevrolet"
            />
            {errors.marca && <span className="text-red-400 text-xs mt-1 block">{errors.marca}</span>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Modelo
            </label>
            <input
              type="text"
              value={data.modelo}
              onChange={(e) => onChange({ modelo: e.target.value })}
              className={`w-full bg-gray-900 border-2 ${
                errors.modelo ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
              } rounded-xl px-4 py-3 text-white outline-none transition-all`}
              placeholder="Spark"
            />
            {errors.modelo && <span className="text-red-400 text-xs mt-1 block">{errors.modelo}</span>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Año
            </label>
            <input
              type="number"
              min="1990"
              max="2026"
              value={data.anio}
              onChange={(e) => onChange({ anio: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full bg-gray-900 border-2 border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
              placeholder="2021"
            />
          </div>
        </div>
      </div>

      {/* Selección de Servicio */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">
          Selecciona un Servicio
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard type="service" count={4} />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicios.map((s) => (
                <ServiceCard
                  key={s.id}
                  servicio={s}
                  isSelected={data.servicioId === s.id}
                  onSelect={(id) => onChange({ servicioId: id })}
                />
              ))}
            </div>
            {errors.servicioId && (
              <span className="text-red-400 text-xs mt-2 block">{errors.servicioId}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StepVehiculoServicio;
