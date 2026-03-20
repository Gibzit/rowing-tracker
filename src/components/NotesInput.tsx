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
        className="w-full px-3 py-2 border border-gray-200 dark:border-white/[0.08] dark:bg-[#0f1b33] dark:text-[#dae2fd] rounded-lg text-sm min-h-[80px] resize-y focus:ring-2 focus:ring-[#00d2ff]/20 focus:border-[#00d2ff]/40 outline-none transition-colors"
      />
    </div>
  );
}
