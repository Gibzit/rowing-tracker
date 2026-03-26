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
    <div className="fixed left-1/2 -translate-x-1/2 z-[55] pointer-events-none" style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}>
      <div
        className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 uppercase tracking-wider"
        style={{
          animation: exiting ? 'toastSlideOut 0.3s ease-in forwards' : 'toastSlideIn 0.3s ease-out',
        }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
