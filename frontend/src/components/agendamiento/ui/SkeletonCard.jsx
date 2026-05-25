import React from 'react';

const SkeletonCard = ({ type, count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-900 border-2 border-gray-800 rounded-xl p-4 ${
            type === 'slot' ? 'h-12' : type === 'empleado' ? 'h-20' : 'h-32'
          }`}
        >
          <div className="flex items-center gap-4 h-full">
            {type === 'empleado' && <div className="w-12 h-12 bg-gray-800 rounded-full" />}
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-gray-800 rounded w-3/4" />
              {type !== 'slot' && <div className="h-2 bg-gray-800 rounded w-1/2" />}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;
