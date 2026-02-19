import React from 'react';

/**
 * Hero section with title and tagline.
 */
export default function Hero() {
  return (
    <section className="text-center py-12 px-4 animate-fade-in-up">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
          style={{ color: 'var(--text-primary)' }}>
        Verify Before You Share
      </h1>
      <p className="max-w-2xl mx-auto text-lg" style={{ color: 'var(--text-secondary)' }}>
        Paste a news article, claim, or upload a screenshot — our AI will classify it
        as <span className="font-semibold text-green-500">Real</span>,{' '}
        <span className="font-semibold text-red-500">Fake</span>, or{' '}
        <span className="font-semibold text-yellow-500">Misleading</span> with evidence-backed reasoning.
      </p>
    </section>
  );
}
