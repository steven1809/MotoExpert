import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PaymentConfirmation = ({ onExit }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);

  // Obtener parámetros de la URL manualmente ya que no hay Router
  const getQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      id: params.get('id'),
      status: params.get('status'),
      reference: params.get('reference')
    };
  };

  const { id: transactionId } = getQueryParams();

  useEffect(() => {
    if (transactionId) {
      verifyTransaction();
    } else {
      setLoading(false);
      setStatus('ERROR');
    }
  }, [transactionId]);

  const verifyTransaction = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/wompi/verify/${transactionId}`);
      const data = await response.json();
      
      setStatus(data.status);
      setAppointmentId(data.appointmentId);

      // Limpiar sessionStorage si el pago fue exitoso
      if (data.status === 'APPROVED') {
        sessionStorage.removeItem('pendingBooking');
      }
    } catch (error) {
      console.error('Error verificando transacción:', error);
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    // Limpiar cualquier reserva pendiente al salir de la confirmación
    sessionStorage.removeItem('pendingBooking');
    if (typeof onExit === 'function') {
      onExit();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-[#1a1d2e] rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white font-bold uppercase tracking-widest text-sm">Verificando pago...</p>
          </div>
        ) : (
          <>
            {status === 'APPROVED' ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">¡Pago Exitoso!</h2>
                  <p className="text-slate-400 text-sm">Tu cita #{appointmentId} ha sido confirmada y pagada correctamente.</p>
                </div>
                <button 
                  onClick={handleExit}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                >
                  Ver mis citas
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Pago Fallido</h2>
                  <p className="text-slate-400 text-sm">
                    {status === 'DECLINED' ? 'La transacción fue declinada por la entidad financiera.' : 'Hubo un error al procesar tu pago.'}
                  </p>
                </div>
                <button 
                  onClick={handleExit}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmation;
