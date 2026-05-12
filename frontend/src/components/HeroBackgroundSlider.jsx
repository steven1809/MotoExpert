import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const makeHeroPlaceholder = (label) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <rect width="1920" height="1080" fill="#0A0F1E"/>
      <path d="M1320 0h600v780z" fill="#0047FF"/>
      <path d="M0 860h1920" stroke="#0047FF" stroke-width="2" opacity="0.8"/>
      <text x="90" y="250" font-family="Bebas Neue, sans-serif" font-size="180" fill="#F9FAFB" opacity="0.9">${label}</text>
      <text x="92" y="345" font-family="Outfit, sans-serif" font-size="44" fill="#9CA3AF" letter-spacing="7">MOTO</text>
      <text x="250" y="345" font-family="Outfit, sans-serif" font-size="44" fill="#0047FF" letter-spacing="7">EXPERT</text>
      <g opacity="0.25">
        <path d="M90 430h680" stroke="#4D8AFF" stroke-width="2"/>
        <path d="M90 470h520" stroke="#4D8AFF" stroke-width="2"/>
        <path d="M90 510h610" stroke="#4D8AFF" stroke-width="2"/>
      </g>
    </svg>`
  )}`;

const IMAGES = [
  makeHeroPlaceholder('01'),
  makeHeroPlaceholder('02'),
  makeHeroPlaceholder('03'),
  makeHeroPlaceholder('04'),
  makeHeroPlaceholder('05'),
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
