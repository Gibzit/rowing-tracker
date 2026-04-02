import { useState, useEffect } from 'react';

interface AddWorkoutFormProps {
  onSave: (label: string, description: string) => void;
  onCancel: () => void;
}

export default function AddWorkoutForm({ onSave, onCancel }: AddWorkoutFormProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  const canSave = label.trim().length > 0;

  // ESC key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ animation: 'backdropFadeIn 0.2s ease-out' }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add custom workout"
        className="bg-white dark:bg-[#1a2640] rounded-2xl p-6 max-w-sm w-full shadow-2xl ring-1 ring-white/[0.06]"
        style={{ animation: 'dialogPopIn 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-extrabold text-gray-800 dark:text-[#dae2fd] mb-4 uppercase tracking-wide">
          Add Custom Workout
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Workout Name *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 6000m, 4 x 1000m"
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-base min-h-[44px] font-mono focus:ring-2 focus:ring-[#00d2ff]/40 focus:border-[#00d2ff]/40 outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about the workout..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-base min-h-[80px] resize-y focus:ring-2 focus:ring-[#00d2ff]/40 focus:border-[#00d2ff]/40 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-[#222a3d] transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(label.trim(), description.trim())}
            disabled={!canSave}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors touch-manipulation ${
              canSave
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-300 dark:bg-[#1A3350] text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Workout
          </button>
        </div>
      </div>
    </div>
  );
}
