import React from 'react';

const StatsCard = ({ title, value, icon, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-600/20 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-600/20 border-purple-500/30 text-purple-400',
    green: 'bg-green-600/20 border-green-500/30 text-green-400',
    red: 'bg-red-600/20 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-600/20 border-yellow-500/30 text-yellow-400',
    cyan: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-2xl border bg-gray-800/50 ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:bg-gray-700/50 transition-all' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl opacity-80">{icon}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
