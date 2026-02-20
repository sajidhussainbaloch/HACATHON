import React, { useRef, useState, useCallback } from 'react';

const MAX_CHARS = 5000;

/**
 * Professional InputArea with glassmorphism, 3D effects, and premium design.
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
    <div className="w-full max-w-4xl mx-auto px-4 py-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
      {/* Textarea with premium styling */}
      {!file && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
              What would you like to verify?
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Paste a news article, social media post, or claim here…"
              rows={6}
              className="w-full rounded-2xl p-6 text-base resize-none focus:outline-none transition-all duration-300 backdrop-blur-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(99, 102, 241, 0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'}
              disabled={loading}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className={`text-xs font-medium transition-colors ${text.length > MAX_CHARS * 0.9 ? 'text-red-400' : 'text-gray-400'}`}>
                {text.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drag & drop zone with 3D effect */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`mt-6 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 transform group backdrop-blur-xl border-2 ${
          dragOver
            ? 'border-indigo-500 bg-white/10 scale-105'
            : 'border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-white/5'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        
        {file ? (
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <span className="font-semibold block" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                <span className="text-sm text-green-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); clearFile(); }}
              className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl opacity-75">📸</div>
            <div>
              <p className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                Drop your image here
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                or <span className="text-indigo-400 font-semibold">click to browse</span>
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
                PNG, JPG, WEBP, BMP up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced submit button with 3D effect */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!text.trim() && !file)}
        className="mt-8 w-full group relative py-4 px-6 rounded-xl font-bold text-lg text-white transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl"
      >
        {/* Button background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-100 group-hover:opacity-110 transition-opacity"></div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent"></div>
        
        {/* Text with animation */}
        <span className="relative flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing your content…
            </>
          ) : (
            <>
              <span>Verify Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </span>
      </button>

      {/* Info text */}
      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-secondary)' }}>
        ✓ Your data is encrypted • Analysis takes &lt;2 seconds • 10K+ trusted sources
      </p>
    </div>
  );
}
