import React, { useState } from 'react';
import mcqData from '../data/mcq.json';
import MCQCard from '../components/MCQCard';

function MCQPage({ quizName = 'Greedy Algorithms - Revision', onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});

  const totalQuestions = mcqData.length;
  const currentMCQ = mcqData[currentIndex];

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

  const handleSelectOption = (option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const handleClearSelection = () => {
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentIndex];
      return updated;
    });
  };

  const handleToggleMark = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
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
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-lg font-medium">
        No questions available.
      </div>
    );
  }

  const isMarked = Boolean(markedForReview[currentIndex]);
  const currentSelectedOption = selectedAnswers[currentIndex];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans select-none">
      {/* 1. Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          {quizName}
        </h2>

        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
        >
          Submit Quiz
        </button>
      </header>

      {/* 2. Main Question Container */}
      <main className="flex-1 flex flex-col justify-start max-w-4xl w-full mx-auto px-6 pt-10 pb-24">
        {/* Subheader: Question index + Actions */}
        <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100">
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500">
            QUESTION {currentIndex + 1}/{totalQuestions}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleMark}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                isMarked
                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                  : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
              }`}
            >
              {isMarked ? 'Marked for review' : 'Mark for review'}
            </button>

            <button
              onClick={handleClearSelection}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer"
            >
              Clear Selection
            </button>

            <button
              title="Report issue"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Question + Options Card */}
        <div className="pt-6">
          <MCQCard
            question={currentMCQ.question}
            options={currentMCQ.options}
            selectedOption={currentSelectedOption}
            onSelectOption={handleSelectOption}
          />
        </div>
      </main>

      {/* 3. Bottom Navigation Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3.5 px-8 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          {/* Grid Overview Icon Button */}
          <div className="flex items-center justify-center">
            <button
              title="Overview grid"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === totalQuestions - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-slate-600 text-white hover:bg-slate-700 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          >
            <span>Next</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default MCQPage;
