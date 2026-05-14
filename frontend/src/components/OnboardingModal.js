import React, { useState } from 'react';

const steps = [
  {
    id: 1,
    icon: '🏍️',
    title: 'Bienvenido a MotoExpert',
    description: 'La plataforma premium para gestionar tu flota y agendar servicios de detailing. En 5 pasos te mostramos todo lo que puedes hacer.',
  },
  {
    id: 2,
    icon: '🚗',
    title: 'Añade tu vehículo',
    description: "Ve a 'Vehículos' en el menú y registra tu moto o carro.",
    example: (
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 space-y-4 mt-6">
        <div className="text-sm text-[#94A3B8]">Ejemplo:</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-xs text-[#94A3B8] mb-1">Placa</div>
            <div className="text-white font-bold">ABC-123</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-xs text-[#94A3B8] mb-1">Marca</div>
            <div className="text-white font-bold">Yamaha</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 col-span-2">
            <div className="text-xs text-[#94A3B8] mb-1">Modelo</div>
            <div className="text-white font-bold">MT-07</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    icon: '🔧',
    title: 'Conoce nuestros servicios',
    description: 'Desde lavado básico hasta detailing premium. Cada servicio incluye descripción, duración y precio.',
    example: (
      <div className="flex flex-wrap gap-3 mt-6">
        <span className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-bold">Lavado Básico</span>
        <span className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-bold">Detailing Premium</span>
        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-sm font-bold">Limpieza de Cadena</span>
      </div>
    ),
  },
  {
    id: 4,
    icon: '📅',
    title: 'Agenda tu cita en segundos',
    description: 'Selecciona tu vehículo registrado, elige el servicio y escoge fecha y hora disponible.',
    example: (
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mt-6">
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-[#94A3B8] font-bold py-2">{day}</div>
          ))}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(day => (
            <div
              key={day}
              className={`py-2 rounded-lg ${day === 12 ? 'bg-[#3b82f6] text-white font-bold shadow-lg' : 'text-white/50'}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    icon: '✅',
    title: '¡Todo listo!',
    description: 'Ya tienes todo para aprovechar MotoExpert al máximo. Recuerda que puedes ver tu historial de servicios en cualquier momento.',
  },
];

const OnboardingModal = ({ isOpen, onClose, userId }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onComplete = () => {
    if (userId) {
      localStorage.setItem(`motoexpert_onboarding_done_${userId}`, 'true');
    }
    onClose();
  };

  const onSkip = () => {
    if (userId) {
      localStorage.setItem(`motoexpert_onboarding_done_${userId}`, 'true');
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-[90vw] h-[90vh] max-w-7xl max-h-[900px] bg-[#0a0f1e] border-2 border-[#3b82f6]/30 rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-500 flex">
        {/* Left column - Illustration */}
        <div className="w-1/2 bg-gradient-to-br from-[#0a0f1e] to-[#0f172a] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[#3b82f6]/5 blur-[100px]"></div>
          <div className="relative z-10 text-9xl animate-pulse drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            {currentStepData.icon}
          </div>
        </div>

        {/* Right column - Content */}
        <div className="w-1/2 p-10 flex flex-col">
          {/* Skip button */}
          {currentStep < steps.length && (
            <button
              onClick={onSkip}
              className="ml-auto text-[#94A3B8] hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-white/5"
            >
              Omitir
            </button>
          )}

          {/* Step indicators */}
          <div className="flex justify-center gap-4 mb-10 mt-4">
            {steps.map(step => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  step.id < currentStep 
                    ? 'bg-[#3b82f6] scale-125' 
                    : step.id === currentStep 
                      ? 'bg-[#3b82f6] w-10 rounded-full' 
                      : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="flex-1 flex flex-col justify-center">
            <div
              key={currentStep}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
                {currentStepData.title}
              </h2>
              <p className="text-[#94A3B8] text-lg font-medium leading-relaxed mb-6">
                {currentStepData.description}
              </p>
              {currentStepData.example}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all active:scale-95"
              >
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 ${
                currentStep === steps.length
                  ? 'bg-[#3b82f6] hover:bg-[#2563EB] text-white shadow-2xl shadow-[#3b82f6]/40'
                  : 'bg-[#3b82f6] hover:bg-[#2563EB] text-white shadow-2xl shadow-[#3b82f6]/40'
              }`}
            >
              {currentStep === steps.length ? '¡Empezar ahora!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
