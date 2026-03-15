import { useState } from 'react';
import { validatePace } from '../utils/paceValidation';

interface PaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function PaceInput({ label, value, onChange }: PaceInputProps) {
  const [error, setError] = useState('');

  const handleBlur = () => {
    const result = validatePace(value);
    setError(result.valid ? '' : result.error || 'Invalid format');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="m:ss"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError('');
        }}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded-lg text-base min-h-[44px] dark:bg-gray-800 dark:text-gray-100 ${
          error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'
        }`}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
