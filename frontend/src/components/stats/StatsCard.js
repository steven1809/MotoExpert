import React from 'react';

const StatsCard = ({ title, value, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 ${onClick ? 'cursor-pointer hover:bg-slate-700/50 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-50">{value}</p>
        </div>
        {icon && <div className="text-2xl text-slate-400">{icon}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
