import React from 'react';

const SlotButton = ({ hora, isOcupado, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      disabled={isOcupado}
      onClick={() => onSelect(hora)}
      className={`py-3 rounded-lg border-2 text-sm font-bold transition-all duration-200 ${
        isOcupado
          ? 'bg-gray-900 border-gray-800 text-gray-700 line-through cursor-not-allowed opacity-50'
          : isSelected
          ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500/50 hover:text-blue-400'
      }`}
    >
      {hora}
    </button>
  );
};

export default SlotButton;
