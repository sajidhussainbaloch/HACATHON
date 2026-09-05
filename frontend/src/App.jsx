import React, { useState, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InputArea from './components/InputArea';
import Loader from './components/Loader';
import ResultPanel from './components/ResultPanel';
import ProtectedRoute from './components/ProtectedRoute';
import BackgroundAnimation from './components/BackgroundAnimation';
import ImageDetector from './components/ImageDetector';
import ImageGenerator from './components/ImageGenerator';
import { analyzeContent } from './services/api';

// Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
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
    <main className="max-w-6xl mx-auto py-10 px-4">
      <Hero />
      <InputArea onSubmit={handleSubmit} />
      {loading && <Loader />}
      {error && (
        <div
          className="mt-6 p-4 rounded-xl border border-red-400/30 bg-red-500/10 text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {error}
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
              Analyze Another
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function HomePage() {
  return (
    <main className="max-w-6xl mx-auto py-16 px-4">
      <div className="text-center animate-fade-in-up">
        <div className="hero-3d glass-reflect rounded-3xl p-10 sm:p-14">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6 shadow-xl">
            AI
          </div>
          <div className="typewriter mb-4">
            <span className="typewriter-text text-3xl sm:text-5xl font-black tracking-tight hero-title-shadow">
              Reality Check AI Plus
            </span>
            <span className="typewriter-cursor" aria-hidden="true"></span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            VPS-ready AI SaaS workspace for trust, research, and coding
          </h2>
          <p className="text-base sm:text-lg max-w-3xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
            Run misinformation analysis, multimodal document workflows, grounded research, and code assistance from one product shell.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/workspace"
              className="px-8 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-lg hover:bg-indigo-600 transition-colors no-underline"
            >
              Open Workspace
            </Link>
            <Link
              to="/student-assistant"
              className="px-8 py-3 rounded-xl border-2 border-indigo-500 text-indigo-400 font-semibold text-lg hover:bg-indigo-500/10 transition-colors no-underline"
            >
              Study Copilot
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-14">
          {[
            {
              icon: 'WS',
              title: 'Workspace SaaS Shell',
              desc: 'Workspace-scoped documents, usage metrics, plan surfaces, and AI copilots in one dashboard.'
            },
            {
              icon: 'DOC',
              title: 'Document Intelligence',
              desc: 'OCR and PDF intake with background job scaffolding and grounded retrieval across uploaded files.'
            },
            {
              icon: 'R&D',
              title: 'Research And Code',
              desc: 'Research answers with citations plus coding help tuned for patch-style implementation guidance.'
            },
            {
              icon: 'AN',
              title: 'Analyzer Compatibility',
              desc: 'The original analyzer and image flows stay available while the product grows into SaaS.'
            }
          ].map((f) => (
            <div key={f.title} className="tilt-card p-6 rounded-2xl text-left bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-3xl mb-3 font-bold">{f.icon}</div>
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
      <BackgroundAnimation />
      <div className="min-h-screen transition-colors relative z-10" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
          <Route path="/image-detector" element={<ImageDetector />} />
          <Route path="/image-generator" element={<ImageGenerator />} />
          <Route path="/student-assistant" element={<StudentAssistant />} />
          <Route path="/workspace" element={
            <ProtectedRoute>
              <WorkspaceDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>

        <footer className="mt-16 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>RealityCheck</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Evidence-led verification and AI workspaces for modern teams.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Product</p>
                <Link to="/workspace" className="footer-link">Workspace</Link>
                <Link to="/app" className="footer-link">Analyzer</Link>
                <Link to="/student-assistant" className="footer-link">Student Assistant</Link>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Company</p>
                <Link to="/about" className="footer-link">About</Link>
                <Link to="/privacy-policy" className="footer-link">Privacy</Link>
                <a href="mailto:hello@realitycheck.ai" className="footer-link">Contact</a>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Stack</p>
                <a href="https://fastapi.tiangolo.com/" className="footer-link">FastAPI</a>
                <a href="https://supabase.com" className="footer-link">Supabase</a>
                <a href="https://huggingface.co" className="footer-link">Hugging Face</a>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {['VPS-ready', 'Workspace-scoped', 'OCR pipelines', 'Code copilots'].map((label) => (
                  <span key={label} className="trust-badge">{label}</span>
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Reality Check AI Plus · Built for truth · {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
