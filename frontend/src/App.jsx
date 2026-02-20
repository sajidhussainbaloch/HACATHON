import React, { useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputArea from './components/InputArea';
import Loader from './components/Loader';
import ResultPanel from './components/ResultPanel';
import ProtectedRoute from './components/ProtectedRoute';
import CursorAnimation from './components/CursorAnimation';
import { analyzeContent } from './services/api';

// Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import StudentAssistant from './student-assistant/StudentAssistant';

function AnalyzerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async ({ text, file }) => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await analyzeContent({ text, file });
      setResult(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError('');
  }, []);

  return (
    <main className="max-w-5xl mx-auto py-8">
      {!result && !loading && <Hero />}
      {!result && !loading && <InputArea onSubmit={handleSubmit} loading={loading} />}
      {loading && <Loader />}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mt-6 animate-fade-in-up">
          <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}
      {result && (
        <>
          <ResultPanel data={result} />
          <div className="flex justify-center mt-2 pb-8">
            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              ← Analyze Another
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function HomePage() {
  return (
    <main className="max-w-5xl mx-auto py-16 px-4">
      <div className="text-center animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500 flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          RealityCheck <span className="text-indigo-500">AI</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
          AI-powered fake news and misinformation detection. Paste any text or upload an image
          to get an instant credibility analysis backed by evidence from trusted sources.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/app"
            className="px-8 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-lg hover:bg-indigo-600 transition-colors no-underline"
          >
            Start Analyzing
          </Link>
          <Link
            to="/about"
            className="px-8 py-3 rounded-xl border-2 border-indigo-500 text-indigo-500 font-semibold text-lg hover:bg-indigo-500/10 transition-colors no-underline"
          >
            Learn More
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: '🔍',
              title: 'AI Classification',
              desc: 'Mistral 7B LLM classifies content as Real, Fake, or Misleading with confidence scores.'
            },
            {
              icon: '📚',
              title: 'Evidence Retrieval',
              desc: 'RAG pipeline compares your content against a knowledge base of trusted sources.'
            },
            {
              icon: '📊',
              title: 'Detailed Reports',
              desc: 'Get explanations, inconsistency detection, and downloadable PDF reports.'
            }
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl text-left"
                 style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <CursorAnimation />
      <div className="min-h-screen transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/app" element={<AnalyzerPage />} />
          <Route path="/student-assistant" element={<StudentAssistant />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>

        {/* Footer */}
        <footer className="text-center py-6 text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-center gap-4">
            <Link to="/about" className="hover:text-indigo-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>About</Link>
            <Link to="/privacy-policy" className="hover:text-indigo-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link>
          </div>
          <p>RealityCheck AI · Built for truth · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
