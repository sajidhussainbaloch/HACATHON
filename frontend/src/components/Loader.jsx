import React from 'react';

/**
 * Animated loading spinner (3-dot pulse).
 */
export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in-up">
      <div className="pulse-loader mb-4">
        <span></span><span></span><span></span>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        Analyzing content — this may take a few seconds…
      </p>
    </div>
  );
}
