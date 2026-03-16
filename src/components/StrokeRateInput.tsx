interface StrokeRateInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export default function StrokeRateInput({ value, onChange }: StrokeRateInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Stroke Rate (spm)
      </label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="e.g. 24"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const num = parseInt(raw, 10);
          if (!isNaN(num) && num >= 0 && num <= 60) {
            onChange(num);
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#0f2438] dark:text-gray-100 rounded-xl text-base min-h-[44px] focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors"
      />
    </div>
  );
}
