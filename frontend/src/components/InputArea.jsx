import React, { useRef, useState, useCallback } from 'react';

const MAX_CHARS = 5000;

/**
 * Input area: textarea + drag-and-drop image upload + submit.
 */
export default function InputArea({ onSubmit, loading }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((f) => {
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setText('');
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const handleSubmit = () => {
    if (loading) return;
    onSubmit({ text: file ? '' : text, file });
  };

  const clearFile = () => { setFile(null); fileRef.current && (fileRef.current.value = ''); };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
      {/* Textarea */}
      {!file && (
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Paste a news article or claim here…"
            rows={6}
            className="w-full rounded-xl p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
            disabled={loading}
          />
          <span className="absolute bottom-3 right-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {text.length}/{MAX_CHARS}
          </span>
        </div>
      )}

      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`drop-zone mt-4 rounded-xl p-6 text-center cursor-pointer ${dragOver ? 'drag-over' : ''}`}
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
            <button onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="ml-2 text-red-400 hover:text-red-500 font-bold">✕</button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold text-indigo-500">Click to upload</span> or drag & drop an image
            <br />
            <span className="text-xs">PNG, JPG, WEBP, BMP</span>
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!text.trim() && !file)}
        className="mt-5 w-full py-3 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>
    </div>
  );
}
