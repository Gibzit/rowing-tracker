import { useState, useRef, useCallback } from 'react';
import type { SessionDescriptor } from '../data/trainingPlan';
import type { ExtractedData } from '../utils/photoCapture';
import { resizeImage, extractDataFromPhoto } from '../utils/photoCapture';

interface PhotoScanButtonProps {
  descriptor: SessionDescriptor;
  onDataExtracted: (data: ExtractedData) => void;
  apiKey: string | null;
  onSetupRequired: () => void;
}

export default function PhotoScanButton({
  descriptor,
  onDataExtracted,
  apiKey,
  onSetupRequired,
}: PhotoScanButtonProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('Analyzing photo...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Two file inputs: camera (with capture) and gallery (without capture)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  // Ref-based guard to prevent concurrent calls (survives re-renders)
  const processingRef = useRef(false);

  const handleCameraClick = useCallback(() => {
    if (!apiKey) {
      onSetupRequired();
      return;
    }
    if (processingRef.current) return;
    cameraInputRef.current?.click();
  }, [apiKey, onSetupRequired]);

  const handleGalleryClick = useCallback(() => {
    if (!apiKey) {
      onSetupRequired();
      return;
    }
    if (processingRef.current) return;
    galleryInputRef.current?.click();
  }, [apiKey, onSetupRequired]);

  const processFile = useCallback(
    async (file: File) => {
      if (!apiKey) return;

      // Guard against concurrent calls (double-tap, multiple onChange events)
      if (processingRef.current) return;
      processingRef.current = true;

      setStatus('processing');
      setStatusMessage('Analyzing photo...');
      setErrorMessage(null);

      try {
        const base64 = await resizeImage(file);
        const data = await extractDataFromPhoto(base64, descriptor, apiKey, (msg) => {
          setStatusMessage(msg);
        });

        // Check if we got any useful data
        const hasData = data.pace || data.totalTime || data.strokeRate || data.intervalPaces;
        if (!hasData) {
          setStatus('error');
          setErrorMessage('No rowing data found in this photo.');
          return;
        }

        onDataExtracted(data);
        setStatus('success');

        // Reset to idle after a brief success flash
        setTimeout(() => setStatus('idle'), 1500);
      } catch (err) {
        setStatus('error');
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setErrorMessage('No internet connection. Enter data manually.');
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Could not process photo. Enter data manually.');
        }
      } finally {
        processingRef.current = false;
      }
    },
    [apiKey, descriptor, onDataExtracted]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset the input so the same file can be re-selected
      e.target.value = '';
      if (!file) return;
      processFile(file);
    },
    [processFile]
  );

  return (
    <div className="mb-1">
      {/* Hidden file inputs — camera forces capture, gallery allows photo library */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Main buttons */}
      {status === 'processing' ? (
        <div className="flex items-center justify-center gap-2.5 w-full min-h-[44px] px-4 py-2.5 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10">
          <div
            className="w-4 h-4 border-2 border-[#00d2ff] border-t-transparent rounded-full animate-spin"
          />
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300" style={{ animation: 'scanPulse 1.5s ease-in-out infinite' }}>
            {statusMessage}
          </span>
        </div>
      ) : status === 'success' ? (
        <div className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
            Data extracted! Review below.
          </span>
        </div>
      ) : !apiKey ? (
        /* No API key — single setup button */
        <button
          onClick={onSetupRequired}
          className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a2640] transition-colors touch-manipulation"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">
            Set up Photo Scan
          </span>
        </button>
      ) : (
        /* API key configured — two buttons: camera + gallery */
        <div className="flex gap-2">
          <button
            onClick={handleCameraClick}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 active:scale-[0.98] transition-colors touch-manipulation"
          >
            {/* Camera icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              Take Photo
            </span>
          </button>
          <button
            onClick={handleGalleryClick}
            className="flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 rounded-lg border-2 border-dashed border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 active:scale-[0.98] transition-colors touch-manipulation"
          >
            {/* Gallery/image icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              Gallery
            </span>
          </button>
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
          <svg className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => { setStatus('idle'); setErrorMessage(null); }}
            className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 shrink-0 touch-manipulation"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
