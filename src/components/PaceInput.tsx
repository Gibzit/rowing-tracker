import { useState, forwardRef } from 'react';
import { validatePace } from '../utils/paceValidation';

interface PaceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const PaceInput = forwardRef<HTMLInputElement, PaceInputProps>(function PaceInput({ label, value, onChange }, ref) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (touched && newValue) {
      const result = validatePace(newValue);
      setError(result.valid ? '' : 'Use format m:ss (e.g., 2:15)');
    } else {
      setError('');
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (value) {
      const result = validatePace(value);
      setError(result.valid ? '' : 'Use format m:ss (e.g., 2:15)');
    } else {
      setError('');
    }
  };

  const isValid = touched && value && !error;

  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="text"
          placeholder="m:ss (e.g., 2:15)"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 pr-9 border rounded-lg text-base min-h-[44px] dark:bg-[#0f1b33] dark:text-[#dae2fd] focus:ring-2 focus:ring-[#00d2ff]/20 focus:border-[#00d2ff]/40 outline-none transition-colors ${
            error
              ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-white/[0.08]'
          }`}
        />
        {isValid && (
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
      {!error && !value && (
        <p className="text-gray-400 dark:text-[#5a6580] text-[10px] mt-0.5 font-mono">minutes:seconds per 500m</p>
      )}
    </div>
  );
});

export default PaceInput;
