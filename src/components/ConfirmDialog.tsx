import { useState, useEffect, useRef } from 'react';

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
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus cancel button on mount (safe default)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const textMatches = !requireTypedConfirmation || typedText === requireTypedConfirmation;
  const delayPassed = countdown <= 0;
  const canConfirm = textMatches && delayPassed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ animation: 'backdropFadeIn 0.25s ease-out' }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirmation dialog"
        aria-describedby="confirm-dialog-message"
        className="bg-white dark:bg-[#1a2640] rounded-2xl p-6 max-w-sm w-full shadow-2xl ring-1 ring-white/[0.06]"
        style={{ animation: 'dialogPopIn 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-dialog-message" className="text-gray-800 dark:text-gray-200 text-sm mb-4">{message}</p>

        {requireTypedConfirmation && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Type &ldquo;{requireTypedConfirmation}&rdquo; to confirm
            </label>
            <input
              type="text"
              autoComplete="off"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={requireTypedConfirmation}
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-base min-h-[44px] font-mono tracking-wider focus:ring-2 focus:ring-[#00d2ff]/30 focus:border-[#00d2ff]/40 outline-none transition-colors"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-[#222a3d] transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={canConfirm ? onConfirm : undefined}
            disabled={!canConfirm}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors touch-manipulation ${
              canConfirm
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 dark:bg-[#1A3350] text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {!delayPassed ? `Wait (${countdown}s)...` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
