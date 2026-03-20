import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-[#132940] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-6 py-2.5 min-h-[44px] bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-teal-600/20 touch-manipulation flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
