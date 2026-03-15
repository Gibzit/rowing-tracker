import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

interface ResetButtonProps {
  onReset: () => void;
}

export default function ResetButton({ onReset }: ResetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <div className="px-4 py-6 text-center">
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors touch-manipulation"
        >
          Reset all data
        </button>
      </div>
      {showConfirm && (
        <ConfirmDialog
          message="This will permanently delete ALL your logged sessions, paces, notes, custom workouts, and extra weeks. This cannot be undone."
          requireTypedConfirmation="RESET"
          delaySeconds={3}
          confirmLabel="Reset All Data"
          onConfirm={() => {
            onReset();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
