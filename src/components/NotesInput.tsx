interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesInput({ value, onChange }: NotesInputProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">Notes</label>
      <textarea
        placeholder="Session notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 dark:border-[#224058] dark:bg-[#0C1926] dark:text-gray-100 rounded-lg text-sm min-h-[80px] resize-y focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-colors"
      />
    </div>
  );
}
