import React from 'react';

const ServiceCard = ({ servicio, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(servicio.id)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
        isSelected
          ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-bold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
          {servicio.nombre}
        </h3>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-700'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-gray-400 text-xs">⏱ {servicio.duracion} min</span>
        <span className="text-blue-400 font-bold">
          ${servicio.precio.toLocaleString('es-CO')}
        </span>
      </div>
    </button>
  );
};

export default ServiceCard;
