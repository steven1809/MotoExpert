import React, { useEffect, useRef, useState } from 'react';

const WompiCheckout = ({ appointmentId, amountCOP, publicKey, integritySignature, reference, redirectUrl }) => {
  const amountInCents = amountCOP * 100;
  const scriptInjected = useRef(false);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (scriptInjected.current || !integritySignature) return;
    scriptInjected.current = true;

    const container = document.getElementById('wompi-container');
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.setAttribute('data-render', 'button');
    script.setAttribute('data-public-key', publicKey);
    script.setAttribute('data-currency', 'COP');
    script.setAttribute('data-amount-in-cents', String(amountInCents));
    script.setAttribute('data-reference', reference);
    script.setAttribute('data-signature:integrity', integritySignature);
    script.setAttribute('data-redirect-url', redirectUrl);

    // Detectar cuando el widget termina de renderizar
    script.onload = () => {
      // El widget tarda un poco más en pintar el botón tras cargar el script
      setTimeout(() => setWidgetReady(true), 800);
    };

    container.appendChild(script);

    return () => {
      scriptInjected.current = false;
      setWidgetReady(false);
      if (container) container.innerHTML = '';
    };
  }, [amountInCents, reference, integritySignature, publicKey, redirectUrl]);

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <div className="text-center space-y-1">
        <p className="text-slate-400 text-sm font-medium">Paga de forma segura con Wompi.</p>
        <p className="text-slate-500 text-xs italic">Acepta tarjetas, PSE y Nequi.</p>
      </div>

      <div className="text-3xl font-black text-white tracking-tighter italic uppercase">
        Total: ${amountCOP.toLocaleString('es-CO')}
      </div>

      {/* Skeleton mientras carga el botón */}
      {!widgetReady && (
        <div className="w-48 h-12 bg-white/10 rounded-xl animate-pulse flex items-center justify-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-white/20 animate-ping" />
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cargando...</span>
        </div>
      )}

      <div
        id="wompi-container"
        className={`min-h-[50px] flex items-center justify-center transition-opacity duration-500 ${
          widgetReady ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}
      />
    </div>
  );
};

export default WompiCheckout;