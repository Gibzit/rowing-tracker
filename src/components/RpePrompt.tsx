import { useState, useEffect, useRef, useCallback } from 'react';

interface RpePromptProps {
  onSelect: (rpe: number) => void;
  onDismiss: () => void;
}

function rpeColor(rpe: number): string {
  if (rpe <= 3) return 'bg-green-500 dark:bg-green-500';
  if (rpe <= 6) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-red-500 dark:bg-red-500';
}

function rpeTextColor(rpe: number): string {
  if (rpe <= 3) return 'text-green-700 dark:text-green-400';
  if (rpe <= 6) return 'text-amber-700 dark:text-amber-400';
  return 'text-red-700 dark:text-red-400';
}

export default function RpePrompt({ onSelect, onDismiss }: RpePromptProps) {
  const [exiting, setExiting] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true);
    }, 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Handle outside clicks/taps
  useEffect(() => {
    const handleClick = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExiting(true);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    if (exiting) onDismiss();
  }, [exiting, onDismiss]);

  const selectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Clean up select timer on unmount
  useEffect(() => {
    return () => { if (selectTimerRef.current) clearTimeout(selectTimerRef.current); };
  }, []);

  const handleSelect = useCallback(
    (rpe: number) => {
      setSelected(rpe);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Brief highlight, then save and exit
      selectTimerRef.current = setTimeout(() => {
        onSelect(rpe);
      }, 200);
    },
    [onSelect]
  );

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      className="mx-5 mb-4 p-4 rounded-2xl bg-white dark:bg-[#0f1b33] border border-gray-100 dark:border-white/[0.06]"
      style={{
        animation: exiting
          ? 'slideUp 0.2s ease-in forwards'
          : 'slideDown 0.25s ease-out',
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider text-center">
        How hard was that?
      </p>
      <div className="flex justify-between items-center gap-1">
        <span className="text-[9px] text-gray-400 dark:text-[#5a6580] font-bold uppercase w-8 text-center shrink-0">Easy</span>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((rpe) => {
          const isSelected = selected === rpe;
          return (
            <button
              key={rpe}
              type="button"
              onClick={() => handleSelect(rpe)}
              className="min-w-[44px] min-h-[44px] -mx-[3px] flex items-center justify-center touch-manipulation"
              aria-label={`RPE ${rpe}`}
            >
              <span className={`
                w-7 h-7 rounded-full text-[10px] font-bold
                flex items-center justify-center
                transition-all duration-150
                ${
                  isSelected
                    ? `${rpeColor(rpe)} text-white scale-125`
                    : `bg-gray-100 dark:bg-[#1a2640] ${rpeTextColor(rpe)}`
                }
              `}>
                {rpe}
              </span>
            </button>
          );
        })}
        <span className="text-[9px] text-gray-400 dark:text-[#5a6580] font-bold uppercase w-8 text-center shrink-0">Max</span>
      </div>
    </div>
  );
}
