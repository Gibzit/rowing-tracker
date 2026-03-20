import { useEffect, useState } from 'react';

interface PBCelebrationProps {
  label: string;
  pace: string;
  onDone: () => void;
}

export default function PBCelebration({ label, pace, onDone }: PBCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
      <div
        className="bg-white dark:bg-[#0C1926] rounded-2xl p-6 shadow-2xl ring-1 ring-teal-500/20 text-center animate-[pbPop_0.4s_ease-out]"
        style={{ maxWidth: 280 }}
      >
        <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1 uppercase tracking-[0.12em]">New Personal Best</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-mono font-extrabold text-gray-900 dark:text-gray-100">{pace}<span className="text-sm font-normal text-gray-400">/500m</span></p>
      </div>
    </div>
  );
}
