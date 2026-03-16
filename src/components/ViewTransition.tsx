import { useRef, useEffect, type ReactNode } from 'react';

interface ViewTransitionProps {
  viewKey: string;
  children: ReactNode;
}

export default function ViewTransition({ viewKey, children }: ViewTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animation = 'none';
    // Force reflow
    void el.offsetHeight;
    el.style.animation = '';
  }, [viewKey]);

  return (
    <div
      ref={ref}
      key={viewKey}
      style={{ animation: 'viewFadeIn 0.25s ease-out' }}
    >
      {children}
    </div>
  );
}
