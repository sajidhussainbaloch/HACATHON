import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="rounded-2xl p-8 shadow-lg"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-6 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>1. Information We Collect</h2>
            <p>When you use RealityCheck AI, we may collect the following information:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong style={{ color: 'var(--text-primary)' }}>Account Information:</strong> Full name, email address, and encrypted password when you create an account.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Content Data:</strong> Text or images you submit for analysis. This data is processed by our AI models and is not permanently stored.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Usage Data:</strong> Basic interaction data such as timestamps and request counts for rate limiting purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>2. How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li>To provide and maintain the RealityCheck AI service</li>
              <li>To authenticate your account and protect against unauthorized access</li>
              <li>To send verification emails (OTP codes) and password reset links</li>
              <li>To process and analyze submitted content for misinformation detection</li>
              <li>To improve our AI models and service quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>3. Data Storage & Security</h2>
            <p>
              Your account data is stored in a secure database. Passwords are hashed using industry-standard
              bcrypt encryption and are never stored in plain text. JWT tokens are used for authentication
              with configurable expiry periods.
            </p>
            <p className="mt-2">
              Content submitted for analysis is processed in real-time and is not permanently stored on our
              servers. We use HTTPS encryption for all data in transit.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>4. Third-Party Services</h2>
            <p>RealityCheck AI uses the following third-party services to operate:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li><strong style={{ color: 'var(--text-primary)' }}>Cloudflare Workers AI:</strong> For LLM-based content classification and explanation generation</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>HuggingFace:</strong> For generating text embeddings used in evidence retrieval</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Gmail SMTP:</strong> For sending verification emails and password reset links</li>
            </ul>
            <p className="mt-2">
              Submitted text content is sent to these services for processing. Please review their respective
              privacy policies for more information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>5. Data Retention</h2>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong style={{ color: 'var(--text-primary)' }}>Account data:</strong> Retained until you request account deletion</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>OTP codes:</strong> Automatically expire after 5 minutes</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Password reset tokens:</strong> Automatically expire after 15 minutes</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Analyzed content:</strong> Not stored; processed in real-time only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Access your personal data through your profile page</li>
              <li>Update your personal information at any time</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>7. Cookies & Local Storage</h2>
            <p>
              RealityCheck AI uses browser local storage to maintain your authentication session (JWT token)
              and theme preference (dark/light mode). No third-party tracking cookies are used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be reflected on this page
              with an updated "Last updated" date. Continued use of the service after changes constitutes
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>9. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your data rights, please
              contact us through the application.
            </p>
          </section>
        </div>

        {/* Back link */}
        <div className="text-center pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <Link to="/" className="text-indigo-500 hover:underline font-medium text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
