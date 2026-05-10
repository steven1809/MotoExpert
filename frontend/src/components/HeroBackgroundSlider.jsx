import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  'https://images.unsplash.com/photo-1599256621730-535171e28e50?auto=format&fit=crop&q=80&w=1920', // Detailing premium
  'https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80&w=1920', // Porsche en taller
  'https://images.unsplash.com/photo-1605152276897-4f618f831968?auto=format&fit=crop&q=80&w=1920', // Lavado profesional
  'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1920', // Taller minimalista
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1920'  // Auto de lujo
];

const HeroBackgroundSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#020617]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ 
            duration: 2, 
            ease: [0.4, 0, 0.2, 1],
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-[6000ms] ease-linear transform scale-110"
            style={{ backgroundImage: `url(${IMAGES[currentIndex]})` }}
          />
          
          {/* Overlay Dinámico Premium */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/80 to-[#020617]" />
          <div className="absolute inset-0 bg-[#020617]/20 backdrop-blur-[1px]" />
        </motion.div>
      </AnimatePresence>

      {/* Indicadores Minimalistas Estilo Tesla */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className="group relative h-10 w-8 flex items-center justify-center"
          >
            <div className={`h-[2px] transition-all duration-700 ease-out ${
              i === currentIndex ? 'w-full bg-[#2563EB]' : 'w-4 bg-white/20 group-hover:bg-white/40'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default HeroBackgroundSlider;
