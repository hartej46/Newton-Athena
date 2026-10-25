import React from 'react';

function MCQCard({ question, options, selectedOption, onSelectOption }) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="w-full max-w-4xl mx-auto text-slate-800">
      {/* Question */}
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug mb-6">
        {question}
      </h3>

      {/* Options List */}
      <div className="space-y-3">
        {options &&
          options.map((option, index) => {
            const isSelected = selectedOption === option;
            const letter = letters[index] || String.fromCharCode(65 + index);

            return (
              <label
                key={index}
                onClick={() => onSelectOption && onSelectOption(option)}
                className={`flex items-center gap-4 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-xs sm:text-sm font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-sm sm:text-base text-slate-700 font-medium select-none">
                  {option}
                </span>
              </label>
            );
          })}
      </div>
    </div>
  );
}

export default MCQCard;
