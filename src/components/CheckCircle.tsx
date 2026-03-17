import { useRef, useEffect, useState } from 'react';

interface CheckCircleProps {
  checked: boolean;
  onChange: () => void;
}

export default function CheckCircle({ checked, onChange }: CheckCircleProps) {
  const prevChecked = useRef(checked);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (checked && !prevChecked.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 400);
      return () => clearTimeout(timer);
    }
    prevChecked.current = checked;
  }, [checked]);

  return (
    <label
      className="flex items-center min-w-[44px] min-h-[44px] justify-center shrink-0 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label="Mark session complete"
        className="sr-only"
      />
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        aria-hidden="true"
        style={animating ? { animation: 'checkBounce 0.4s ease-out' } : undefined}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill={checked ? '#16a34a' : 'none'}
          stroke={checked ? '#16a34a' : 'currentColor'}
          strokeWidth="2"
          className={checked ? '' : 'text-gray-300 dark:text-gray-600'}
        />
        {checked && (
          <path
            d="M7 12.5l3 3 7-7"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </label>
  );
}
