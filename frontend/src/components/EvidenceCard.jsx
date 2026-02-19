import React, { useState } from 'react';

/**
 * An expandable card showing evidence article info.
 */
export default function EvidenceCard({ article, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl p-4 transition-colors cursor-pointer"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">
            {index + 1}
          </span>
          <div>
            <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {article.title}
            </h4>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {article.source}
              {article.similarity_score != null &&
                <> · Similarity: {Math.round(article.similarity_score * 100)}%</>}
            </p>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color: 'var(--text-secondary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="mt-3 pl-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {article.url}
          </a>
        </div>
      )}
    </div>
  );
}
