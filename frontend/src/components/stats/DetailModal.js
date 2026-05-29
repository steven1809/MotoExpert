import React from 'react';

const DetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">Detalle del Servicio</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Servicio</p>
              <p className="text-lg font-semibold text-gray-200">{item.servicio}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Precio</p>
              <p className="text-lg font-semibold text-green-400">${item.precio?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Técnico</p>
              <p className="text-lg font-semibold text-gray-200">{item.empleado}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Cliente</p>
              <p className="text-lg font-semibold text-gray-200">{item.cliente}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Vehículo</p>
              <p className="text-lg font-semibold text-gray-200">{item.vehiculo}</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Fecha y Hora</p>
              <p className="text-lg font-semibold text-gray-200">
                {item.fecha} {item.hora?.substring(0, 5)}
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
            <p className="text-sm text-gray-400 mb-1">Subtotal</p>
            <p className="text-3xl font-bold text-white">${item.subtotal?.toLocaleString()}</p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
