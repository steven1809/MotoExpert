import React from 'react';

const DateRangePicker = ({ from, to, onFromChange, onToChange, onApply }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Rango Personalizado</h3>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-400 mb-2">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm text-gray-400 mb-2">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <button
          onClick={onApply}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
