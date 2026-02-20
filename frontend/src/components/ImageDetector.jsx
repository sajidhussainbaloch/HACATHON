import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ImageDetector() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isTouch, setIsTouch] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const touchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;
    setIsTouch(touchDevice);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const confidenceTone = useMemo(() => {
    if (!result) return 'bg-white/10 text-indigo-300';
    if (result.confidence >= 80) return 'bg-emerald-500/15 text-emerald-400';
    if (result.confidence >= 60) return 'bg-yellow-500/15 text-yellow-300';
    return 'bg-red-500/15 text-red-400';
  }, [result]);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setResult(null);
    setError('');
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/api/image/check`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || 'Unable to analyze image.');
      }

      setResult(payload);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Unable to analyze image.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <section className="rounded-2xl p-6 sm:p-10 bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Image Authenticity Checker
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Upload an image to detect whether it is AI-generated or real. Results are lightweight and
            do not store your file.
          </p>
        </div>

        {isTouch && (
          <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Image authenticity checks are disabled on touch devices for performance and safety.
          </div>
        )}

        {!isTouch && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-indigo-200 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600/80 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-500/90"
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  PNG, JPG, WEBP, BMP supported. Best results with clear images.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!file || loading}
                className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-40"
              >
                {loading ? 'Analyzing image...' : 'Run authenticity check'}
              </button>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[220px]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-56 object-cover rounded-xl"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-indigo-200">
                  Preview will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 tilt-card rounded-2xl p-6 bg-white/5 border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {result.classification}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${confidenceTone}`}>
                Confidence: {result.confidence}%
              </span>
            </div>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {result.explanation}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
