import React, { useState } from 'react';

const WompiCheckout = ({
  appointmentId,
  amountCOP,
  publicKey,
  integritySignature,
  reference,
  redirectUrl,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('[WompiCheckout.js] props:', {
    appointmentId,
    amountCOP,
    publicKey,
    integritySignature,
    reference,
    redirectUrl,
  });

  const handlePay = () => {
    // 1. Validaciones previas de seguridad locales
    if (!publicKey) {
      setError('Error: clave pública de Wompi inválida');
      return;
    }
    if (!integritySignature) {
      setError('Error: firma de integridad no generada');
      return;
    }
    if (!amountCOP || amountCOP <= 0) {
      setError('Error: monto inválido');
      return;
    }

    // 2. Verificar que el script cargó correctamente desde el index.html
    if (!window.WidgetCheckout) {
      setError('El script de Wompi no se ha cargado. Por favor, recarga la página.');
      return;
    }

    setError(null);
    setLoading(true);

    // 3. Limpiar cualquier espacio extraño de la clave pública
    const cleanPublicKey = publicKey.trim();

    // 4. Inicializar la pasarela oficial flotante de Wompi
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: Math.round(amountCOP * 100), // Convierte el total a centavos de forma segura
      reference: reference,
      publicKey: cleanPublicKey,
      signature: integritySignature,
      redirectUrl: redirectUrl || `${window.location.origin}/appointments/payment-confirmation`,
    });

    // 5. Abrir el modal interactivo en pantalla
    checkout.open((result) => {
      setLoading(false);
      const transaction = result.transaction;
      console.log('[Wompi Widget] Transacción finalizada:', transaction);
    });
  };

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      <div className="text-center space-y-1">
        <p className="text-slate-400 text-sm font-medium">
          Paga de forma segura con Wompi.
        </p>
        <p className="text-slate-500 text-xs italic">
          Acepta tarjetas, PSE y Nequi.
        </p>
      </div>

      <div className="text-3xl font-black text-white tracking-tighter italic uppercase">
        Total: ${amountCOP.toLocaleString('es-CO')}
      </div>

      {error && (
        <div className="w-full p-4 rounded-2xl border border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A] text-sm font-bold text-center">
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !integritySignature}
        className="w-full max-w-xs bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-2xl shadow-[#2563EB]/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirigiendo a Wompi...' : '💳 Pagar con Wompi'}
      </button>

      {!integritySignature && (
        <p className="text-gray-400 text-xs text-center">
          Preparando pasarela de pago...
        </p>
      )}
    </div>
  );
};

export default WompiCheckout;
