import React from 'react';

const StepDatosPersonales = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Nombre
          </label>
          <input
            type="text"
            value={data.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            className={`w-full bg-gray-900 border-2 ${
              errors.nombre ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all`}
            placeholder="Juan"
          />
          {errors.nombre && <span className="text-red-400 text-xs mt-1 block">{errors.nombre}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Apellido
          </label>
          <input
            type="text"
            value={data.apellido}
            onChange={(e) => onChange({ apellido: e.target.value })}
            className={`w-full bg-gray-900 border-2 ${
              errors.apellido ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all`}
            placeholder="Pérez"
          />
          {errors.apellido && <span className="text-red-400 text-xs mt-1 block">{errors.apellido}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={data.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
            className={`w-full bg-gray-900 border-2 ${
              errors.telefono ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all`}
            placeholder="3001234567"
          />
          {errors.telefono && <span className="text-red-400 text-xs mt-1 block">{errors.telefono}</span>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={`w-full bg-gray-900 border-2 ${
              errors.email ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all`}
            placeholder="juan@email.com"
          />
          {errors.email && <span className="text-red-400 text-xs mt-1 block">{errors.email}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Tipo de Documento
          </label>
          <select
            value={data.tipoDocumento}
            onChange={(e) => onChange({ tipoDocumento: e.target.value })}
            className="w-full bg-gray-900 border-2 border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="CC">Cédula de Ciudadanía (CC)</option>
            <option value="NIT">NIT</option>
            <option value="Pasaporte">Pasaporte</option>
            <option value="CE">Cédula de Extranjería (CE)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Número de Documento
          </label>
          <input
            type="text"
            value={data.numeroDocumento}
            onChange={(e) => onChange({ numeroDocumento: e.target.value })}
            className={`w-full bg-gray-900 border-2 ${
              errors.numeroDocumento ? 'border-red-500' : 'border-gray-800 focus:border-blue-500'
            } rounded-xl px-4 py-3 text-white outline-none transition-all`}
            placeholder="1002345678"
          />
          {errors.numeroDocumento && <span className="text-red-400 text-xs mt-1 block">{errors.numeroDocumento}</span>}
        </div>
      </div>
    </div>
  );
};

export default StepDatosPersonales;
