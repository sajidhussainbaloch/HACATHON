import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="rounded-2xl p-8 shadow-lg"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            ✓
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            About RealityCheck AI
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            AI-Powered Fake News & Misinformation Detection
          </p>
        </div>

        {/* Mission */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Mission</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            RealityCheck AI is built to combat the growing spread of misinformation and fake news online.
            Our platform uses advanced AI models to analyze news articles, social media posts, and other
            text content — providing instant, evidence-based assessments of their credibility.
          </p>
          <p className="leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
            We believe that access to truthful information is a fundamental right, and technology should
            empower people to make informed decisions about the content they consume and share.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Input Content',
                desc: 'Paste text, type an article, or upload an image containing text you want to verify.'
              },
              {
                step: '2',
                title: 'AI Analysis',
                desc: 'Our AI classifies the content as Real, Fake, or Misleading using LLM-based reasoning.'
              },
              {
                step: '3',
                title: 'Evidence & Report',
                desc: 'Get a detailed explanation with evidence from trusted sources and downloadable PDF reports.'
              }
            ].map((item) => (
              <div key={item.step} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Mistral 7B', desc: 'LLM Classification' },
              { name: 'FAISS', desc: 'Vector Search' },
              { name: 'FastAPI', desc: 'Backend API' },
              { name: 'React', desc: 'Frontend UI' },
              { name: 'Tesseract OCR', desc: 'Image Text Extraction' },
              { name: 'HuggingFace', desc: 'Embeddings' },
              { name: 'Tailwind CSS', desc: 'Styling' },
              { name: 'SQLite', desc: 'Database' },
            ].map((tech) => (
              <div key={tech.name} className="p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tech.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-6">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Disclaimer</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            RealityCheck AI provides AI-generated assessments and should be used as a supplementary tool.
            Results are based on pattern recognition and comparison with known information — they are not
            definitive truth judgments. Always cross-reference important information with multiple trusted
            sources. We are not responsible for decisions made based on the AI's analysis.
          </p>
        </section>

        {/* Back link */}
        <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <Link to="/" className="text-indigo-500 hover:underline font-medium text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
