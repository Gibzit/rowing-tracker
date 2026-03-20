import PaceInput from './PaceInput';

interface IntervalInputsProps {
  count: number;
  values: string[];
  onChange: (values: string[]) => void;
}

export default function IntervalInputs({ count, values, onChange }: IntervalInputsProps) {
  const handleChange = (index: number, value: string) => {
    const updated = [...values];
    while (updated.length < count) updated.push('');
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Interval Splits</p>
      {Array.from({ length: count }, (_, i) => (
        <PaceInput
          key={i}
          label={`Split ${i + 1}`}
          value={values[i] || ''}
          onChange={(v) => handleChange(i, v)}
        />
      ))}
    </div>
  );
}
