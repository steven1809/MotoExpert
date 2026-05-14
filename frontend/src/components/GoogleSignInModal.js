import React, { useEffect, useRef } from 'react';

const GoogleSignInModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleButtonRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [isOpen]);

  const handleGoogleCallback = (response) => {
    console.log('Google response:', response);
    const userData = {
      id: 'google_user_' + Date.now(),
      name: 'Usuario Google',
      email: 'google@example.com',
      role: 'user',
      token: response.credential,
    };
    onLoginSuccess('user');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[16px] shadow-2xl p-8 relative animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors text-2xl"
        >
          ×
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión o registrarse</h2>
          <p className="text-gray-500 text-sm">Selecciona una opción para continuar</p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            ref={googleButtonRef}
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-full text-gray-700 font-medium hover:border-gray-300 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-xl">G</span>
            Continuar con Google
          </button>

          <button className="w-full py-3 px-4 border-2 border-gray-200 rounded-full text-gray-700 font-medium hover:border-gray-300 transition-all flex items-center justify-center gap-3">
            <span className="text-xl">🍎</span>
            Continuar con Apple
          </button>

          <button className="w-full py-3 px-4 border-2 border-gray-200 rounded-full text-gray-700 font-medium hover:border-gray-300 transition-all flex items-center justify-center gap-3">
            <span className="text-xl">📱</span>
            Continuar con tu número de teléfono
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-4 text-gray-500 text-sm">o</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all">
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignInModal;
