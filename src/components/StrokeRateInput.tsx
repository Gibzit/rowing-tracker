import { useState } from 'react';

interface StrokeRateInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export default function StrokeRateInput({ value, onChange }: StrokeRateInputProps) {
  const [error, setError] = useState('');

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
        Stroke Rate (spm)
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g., 24"
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(undefined);
              setError('');
              return;
            }
            const num = parseInt(raw, 10);
            if (isNaN(num)) {
              setError('Enter a number');
              return;
            }
            if (num < 0 || num > 60) {
              setError('Range: 0-60 spm');
              return;
            }
            onChange(num);
            setError('');
          }}
          className={`w-full px-3 py-2 pr-9 border rounded-lg text-base min-h-[44px] dark:bg-[#0C1926] dark:text-gray-100 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-colors ${
            error
              ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-[#224058]'
          }`}
        />
        {value !== undefined && !error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </span>
        )}
        {error && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 font-medium">{error}</p>}
      {!error && value === undefined && (
        <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5 font-mono">typical: 18-36 spm</p>
      )}
    </div>
  );
}
