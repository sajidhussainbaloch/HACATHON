import React from 'react';

const COLORS = {
  Real: 'var(--color-real)',
  Fake: 'var(--color-fake)',
  Misleading: 'var(--color-misleading)',
};

/**
 * Animated circular confidence indicator with label & percentage.
 */
export default function ConfidenceRing({ label, confidence }) {
  const pct = Math.round(confidence * 100);
  const color = COLORS[label] || '#6366f1';
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence * circumference);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle cx="60" cy="60" r={radius} fill="none"
          stroke="var(--border-color)" strokeWidth="10" />
        {/* Coloured arc */}
        <circle cx="60" cy="60" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="confidence-ring"
          transform="rotate(-90 60 60)" />
        {/* Percentage text */}
        <text x="60" y="56" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="28" fontWeight="bold">
          {pct}%
        </text>
        <text x="60" y="78" textAnchor="middle" dominantBaseline="middle"
          fill="var(--text-secondary)" fontSize="11">
          confidence
        </text>
      </svg>

      {/* Label badge */}
      <span
        className="mt-3 px-5 py-1.5 rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    </div>
  );
}
