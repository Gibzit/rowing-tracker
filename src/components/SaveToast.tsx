import { useEffect, useState } from 'react';

interface SaveToastProps {
  message: string;
  onDone: () => void;
}

export default function SaveToast({ message, onDone }: SaveToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1500);
    const removeTimer = setTimeout(onDone, 1900);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onDone]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] pointer-events-none">
      <div
        className="bg-green-600 dark:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-green-600/30 flex items-center gap-2"
        style={{
          animation: exiting ? 'toastSlideOut 0.3s ease-in forwards' : 'toastSlideIn 0.3s ease-out',
        }}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </div>
    </div>
  );
}
