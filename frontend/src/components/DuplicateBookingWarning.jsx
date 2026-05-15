import React from 'react';

const DuplicateBookingWarning = ({ existingBooking, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-[#2a2d3a] p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[rgba(186,117,23,0.1)] border border-[rgba(186,117,23,0.35)]">
            <svg className="w-10 h-10 text-[#BA7517]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-[#F8FAFC] italic uppercase tracking-tighter">
              You already have this service booked
            </h2>
          </div>

          {/* Existing Booking Info Card */}
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Service:</span>
              <span className="text-[#F8FAFC] text-sm font-bold">{existingBooking.servicio?.nombre || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Vehicle:</span>
              <span className="text-[#F8FAFC] text-sm font-bold">{existingBooking.vehiculo?.placa || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Date:</span>
              <span className="text-[#F8FAFC] text-sm font-bold">{new Date(existingBooking.fecha).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider">Time:</span>
              <span className="text-[#F8FAFC] text-sm font-bold">{existingBooking.hora_inicio.substring(0, 5)}</span>
            </div>
          </div>

          <p className="text-[#94A3B8] text-sm font-medium italic leading-relaxed">
            You are about to book the same service for this vehicle on the same day at a different time. Are you sure you want to proceed?
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onConfirm}
              className="w-full px-8 py-4 bg-[#BA7517] hover:bg-[#A06514] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-[#BA7517]/20 transition-all active:scale-95"
            >
              Yes, book anyway
            </button>
            <button
              onClick={onCancel}
              className="w-full px-8 py-4 bg-[#2a2d3a] hover:bg-[#3a3d4a] text-[#94A3B8] font-black text-xs uppercase tracking-[0.2em] rounded-2xl border border-[#2a2d3a] transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateBookingWarning;
