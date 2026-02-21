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
            About Reality Check AI Plus
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            AI-Powered Fake News & Misinformation Detection
          </p>
        </div>

        {/* Mission */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Mission</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Reality Check AI Plus is a professional-grade authenticity platform designed to reduce misinformation,
            accelerate verification workflows, and provide explainable AI signals at scale. We combine
            retrieval-augmented generation, calibrated classifiers, and forensic signals to deliver high-trust
            media insights in seconds.
          </p>
          <p className="leading-relaxed mt-3" style={{ color: 'var(--text-secondary)' }}>
            Our goal is to empower researchers, educators, and newsrooms with enterprise-ready, transparent
            assessments that can be audited and shared responsibly.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Ingest & Normalize',
                desc: 'Submit text, screenshots, or images for multi-modal verification and normalization.'
              },
              {
                step: '2',
                title: 'AI Authenticity Pass',
                desc: 'Classifier ensembles score credibility, bias signals, and semantic anomalies.'
              },
              {
                step: '3',
                title: 'Evidence & Audit',
                desc: 'Retrieval pipelines surface provenance, citations, and audit-ready outputs.'
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

        {/* Study Analyzer */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Advanced Study Analyzer</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Study Analyzer transforms academic notes into structured learning assets, including
            high-precision executive summaries, key concepts, flashcards, viva prompts, and MCQ banks.
            It uses context-aware semantic parsing and adaptive prompt orchestration to produce exam-ready
            materials in minutes.
          </p>
        </section>

        {/* Image Authenticity Checker */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Image Authenticity Checker</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Our image checker flags AI-generated and deepfake imagery using forensic cues and
            free inference models. It returns a confidence score and concise explanation for
            transparent decision-making.
          </p>
        </section>

        {/* Image Generator */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>AI Image Generator Studio</h2>
          <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The Image Generator Studio provides prompt-to-image synthesis using a free
            Hugging Face model (FLUX.1 Schnell). It is designed for fast concept exploration
            and creative iteration with lightweight, serverless-friendly inference.
          </p>
        </section>

        {/* Technology Stack */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'Mistral 7B', desc: 'LLM Classification' },
              { name: 'FAISS', desc: 'Vector Retrieval' },
              { name: 'FastAPI', desc: 'Serverless API' },
              { name: 'React', desc: 'Modern UI' },
              { name: 'OCR.space', desc: 'Image Text Extraction' },
              { name: 'HuggingFace', desc: 'Model Inference' },
              { name: 'Tailwind CSS', desc: 'Design System' },
              { name: 'Supabase', desc: 'Auth & Identity' },
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
            Reality Check AI Plus provides AI-generated assessments and should be used as a supplementary tool.
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
