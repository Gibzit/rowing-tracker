import { useState, useEffect, useRef } from 'react';
import { validateApiKey } from '../utils/photoCapture';

interface ApiKeySettingsProps {
  currentKey: string | null;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function ApiKeySettings({ currentKey, onSave, onClear, onClose }: ApiKeySettingsProps) {
  const [inputValue, setInputValue] = useState(currentKey || '');
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleTest = async () => {
    if (!inputValue.trim()) return;
    setStatus('testing');
    const isValid = await validateApiKey(inputValue.trim());
    setStatus(isValid ? 'valid' : 'invalid');
  };

  const handleSave = () => {
    if (status === 'valid') {
      onSave(inputValue.trim());
      onClose();
    }
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      style={{ animation: 'backdropFadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Photo Scan Setup"
        className="bg-white dark:bg-[#0f2438] rounded-2xl p-6 max-w-sm w-full shadow-2xl ring-1 ring-white/10"
        style={{ animation: 'dialogPopIn 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Photo Scan Setup</h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter your Anthropic API key to enable automatic data extraction from rowing machine photos.
          Your key is stored only on this device and never sent to any server besides Anthropic.
        </p>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setStatus('idle');
            }}
            placeholder="sk-ant-..."
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a4a6b] dark:bg-[#1a3550] dark:text-gray-100 rounded-xl text-base min-h-[44px] font-mono text-sm focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-colors"
          />
        </div>

        {/* Status messages */}
        {status === 'testing' && (
          <div className="flex items-center gap-2 mb-3 text-sm text-teal-600 dark:text-teal-400">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Testing key...
          </div>
        )}
        {status === 'valid' && (
          <div className="flex items-center gap-2 mb-3 text-sm text-green-600 dark:text-green-400 font-medium">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Key is valid! You can save now.
          </div>
        )}
        {status === 'invalid' && (
          <div className="flex items-center gap-2 mb-3 text-sm text-red-600 dark:text-red-400 font-medium">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Invalid key. Please check and try again.
          </div>
        )}

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline mb-4"
        >
          Get an API key at console.anthropic.com
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>

        <div className="flex gap-2">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 dark:border-[#2a4a6b] rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-[#1a3550] transition-colors touch-manipulation text-sm"
          >
            Cancel
          </button>

          {currentKey && (
            <button
              onClick={handleClear}
              className="min-h-[44px] px-4 py-2 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors touch-manipulation text-sm"
            >
              Clear
            </button>
          )}

          {status !== 'valid' ? (
            <button
              onClick={handleTest}
              disabled={!inputValue.trim() || status === 'testing'}
              className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl font-medium transition-colors touch-manipulation text-sm ${
                inputValue.trim() && status !== 'testing'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-gray-200 dark:bg-[#1a3550] text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Test Key
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white transition-colors touch-manipulation text-sm"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
