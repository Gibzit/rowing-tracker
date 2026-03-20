import { useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import type { StoredData } from '../utils/storage';

interface DataManagementProps {
  data: StoredData;
  onImport: (data: StoredData) => void;
}

export default function DataManagement({ data, onImport }: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<StoredData | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rowing-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.version !== 1 || typeof parsed.sessions !== 'object') {
          setError('Invalid backup file format.');
          return;
        }
        setPendingData(parsed as StoredData);
        setShowConfirm(true);
      } catch {
        setError('Could not parse file. Please select a valid JSON backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmImport() {
    if (pendingData) {
      onImport(pendingData);
      setPendingData(null);
    }
    setShowConfirm(false);
  }

  return (
    <>
      <div className="px-4 py-2 flex gap-3 justify-center">
        <button
          onClick={handleExport}
          className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors touch-manipulation"
        >
          Export backup
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-teal-500 dark:hover:text-teal-400 transition-colors touch-manipulation"
        >
          Import backup
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>
      {error && (
        <p className="text-center text-sm text-red-500 dark:text-red-400 px-4 pb-2">{error}</p>
      )}
      {showConfirm && (
        <ConfirmDialog
          message="This will replace ALL your current data with the imported backup. This cannot be undone."
          confirmLabel="Import"
          delaySeconds={2}
          onConfirm={confirmImport}
          onCancel={() => { setShowConfirm(false); setPendingData(null); }}
        />
      )}
    </>
  );
}
