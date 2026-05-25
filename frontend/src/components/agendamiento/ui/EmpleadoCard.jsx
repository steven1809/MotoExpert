import React from 'react';

const EmpleadoCard = ({ empleado, isSelected, onSelect }) => {
  const getInitials = (nombre, apellido) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const id = empleado ? empleado.id : null;
  const nombreCompleto = empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Sin preferencia';
  const rol = empleado ? empleado.rol : 'Asignación automática';
  const iniciales = empleado ? getInitials(empleado.nombre, empleado.apellido) : '?';

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'
      }`}>
        {iniciales}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold truncate ${isSelected ? 'text-blue-400' : 'text-white'}`}>
          {nombreCompleto}
        </h3>
        <p className="text-gray-500 text-xs truncate">{rol}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-700'
      }`}>
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
};

export default EmpleadoCard;
