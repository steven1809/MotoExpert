import React, { useState, useEffect, useRef } from 'react';

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Seleccionar...", 
  className = "",
  label = "",
  dropdownPosition = "down" // 'up' or 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  
  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const index = options.findIndex(o => String(o.value) === String(value));
      setHighlightedIndex(index >= 0 ? index : 0);
    }
  }, [isOpen, options, value]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % options.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
    >
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-2 px-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full h-9 px-3 flex items-center justify-between rounded-2xl bg-[#1a1d27] border border-[#2a2d3a] text-white focus:outline-none transition-all duration-300 ${
          isOpen 
            ? 'ring-2 ring-[#2563EB]/40 border-[#2563EB]/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
            : 'hover:bg-white/5 hover:border-white/20'
        }`}
      >
        <span className={`text-sm font-medium truncate ${!selectedOption ? 'text-white/40' : 'text-white'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#2563EB]' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={`absolute ${
            dropdownPosition === "up" 
              ? "bottom-[calc(100%+8px)]" 
              : "top-[calc(100%+8px)]"
          } left-0 z-[120] w-full overflow-hidden rounded-2xl bg-[#0F172A]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200`}
        >
          <style>{`
            .custom-select-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-select-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-select-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
            }
            .custom-select-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.2);
            }
          `}</style>
          <div 
            className="p-1.5 max-h-[280px] overflow-y-auto custom-select-scrollbar"
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-4 py-8 text-center text-white/40 text-xs italic">
                No hay opciones disponibles
              </div>
            ) : (
              options.map((option, index) => {
                const isSelected = String(value) === String(option.value);
                const isHighlighted = highlightedIndex === index;
                return (
                  <button
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full px-4 py-3 text-left text-sm rounded-xl transition-all duration-200 flex items-center justify-between group mb-0.5 last:mb-0 ${
                      isSelected
                        ? 'bg-[#2563EB] text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                        : isHighlighted 
                          ? 'bg-[#2563EB]/20 text-white'
                          : 'text-slate-300 hover:bg-[#2563EB]/10 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-white/30 group-hover:text-white/50'}`}>
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white animate-in zoom-in duration-300 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
