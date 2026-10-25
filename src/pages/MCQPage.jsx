import React, { useState } from 'react';
import mcqData from '../data/mcq.json';
import MCQCard from '../components/MCQCard';

function MCQPage({ quizName = 'Random Quiz', onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalQuestions = mcqData.length;
  const currentMCQ = mcqData[currentIndex];
  const progressPercentage = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    } else {
      alert('Quiz submitted!');
    }
  };

  if (!currentMCQ) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-lg font-medium">
        No questions available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {quizName}
          </h2>
        </div>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          Submit Quiz
        </button>
      </header>


      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">

        <div className="w-full max-w-2xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              QUESTION {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {Math.round(progressPercentage)}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* MCQ Card */}
        <MCQCard
          question={currentMCQ.question}
          options={currentMCQ.options}
          onPrevious={handlePrevious}
          onNext={handleNext}
          isFirst={currentIndex === 0}
          isLast={currentIndex === totalQuestions - 1}
        />
      </main>
    </div>
  );
}

export default MCQPage;
