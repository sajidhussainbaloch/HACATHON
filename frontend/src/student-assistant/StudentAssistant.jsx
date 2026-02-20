import React, { useMemo, useState } from 'react';
import {
  askStudentQuestion,
  generateStudyTool,
  uploadStudentNotes,
} from '../services/api';
import {
  downloadFile,
  formatMCQForDownload,
  formatSummaryForDownload,
  formatFlashcardsForDownload,
} from '../utils/downloadHandler';

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

  const [uploadState, setUploadState] = useState({ loading: false, data: null, error: '', progress: 0 });
  const [askState, setAskState] = useState({ loading: false, data: null, error: '' });
  const [generateState, setGenerateState] = useState({ loading: false, data: null, error: '' });

  const selectedModeLabel = useMemo(
    () => MODE_OPTIONS.find((m) => m.value === mode)?.label || mode,
    [mode]
  );

  // Download handlers for different content types
  const handleDownload = (content, filename, format = 'json') => {
    try {
      downloadFile(content, filename, format);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file.');
    }
  };

  const handleDownloadAnswers = () => {
    const content = {
      question: question,
      answer: askState.data?.answer,
      explanation: askState.data?.explanation_simple,
      confidence: askState.data?.confidence,
      sources: askState.data?.sources,
    };
    handleDownload(content, 'student-answer', 'json');
  };

  const handleDownloadMCQs = () => {
    const mcqs = formatMCQForDownload(generateState.data?.data?.mcqs || []);
    handleDownload(mcqs, 'mcqs', 'csv');
  };

  const handleDownloadFlashcards = () => {
    const flashcards = formatFlashcardsForDownload(generateState.data?.data?.flashcards || []);
    handleDownload(flashcards, 'flashcards', 'csv');
  };

  const handleDownloadSummary = () => {
    const summary = formatSummaryForDownload(generateState.data?.data?.summary);
    handleDownload(summary, 'summary', 'txt');
  };

  const handleDownloadKeyConcepts = () => {
    const content = generateState.data?.data?.key_concepts || [];
    handleDownload(content, 'key-concepts', 'json');
  };

  const handleDownloadVivaQuestions = () => {
    const content = generateState.data?.data?.viva_questions || [];
    handleDownload(content, 'viva-questions', 'json');
  };

  const handleDownloadConceptMap = () => {
    const content = generateState.data?.data?.concept_relationships || [];
    handleDownload(content, 'concept-map', 'json');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadState({ loading: true, data: null, error: '', progress: 0 });
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadState((prev) => ({ ...prev, progress: percentComplete }));
        }
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setUploadState({ loading: false, data, error: '', progress: 100 });
              setTimeout(() => setUploadState((prev) => ({ ...prev, progress: 0 })), 1000);
              resolve();
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.detail || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));

        const token = localStorage.getItem(
          `sb-${import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
        );
        
        let authHeader = '';
        if (token) {
          try {
            const parsed = JSON.parse(token);
            authHeader = parsed?.access_token || parsed?.currentSession?.access_token || '';
          } catch { /* ignore */ }
        }

        xhr.open('POST', `${import.meta.env.VITE_API_URL || ''}/student/upload`);
        if (authHeader) {
          xhr.setRequestHeader('Authorization', `Bearer ${authHeader}`);
        }
        xhr.send(formData);
      });
    } catch (err) {
      setUploadState({ loading: false, data: null, error: err.message || 'Upload failed.', progress: 0 });
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
    <main className="student-assistant student-assistant-page max-w-6xl mx-auto py-10 px-4 space-y-6 animate-fade-in-up">
      <div className="student-hero rounded-2xl p-6">
        <h1 className="text-3xl font-bold mb-2">
          AI Student Research Copilot
        </h1>
        <p className="text-sm">
          Grounded RAG assistant for study notes with explainable outputs and structured tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="student-card rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">1) Upload Notes</h2>
          <form className="space-y-3" onSubmit={handleUpload}>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="student-input w-full text-sm rounded-lg p-2"
              disabled={uploadState.loading}
            />
            {uploadState.progress > 0 && uploadState.progress < 100 && (
              <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-lg h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-300 shadow-lg shadow-cyan-500/50"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            )}
            {uploadState.progress > 0 && uploadState.progress < 100 && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Uploading: {uploadState.progress}%
              </p>
            )}
            <button
              type="submit"
              disabled={uploadState.loading || !file}
              className="student-button student-button-primary"
            >
              {uploadState.loading ? `Uploading... ${uploadState.progress}%` : 'Upload & Index'}
            </button>
          </form>
          {uploadState.error && <p className="mt-3 text-sm text-red-500">{uploadState.error}</p>}
          {uploadState.data && (
            <p className="mt-3 text-sm text-green-600">
              Indexed successfully. Chunks created: {uploadState.data.chunks_created}
            </p>
          )}
        </section>

        <section className="student-card rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3">2) Ask Question</h2>
          <form className="space-y-3" onSubmit={handleAsk}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="Ask grounded questions based on uploaded notes..."
              className="student-input w-full rounded-lg p-3 text-sm"
            />
            <button
              type="submit"
              disabled={askState.loading || !question.trim()}
              className="student-button student-button-primary"
            >
              {askState.loading ? 'Answering...' : 'Ask'}
            </button>
          </form>
          {askState.error && <p className="mt-3 text-sm text-red-500">{askState.error}</p>}
        </section>
      </div>

      <section className="student-card rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">3) Generate Study Tools</h2>
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleGenerate}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="student-input rounded-lg p-2 text-sm"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={generateState.loading}
            className="student-button student-button-accent"
          >
            {generateState.loading ? 'Generating...' : `Generate ${selectedModeLabel}`}
          </button>
        </form>
        {generateState.error && <p className="mt-3 text-sm text-red-500">{generateState.error}</p>}
      </section>

      <section className="student-card rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-semibold">4) Output Panel</h2>

        {askState.data && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold">Structured Answer</h3>
              <div className="flex items-center gap-2">
                <ConfidenceBadge value={askState.data.confidence || 0} />
                <button
                  onClick={handleDownloadAnswers}
                  className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
                >
                  ↓ Download
                </button>
              </div>
            </div>
            <div className="student-panel rounded-lg p-4">
              <p className="text-sm mb-3 whitespace-pre-wrap">{askState.data.answer}</p>
              <div className="pt-3 border-t student-divider">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1 student-subtle">
                  Simple Explanation
                </p>
                <p className="text-sm whitespace-pre-wrap">{askState.data.explanation_simple}</p>
              </div>
            </div>

            <details>
              <summary className="cursor-pointer text-sm font-medium">Sources</summary>
              <div className="mt-2 space-y-2">
                {(askState.data.sources || []).map((source) => (
                  <div key={source.chunk_id} className="student-panel rounded-lg p-3 text-sm">
                    <p className="font-semibold mb-1">Chunk {source.chunk_id}</p>
                    <p className="text-xs student-subtle">{source.preview}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {generateState.data?.data?.summary && (
          <div className="student-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Executive Summary</h3>
              <button
                onClick={handleDownloadSummary}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{generateState.data.data.summary}</p>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.flashcards) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Flashcards</h3>
              <button
                onClick={handleDownloadFlashcards}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generateState.data.data.flashcards.map((card, idx) => (
                <div key={`${card.question}-${idx}`} className="student-panel rounded-lg p-4">
                  <p className="text-xs uppercase mb-1 student-subtle">Question</p>
                  <p className="text-sm font-semibold mb-3">{card.question}</p>
                  <p className="text-xs uppercase mb-1 student-subtle">Answer</p>
                  <p className="text-sm">{card.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.mcqs) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">MCQs</h3>
              <button
                onClick={handleDownloadMCQs}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <div className="space-y-3">
              {generateState.data.data.mcqs.map((item, idx) => (
                <div key={`${item.question}-${idx}`} className="student-panel rounded-lg p-4">
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Key Concepts</h3>
              <button
                onClick={handleDownloadKeyConcepts}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <ul className="space-y-2">
              {generateState.data.data.key_concepts.map((item, idx) => (
                <li key={`${item.concept}-${idx}`} className="student-panel rounded-lg p-3 text-sm">
                  <p className="font-semibold">{item.concept}</p>
                  <p>{item.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.viva_questions) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Viva Questions</h3>
              <button
                onClick={handleDownloadVivaQuestions}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <ul className="space-y-2">
              {generateState.data.data.viva_questions.map((item, idx) => (
                <li key={`${item.question}-${idx}`} className="student-panel rounded-lg p-3 text-sm">
                  <p className="font-semibold">{item.question}</p>
                  <p className="mt-1">{item.model_answer}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(generateState.data?.data?.concept_relationships) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Concept Relationships</h3>
              <button
                onClick={handleDownloadConceptMap}
                className="px-3 py-1 text-xs font-semibold bg-cyan-500/20 text-cyan-600 border border-cyan-500/50 rounded hover:bg-cyan-500/30 transition"
              >
                ↓ Download
              </button>
            </div>
            <ul className="space-y-2">
              {generateState.data.data.concept_relationships.map((item, idx) => (
                <li key={`${item.concept_a}-${item.concept_b}-${idx}`} className="student-panel rounded-lg p-3 text-sm">
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
