import { useState, useEffect } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: (
      <svg className="w-14 h-14 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h4l3-9 6 18 3-9h4" />
      </svg>
    ),
    title: "Welcome to Rowing Tracker",
    body: 'A 24-week structured rowing program designed to build endurance and improve pace, one session at a time.',
  },
  {
    icon: (
      <svg className="w-14 h-14 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-8 4 4 4-8" />
      </svg>
    ),
    title: 'Track your progress',
    body: 'Log pace, time, and notes after each session. Track personal bests, view trend charts, and see your activity on the calendar.',
  },
  {
    icon: (
      <svg className="w-14 h-14 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Ready to row',
    body: 'Tap a session card to expand it and log your data. Complete all 3 core sessions each week to progress. Optional sessions give bonus credit!',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isLast = currentSlide === slides.length - 1;

  const slide = slides[currentSlide];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onComplete]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome onboarding" className="fixed inset-0 z-[70] flex items-center justify-center bg-[#06101A]/98 backdrop-blur-md p-6">
      <div className="max-w-sm w-full text-center">
        {!isLast && (
          <button
            onClick={onComplete}
            className="absolute top-6 right-6 text-[11px] font-bold text-gray-500 hover:text-gray-300 transition-colors touch-manipulation uppercase tracking-[0.12em]"
          >
            Skip
          </button>
        )}

        <div key={currentSlide} style={{ animation: 'viewFadeIn 0.3s ease-out' }}>
          <div className="flex justify-center mb-8">{slide.icon}</div>
          <h2 className="text-xl font-extrabold text-gray-100 mb-3 uppercase tracking-wide">{slide.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-8">{slide.body}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentSlide
                  ? 'bg-teal-400 w-6'
                  : 'bg-gray-600 hover:bg-gray-500 w-2'
              }`}
            />
          ))}
        </div>

        <button
          onClick={isLast ? onComplete : () => setCurrentSlide((s) => s + 1)}
          className="min-h-[44px] px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition-colors touch-manipulation shadow-lg shadow-teal-900/30 uppercase tracking-wide text-sm"
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}
