interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesInput({ value, onChange }: NotesInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
      <textarea
        placeholder="Session notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#0f2438] dark:text-gray-100 rounded-xl text-base min-h-[80px] resize-y focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors"
      />
    </div>
  );
}
