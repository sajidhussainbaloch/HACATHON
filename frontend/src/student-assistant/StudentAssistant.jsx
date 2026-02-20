import React, { useMemo, useState } from 'react';
import {
  askStudentQuestion,
  generateStudyTool,
  uploadStudentNotes,
} from '../services/api';

const MODE_OPTIONS = [
  { value: 'summary', label: 'Executive Summary' },
  { value: 'keypoints', label: 'Key Concepts' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'mcq', label: 'MCQs' },
  { value: 'viva', label: 'Viva Questions' },
  { value: 'concept_map', label: 'Concept Relationships' },
];

function ConfidenceBadge({ value }) {
  const tone = value >= 75 ? '#16a34a' : value >= 45 ? '#ca8a04' : '#dc2626';
  return (
    <span
      className="px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${tone}20`, color: tone, border: `1px solid ${tone}55` }}
    >
      Confidence: {value}%
    </span>
  );
}

export default function StudentAssistant() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('summary');

  const [uploadState, setUploadState] = useState({ loading: false, data: null, error: '' });
  const [askState, setAskState] = useState({ loading: false, data: null, error: '' });
  const [generateState, setGenerateState] = useState({ loading: false, data: null, error: '' });

  const selectedModeLabel = useMemo(
    () => MODE_OPTIONS.find((m) => m.value === mode)?.label || mode,
    [mode]
  );

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadState({ loading: true, data: null, error: '' });
    try {
      const data = await uploadStudentNotes(file);
      setUploadState({ loading: false, data, error: '' });
    } catch (err) {
      setUploadState({ loading: false, data: null, error: err.message || 'Upload failed.' });
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    setAskState({ loading: true, data: null, error: '' });
    try {
      const data = await askStudentQuestion(question.trim());
      setAskState({ loading: false, data, error: '' });
    } catch (err) {
      setAskState({ loading: false, data: null, error: err.message || 'Ask failed.' });
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerateState({ loading: true, data: null, error: '' });
    try {
      const data = await generateStudyTool(mode);
      setGenerateState({ loading: false, data, error: '' });
    } catch (err) {
      setGenerateState({
        loading: false,
        data: null,
        error: err.message || 'Generation failed.',
      });
    }
  };

  return (
    <main className="student-assistant max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fade-in-up">
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          AI Student Research Copilot
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Grounded RAG assistant for study notes with explainable outputs and structured tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3">1) Upload Notes</h2>
          <form className="space-y-3" onSubmit={handleUpload}>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm rounded-lg p-2"
              style={{ border: '1px solid var(--border-color)' }}
            />
            <button
              type="submit"
              disabled={uploadState.loading || !file}
              className="px-4 py-2 rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60"
            >
              {uploadState.loading ? 'Uploading...' : 'Upload & Index'}
            </button>
          </form>
          {uploadState.error && <p className="mt-3 text-sm text-red-500">{uploadState.error}</p>}
          {uploadState.data && (
            <p className="mt-3 text-sm text-green-600">
              Indexed successfully. Chunks created: {uploadState.data.chunks_created}
            </p>
          )}
        </section>

        <section className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-3">2) Ask Question</h2>
          <form className="space-y-3" onSubmit={handleAsk}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Ask grounded questions based on uploaded notes..."
              className="w-full rounded-lg p-3 text-sm"
              style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            />
            <button
              type="submit"
              disabled={askState.loading || !question.trim()}
              className="px-4 py-2 rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60"
            >
              {askState.loading ? 'Answering...' : 'Ask'}
            </button>
          </form>
          {askState.error && <p className="mt-3 text-sm text-red-500">{askState.error}</p>}
        </section>
      </div>

      <section className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold mb-3">3) Generate Study Tools</h2>
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleGenerate}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="rounded-lg p-2 text-sm"
            style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generateState.loading}
            className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {generateState.loading ? 'Generating...' : `Generate ${selectedModeLabel}`}
          </button>
        </form>
        {generateState.error && <p className="mt-3 text-sm text-red-500">{generateState.error}</p>}
      </section>

      <section className="rounded-xl p-5 space-y-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-lg font-semibold">4) Output Panel</h2>

        {askState.data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Structured Answer</h3>
              <ConfidenceBadge value={askState.data.confidence || 0} />
            </div>
            <div className="rounded-lg p-4" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <p className="text-sm mb-3 whitespace-pre-wrap">{askState.data.answer}</p>
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Simple Explanation
                </p>
                <p className="text-sm whitespace-pre-wrap">{askState.data.explanation_simple}</p>
              </div>
            </div>

            <details>
              <summary className="cursor-pointer text-sm font-medium">Sources</summary>
              <div className="mt-2 space-y-2">
                {(askState.data.sources || []).map((source) => (
                  <div
                    key={source.chunk_id}
                    className="rounded-lg p-3 text-sm"
                    style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <p className="font-semibold mb-1">Chunk {source.chunk_id}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{source.preview}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {generateState.data?.data?.summary && (
          <div className="rounded-lg p-4" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <h3 className="font-semibold mb-2">Executive Summary</h3>
            <p className="text-sm whitespace-pre-wrap">{generateState.data.data.summary}</p>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.flashcards) && (
          <div>
            <h3 className="font-semibold mb-2">Flashcards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generateState.data.data.flashcards.map((card, idx) => (
                <div
                  key={`${card.question}-${idx}`}
                  className="rounded-lg p-4"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <p className="text-xs uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Question</p>
                  <p className="text-sm font-semibold mb-3">{card.question}</p>
                  <p className="text-xs uppercase mb-1" style={{ color: 'var(--text-secondary)' }}>Answer</p>
                  <p className="text-sm">{card.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.mcqs) && (
          <div>
            <h3 className="font-semibold mb-2">MCQs</h3>
            <div className="space-y-3">
              {generateState.data.data.mcqs.map((item, idx) => (
                <div
                  key={`${item.question}-${idx}`}
                  className="rounded-lg p-4"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <p className="font-semibold mb-2">{idx + 1}. {item.question}</p>
                  <ul className="text-sm space-y-1">
                    <li>A. {item.options?.A}</li>
                    <li>B. {item.options?.B}</li>
                    <li>C. {item.options?.C}</li>
                    <li>D. {item.options?.D}</li>
                  </ul>
                  <p className="mt-2 text-sm"><strong>Correct:</strong> {item.correct}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.key_concepts) && (
          <div>
            <h3 className="font-semibold mb-2">Key Concepts</h3>
            <ul className="space-y-2">
              {generateState.data.data.key_concepts.map((item, idx) => (
                <li
                  key={`${item.concept}-${idx}`}
                  className="rounded-lg p-3 text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <p className="font-semibold">{item.concept}</p>
                  <p>{item.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.viva_questions) && (
          <div>
            <h3 className="font-semibold mb-2">Viva Questions</h3>
            <ul className="space-y-2">
              {generateState.data.data.viva_questions.map((item, idx) => (
                <li
                  key={`${item.question}-${idx}`}
                  className="rounded-lg p-3 text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <p className="font-semibold">{item.question}</p>
                  <p className="mt-1">{item.model_answer}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.concept_relationships) && (
          <div>
            <h3 className="font-semibold mb-2">Concept Relationships</h3>
            <ul className="space-y-2">
              {generateState.data.data.concept_relationships.map((item, idx) => (
                <li
                  key={`${item.concept_a}-${item.concept_b}-${idx}`}
                  className="rounded-lg p-3 text-sm"
                  style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <p className="font-semibold">
                    {`${item.concept_a} -> ${item.relation} -> ${item.concept_b}`}
                  </p>
                  <p className="mt-1">{item.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
