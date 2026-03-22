import { useState, useCallback } from 'react';

const STORAGE_KEY = 'rowingTrackerAnthropicKey';

function getStoredKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(getStoredKey);

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch { /* quota exceeded */ }
  }, []);

  const clearApiKey = useCallback(() => {
    setApiKeyState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  return { apiKey, setApiKey, clearApiKey, hasApiKey: apiKey !== null && apiKey.length > 0 };
}
