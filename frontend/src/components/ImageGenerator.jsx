import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isTouch, setIsTouch] = useState(false);
  const abortRef = useRef(null);

  const presets = [
    'Cinematic portrait of a researcher in a neon-lit lab, ultra-detailed, 35mm',
    'Futuristic city skyline at golden hour, volumetric light, wide angle',
    'Minimalist product photo, soft studio lighting, clean background',
    'Surreal floating islands above clouds, ethereal glow, fantasy art',
    'Macro photograph of a crystal flower, hyper-real, shallow depth of field',
  ];

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

  const imageSrc = useMemo(() => {
    if (!result?.image_base64) return '';
    const ct = result.content_type || 'image/png';
    return `data:${ct};base64,${result.image_base64}`;
  }, [result]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/api/image/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negative_prompt: negativePrompt.trim() || undefined,
        }),
        signal: controller.signal,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.detail || 'Image generation failed.');
      }

      setResult(payload);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Image generation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = 'zayqen-ai-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <section className="rounded-2xl p-6 sm:p-10 bg-white/5 backdrop-blur-sm border border-white/10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            AI Image Generator Studio
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            Generate high-quality images with a free Hugging Face model. Add a negative prompt to
            exclude unwanted elements. No files are stored.
          </p>
        </div>

        {isTouch && (
          <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Image generation is disabled on touch devices for performance and safety.
          </div>
        )}

        {!isTouch && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Prompt
                </label>
                <textarea
                  rows={5}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="A cinematic portrait of a researcher in a neon-lit lab..."
                  className="w-full rounded-xl p-3 text-sm bg-transparent border border-white/10 focus:outline-none focus:border-indigo-400"
                  style={{ color: 'var(--text-primary)' }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Use descriptive phrases for best results.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Negative Prompt (optional)
                </label>
                <textarea
                  rows={3}
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  placeholder="blurry, distorted faces, low quality, watermark"
                  className="w-full rounded-xl p-3 text-sm bg-transparent border border-white/10 focus:outline-none focus:border-indigo-400"
                  style={{ color: 'var(--text-primary)' }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Use commas to exclude elements you do not want.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Prompt Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPrompt(preset)}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-indigo-200 hover:bg-indigo-500/20 transition"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>


              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-40"
              >
                {loading ? 'Generating image...' : 'Generate image'}
              </button>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 min-h-[260px]">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt="Generated"
                  className="w-full h-64 object-cover rounded-xl"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-indigo-200">
                  Your generated image will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">Model: {result.model}</span>
            {result.width && result.height && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">
                Size: {result.width}x{result.height}
              </span>
            )}
            <button
              onClick={handleDownload}
              className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-500/30 transition"
            >
              Download image
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
