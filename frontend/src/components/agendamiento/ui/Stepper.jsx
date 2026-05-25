import React from 'react';

const Stepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-between mb-8 w-full">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : isCompleted
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-gray-900 border-gray-700 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="font-bold">{stepNumber}</span>
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider mt-2 font-semibold ${
                  isActive ? 'text-blue-400' : 'text-gray-500'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-4 -mt-6 transition-all duration-500 ${
                  isCompleted ? 'bg-blue-500' : 'bg-gray-800'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
