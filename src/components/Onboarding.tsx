import { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: '🚣',
    title: "Welcome to Ido's Rowing Tracker!",
    body: 'A 24-week structured rowing program designed to build your endurance and improve your pace, one session at a time.',
  },
  {
    icon: '📊',
    title: 'Track your progress',
    body: 'Log your pace, time, and notes after each session. Track personal bests, view charts, and see your progress on the activity calendar.',
  },
  {
    icon: '🎯',
    title: 'Ready to row',
    body: 'Tap a session card to expand it and log your data. Complete all 3 core sessions each week to progress. Optional sessions give bonus credit!',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLast = currentSlide === slides.length - 1;

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0c1929]/95 backdrop-blur-md p-6">
      <div className="max-w-sm w-full text-center">
        {!isLast && (
          <button
            onClick={onComplete}
            className="absolute top-6 right-6 text-sm text-gray-400 hover:text-gray-200 transition-colors touch-manipulation"
          >
            Skip
          </button>
        )}

        <div key={currentSlide} style={{ animation: 'viewFadeIn 0.3s ease-out' }}>
          <div className="text-6xl mb-6">{slide.icon}</div>
          <h2 className="text-xl font-bold text-gray-100 mb-3">{slide.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">{slide.body}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === currentSlide
                  ? 'bg-teal-400 w-6'
                  : 'bg-gray-600 hover:bg-gray-500 w-2'
              }`}
            />
          ))}
        </div>

        <button
          onClick={isLast ? onComplete : () => setCurrentSlide((s) => s + 1)}
          className="min-h-[44px] px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors touch-manipulation shadow-lg shadow-teal-900/30"
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
