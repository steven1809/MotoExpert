import React, { useMemo, useState } from 'react';
import {
  FaRocket,
  FaCar,
  FaStar,
  FaCalendarAlt,
  FaCheckCircle,
} from 'react-icons/fa';

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
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4 mt-6">
        <div className="text-sm text-gray-400">Ejemplo:</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">Placa</div>
            <div className="text-white font-bold">ABC-123</div>
          </div>
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">Marca</div>
            <div className="text-white font-bold">Yamaha</div>
          </div>
          <div className="bg-white/[0.06] border border-white/[0.08] rounded-xl p-3 col-span-2">
            <div className="text-xs text-gray-400 mb-1">Modelo</div>
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
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mt-6">
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-gray-400 font-bold py-2">{day}</div>
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
  const [slideDir, setSlideDir] = useState('right');

  const handleNext = () => {
    if (currentStep < steps.length) {
      setSlideDir('right');
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setSlideDir('left');
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

  const currentStepData = steps[currentStep - 1];
  const totalSteps = steps.length;
  const progressPct = (currentStep / totalSteps) * 100;
  const stepBadge = `${String(currentStep).padStart(2, '0')} / ${String(totalSteps).padStart(2, '0')}`;

  const stepImage = useMemo(() => {
    const images = {
      1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
      2: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
      3: 'https://images.unsplash.com/photo-1614026480418-bd11fdb9fa06?w=800&q=80',
      4: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
      5: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80',
    };
    return images[currentStep] || images[1];
  }, [currentStep]);

  const StepIcon = useMemo(() => {
    const map = {
      1: FaRocket,
      2: FaCar,
      3: FaStar,
      4: FaCalendarAlt,
      5: FaCheckCircle,
    };
    return map[currentStep] || FaRocket;
  }, [currentStep]);

  const contentAnimClass = slideDir === 'left' ? 'mxp-slide-in-left' : 'mxp-slide-in-right';
  const isLast = currentStep === totalSteps;
  const primaryLabel = isLast ? '¡Comenzar!' : 'Siguiente';
  const secondaryLabel = currentStep > 1 ? 'Anterior' : 'Omitir';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-30px);} to { opacity: 1; transform: translateX(0); } }
        .mxp-slide-in-right { animation: slideInRight 450ms ease-out; }
        .mxp-slide-in-left  { animation: slideInLeft 450ms ease-out; }

        @keyframes confettiFall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(520px) rotate(260deg); opacity: 0; }
        }
        .mxp-confetti { position:absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; overflow:hidden; }
        .mxp-confetti i { position:absolute; width:8px; height:12px; border-radius:2px; animation: confettiFall 1500ms linear infinite; }
      `}</style>

      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(10, 15, 40, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow:
            '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px rgba(59, 130, 246, 0.08)',
        }}
      >
        <div className={`relative ${isLast ? '' : ''}`}>
          {isLast && (
            <div className="mxp-confetti">
              {Array.from({ length: 18 }).map((_, idx) => {
                const colors = ['#60A5FA', '#22C55E', '#F59E0B', '#A78BFA', '#F97316', '#E879F9'];
                const left = (idx * 100) % 100;
                const delay = (idx % 9) * 0.12;
                const duration = 1.1 + (idx % 6) * 0.12;
                const color = colors[idx % colors.length];
                return (
                  <i
                    key={idx}
                    style={{
                      left: `${left}%`,
                      background: color,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      transform: `translateY(-30px) rotate(${idx * 13}deg)`,
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="relative h-36 sm:h-48 overflow-hidden">
            <img src={stepImage} alt="" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, rgba(10,15,40,0.6) 60%, rgba(10,15,40,0.9) 100%)',
              }}
            />

            <div className="absolute top-4 left-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 backdrop-blur-md flex items-center justify-center text-blue-200">
                <StepIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="absolute top-4 right-4 text-white/60 text-xs font-mono">
              {stepBadge}
            </div>
          </div>

          <div className="px-5 sm:px-8 pt-5 sm:pt-6">
            <div className="w-full rounded-full h-1.5 mb-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs mb-4">
              Paso {currentStep} de {totalSteps}
            </div>
          </div>

          <div className={`px-5 sm:px-8 py-4 sm:py-6 ${contentAnimClass}`}>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-3xl">
                <StepIcon className={isLast ? 'animate-bounce' : ''} />
              </div>
            </div>

            <h2 className={`text-2xl font-bold text-white mb-2 text-center ${isLast ? 'text-green-400' : ''}`}>
              {isLast ? '¡Todo listo! Ya puedes usar MotoExpert' : currentStepData.title}
            </h2>
            <div className="w-12 h-0.5 bg-blue-500 mx-auto mt-2 mb-4" />

            <p className="text-gray-300 text-sm leading-relaxed text-center">
              {currentStepData.description}
            </p>

            {currentStepData.example && (
              <div className="mt-5">
                {currentStepData.example}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => {
                  if (currentStep > 1) handlePrev();
                  else onSkip();
                }}
                className="w-full sm:w-auto sm:flex-1 text-gray-400 hover:text-white px-6 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {secondaryLabel}
              </button>

              <button
                onClick={handleNext}
                className="w-full sm:w-auto sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 inline-flex items-center justify-center gap-2"
              >
                {primaryLabel}
                {isLast && <FaRocket className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
