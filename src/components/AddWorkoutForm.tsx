import { useState } from 'react';

interface AddWorkoutFormProps {
  onSave: (label: string, description: string) => void;
  onCancel: () => void;
}

export default function AddWorkoutForm({ onSave, onCancel }: AddWorkoutFormProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  const canSave = label.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Add Custom Workout
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workout Name *
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. 6000m, 4 x 1000m"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-base min-h-[44px]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about the workout..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-base min-h-[80px] resize-y"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onSave(label.trim(), description.trim())}
            disabled={!canSave}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation ${
              canSave
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Workout
          </button>
        </div>
      </div>
    </div>
  );
}
