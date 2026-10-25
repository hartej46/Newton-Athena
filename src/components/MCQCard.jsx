import React from 'react';

function MCQCard({ question, options, onPrevious, onNext, isFirst, isLast }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 text-slate-100 select-none">
      {/* Question & Options Section */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-white leading-relaxed mb-6">
          {question}
        </h3>

        <ul className="space-y-3">
          {options &&
            options.map((option, index) => (
              <li key={index}>
                <label className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 cursor-pointer transition-all duration-150 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-500/10 has-[:checked]:ring-1 has-[:checked]:ring-blue-500">
                  <input
                    type="radio"
                    name="mcq-option"
                    value={option}
                    className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-900 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-sm sm:text-base text-slate-200 font-medium">
                    {option}
                  </span>
                </label>
              </li>
            ))}
        </ul>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          ← Previous
        </button>

        <button
          onClick={onNext}
          disabled={isLast}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] shadow-md shadow-blue-600/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default MCQCard;
