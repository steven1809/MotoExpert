import React, { useEffect, useState } from 'react';
import { 
  getEmpleados, 
  getDisponibilidad 
} from '../../../services/agendamiento.service';
import EmpleadoCard from '../ui/EmpleadoCard';
import SlotButton from '../ui/SlotButton';
import SkeletonCard from '../ui/SkeletonCard';

const StepEmpleadoHorario = ({ data, onChange, errors }) => {
  const [empleados, setEmpleados] = useState([]);
  const [loadingEmpleados, setLoadingEmpleados] = useState(true);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        const list = await getEmpleados();
        setEmpleados(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEmpleados(false);
      }
    };
    fetchEmpleados();
  }, []);

  useEffect(() => {
    if (data.fecha && data.servicioId) {
      const fetchDisponibilidad = async () => {
        setLoadingDisponibilidad(true);
        setError('');
        try {
          const res = await getDisponibilidad(data.fecha, data.servicioId, data.empleadoId);
          setDisponibilidad(res);
        } catch (err) {
          setError(err.message || 'Error al consultar disponibilidad');
          setDisponibilidad(null);
        } finally {
          setLoadingDisponibilidad(false);
        }
      };
      fetchDisponibilidad();
    }
  }, [data.fecha, data.empleadoId, data.servicioId]);

  return (
    <div className="space-y-8">
      {/* Selección de Empleado */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">
          ¿Quién te atenderá?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingEmpleados ? (
            <SkeletonCard type="empleado" count={3} />
          ) : (
            <>
              <EmpleadoCard
                empleado={null}
                isSelected={data.empleadoId === null}
                onSelect={(id) => onChange({ empleadoId: id, hora: '' })}
              />
              {empleados.map((e) => (
                <EmpleadoCard
                  key={e.id}
                  empleado={e}
                  isSelected={data.empleadoId === e.id}
                  onSelect={(id) => onChange({ empleadoId: id, hora: '' })}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Selección de Fecha */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">
          Selecciona la Fecha
        </h3>
        <div className="relative group max-w-xs">
          <input
            type="date"
            value={data.fecha}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => onChange({ fecha: e.target.value, hora: '' })}
            className={`w-full bg-gray-900 border-2 ${
              errors.fecha ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all [color-scheme:dark]`}
          />
          {errors.fecha && <span className="text-red-400 text-xs mt-1 block">{errors.fecha}</span>}
        </div>
      </div>

      {/* Selección de Horario */}
      {data.fecha && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">
            Horarios Disponibles
          </h3>
          
          {loadingDisponibilidad ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              <SkeletonCard type="slot" count={12} />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border-2 border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          ) : disponibilidad ? (
            <>
              {disponibilidad.disponibles.length === 0 && disponibilidad.ocupados.length === 0 ? (
                <div className="text-gray-500 italic py-4">
                  Sin horarios disponibles para este día.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {disponibilidad.disponibles.map((h) => (
                    <SlotButton
                      key={h}
                      hora={h}
                      isOcupado={false}
                      isSelected={data.hora === h}
                      onSelect={(hora) => onChange({ hora })}
                    />
                  ))}
                  {disponibilidad.ocupados.map((h) => (
                    <SlotButton
                      key={h}
                      hora={h}
                      isOcupado={true}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  ))}
                </div>
              )}
              {errors.hora && <span className="text-red-400 text-xs mt-2 block">{errors.hora}</span>}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default StepEmpleadoHorario;
