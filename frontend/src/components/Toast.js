import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = 
    type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
    type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
    'bg-blue-500/10 border-blue-500/20 text-blue-500';
    
  const icon = 
    type === 'success' ? '✅' : 
    type === 'error' ? '❌' : 
    '🔧';

  return (
    <div className={`fixed top-20 right-6 z-[9999] flex items-center space-x-3 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-right fade-in duration-500 ${bgColor}`}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-bold text-sm">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
