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
        inputMode="text"
        placeholder="m:ss"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError('');
        }}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded-xl text-base min-h-[44px] dark:bg-[#0f2438] dark:text-gray-100 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors ${
          error ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-[#2a4a6b]'
        }`}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
