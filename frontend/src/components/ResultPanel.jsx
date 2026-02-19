import React from 'react';
import ConfidenceRing from './ConfidenceRing';
import EvidenceCard from './EvidenceCard';
import { downloadPdfReport } from '../utils/pdf';

/**
 * Copy text to clipboard.
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/**
 * Full result panel — displayed after analysis completes.
 */
export default function ResultPanel({ data }) {
  const summaryText = [
    `Label: ${data.label}`,
    `Confidence: ${Math.round(data.confidence * 100)}%`,
    `Summary: ${data.reasoning_summary}`,
    `\nDetailed Explanation:\n${data.detailed_explanation}`,
    data.key_inconsistencies?.length
      ? `\nKey Inconsistencies:\n${data.key_inconsistencies.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
      : '',
    `\nEvidence Alignment:\n${data.evidence_alignment}`,
  ].join('\n');

  return (
    <div className="w-full max-w-3xl mx-auto px-4 space-y-8 animate-fade-in-up">
      {/* CONFIDENCE RING */}
      <div className="flex justify-center">
        <ConfidenceRing label={data.label} confidence={data.confidence} />
      </div>

      {/* SUMMARY */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Summary
        </h3>
        <p style={{ color: 'var(--text-primary)' }}>{data.reasoning_summary}</p>
      </div>

      {/* DETAILED EXPLANATION */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Detailed Explanation
        </h3>
        <p style={{ color: 'var(--text-primary)' }}>{data.detailed_explanation}</p>
      </div>

      {/* KEY INCONSISTENCIES */}
      {data.key_inconsistencies?.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Key Inconsistencies
          </h3>
          <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--text-primary)' }}>
            {data.key_inconsistencies.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* EVIDENCE ALIGNMENT */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Evidence Alignment
        </h3>
        <p style={{ color: 'var(--text-primary)' }}>{data.evidence_alignment}</p>
      </div>

      {/* RETRIEVED ARTICLES */}
      {data.retrieved_articles?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Retrieved Evidence ({data.retrieved_articles.length})
          </h3>
          <div className="space-y-3">
            {data.retrieved_articles.map((art, i) => (
              <EvidenceCard key={i} article={art} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3 justify-center pb-12">
        <button
          onClick={() => copyToClipboard(summaryText)}
          className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-indigo-500/10"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          📋 Copy to Clipboard
        </button>
        <button
          onClick={() => downloadPdfReport(data)}
          className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-indigo-500/10"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          📄 Download PDF Report
        </button>
      </div>
    </div>
  );
}
