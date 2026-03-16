import { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  requireTypedConfirmation?: string;
  delaySeconds?: number;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  requireTypedConfirmation,
  delaySeconds,
  confirmLabel = 'Reset',
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');
  const [countdown, setCountdown] = useState(delaySeconds ?? 0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const textMatches = !requireTypedConfirmation || typedText === requireTypedConfirmation;
  const delayPassed = countdown <= 0;
  const canConfirm = textMatches && delayPassed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#0f2438] rounded-2xl p-6 max-w-sm w-full shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-800 dark:text-gray-200 text-base mb-4">{message}</p>

        {requireTypedConfirmation && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Type "{requireTypedConfirmation}" to confirm
            </label>
            <input
              type="text"
              autoComplete="off"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#1a3550] dark:text-gray-100 rounded-xl text-base min-h-[44px] font-mono tracking-wider focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 dark:border-[#2a4a6b] rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#1a3550] transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
              canConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 dark:bg-[#1e3a5f] text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {!delayPassed ? `Wait (${countdown}s)...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
