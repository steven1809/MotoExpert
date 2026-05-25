import React from 'react';

const StepResumen = ({ data }) => {
  const sections = [
    {
      title: 'Datos Personales',
      fields: [
        { label: 'Cliente', value: `${data.nombre} ${data.apellido}` },
        { label: 'Teléfono', value: data.telefono },
        { label: 'Email', value: data.email },
        { label: 'Documento', value: `${data.tipoDocumento} ${data.numeroDocumento}` },
      ],
    },
    {
      title: 'Vehículo y Servicio',
      fields: [
        { label: 'Tipo', value: data.tipoVehiculo },
        { label: 'Placa', value: data.placa },
        { label: 'Vehículo', value: `${data.marca} ${data.modelo} (${data.anio})` },
        { label: 'Color', value: data.color },
      ],
    },
    {
      title: 'Cita',
      fields: [
        { label: 'Fecha', value: data.fecha },
        { label: 'Hora', value: data.hora },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-blue-400 font-bold uppercase tracking-wider text-sm">
            Revisa tu información
          </h3>
          <p className="text-gray-400 text-xs">
            Asegúrate de que todos los datos sean correctos antes de confirmar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">
              {section.title}
            </h4>
            <div className="space-y-3">
              {section.fields.map((field, fidx) => (
                <div key={fidx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{field.label}</span>
                  <span className="text-white font-medium">{field.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepResumen;
