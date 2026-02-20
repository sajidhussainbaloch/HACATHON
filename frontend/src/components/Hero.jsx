import React from 'react';

/**
 * Professional Hero section with 3D depth and modern design.
 */
export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
      {/* Animated gradient background with 3D depth */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="text-center max-w-5xl mx-auto animate-fade-in-up space-y-8">
        {/* Premium badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:border-indigo-500/50 transition-all duration-300">
          <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            🚀 AI-Powered Fact Checking
          </span>
        </div>

        {/* Main headline with gradient */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-tight">
          <span className="block mb-2" style={{ color: 'var(--text-primary)' }}>
            Verify Before
          </span>
          <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
            You Share
          </span>
        </h1>

        {/* Enhanced tagline */}
        <p className="max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Instantly detect <span className="font-semibold text-green-400">Real</span>,{' '}
          <span className="font-semibold text-red-400">Fake</span>, or{' '}
          <span className="font-semibold text-yellow-400">Misleading</span> content with our AI.
          <br />
          <span className="text-sm mt-4 inline-block">
            Evidence-backed analysis backed by trusted sources
          </span>
        </p>

        {/* CTA Buttons with 3D effect */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <button className="group relative px-8 py-4 font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-100 group-hover:opacity-110 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative text-white flex items-center gap-2">
              Start Analyzing
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>

          <button className="px-8 py-4 font-bold text-lg rounded-xl border-2 border-indigo-500/50 backdrop-blur-sm bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1">
            Learn More
          </button>
        </div>

        {/* Trust indicators */}
        <div className="pt-12 grid grid-cols-3 gap-4 sm:gap-8 text-center stagger-children">
          {[
            { icon: '⚡', label: 'Instant Analysis', value: '<100ms' },
            { icon: '📚', label: 'Source Verified', value: '10K+ Sources' },
            { icon: '🎯', label: 'Accuracy Rate', value: '94.2%' }
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:border-indigo-500/30 transition-all hover:bg-white/10"
              style={{ '--stagger': idx }}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-xs sm:text-sm font-semibold text-indigo-300">{stat.label}</p>
              <p className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Feature strip */}
        <div className="pt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {[
              { icon: '🔬', title: 'Source Lineage', desc: 'Trace every claim to verified sources.' },
              { icon: '🧭', title: 'Bias Lens', desc: 'Detect framing patterns and slant.' },
              { icon: '🧠', title: 'Context Graph', desc: 'Summaries with key relations.' },
              { icon: '🧷', title: 'Citation Pack', desc: 'Export evidence in one click.' }
            ].map((item, idx) => (
              <div
                key={item.title}
                className="tilt-card rounded-2xl p-4 text-left bg-white/5 backdrop-blur-sm border border-white/10"
                style={{ '--stagger': idx + 1 }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
