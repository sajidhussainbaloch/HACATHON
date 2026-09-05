import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentWorkspace,
  uploadWorkspaceDocument,
  getJobStatus,
  listWorkspaceDocuments,
  answerResearchQuestion,
  askCodeAssistant,
  getUsageSummary,
  getBillingPlans,
  chatWithWorkspaceCopilot,
} from '../services/api';

const moduleCards = [
  {
    title: 'Document Intelligence',
    description: 'Upload PDFs, screenshots, and notes into a workspace-scoped OCR and retrieval pipeline.',
    accent: 'var(--accent-1)',
  },
  {
    title: 'Research Copilot',
    description: 'Grounded answers with cited workspace evidence and orchestration-ready routing.',
    accent: 'var(--accent-2)',
  },
  {
    title: 'Code Assistant',
    description: 'Patch-oriented coding help with room for future repo indexing and worker-backed analysis.',
    accent: 'var(--accent-3)',
  },
];

const trustSignals = [
  'Workspace-scoped documents',
  'Background job scaffolding',
  'Hybrid model routing',
  'Billing and usage foundations',
];

export default function WorkspaceDashboard() {
  const { user } = useAuth();
  const workspaceId = user?.id || 'default';

  const [workspace, setWorkspace] = useState(null);
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState(null);
  const [codePrompt, setCodePrompt] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [codeResult, setCodeResult] = useState(null);
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotResult, setCopilotResult] = useState('');
  const [jobState, setJobState] = useState({ loading: false, id: '', status: '', error: '' });
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const [workspaceData, usageData, plansData, docsData] = await Promise.all([
          getCurrentWorkspace({ workspaceId, userId: user?.id }),
          getUsageSummary({ workspaceId, userId: user?.id }),
          getBillingPlans(),
          listWorkspaceDocuments({ workspaceId, userId: user?.id }),
        ]);

        if (!active) return;
        setWorkspace(workspaceData);
        setUsage(usageData);
        setPlans(plansData.plans || []);
        setDocuments(docsData.documents || []);
      } catch (err) {
        if (!active) return;
        setUploadError(err.message || 'Failed to load workspace data.');
      } finally {
        if (active) setLoading(false);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, [workspaceId, user?.id]);

  async function refreshDocuments() {
    const docsData = await listWorkspaceDocuments({ workspaceId, userId: user?.id });
    setDocuments(docsData.documents || []);
    const usageData = await getUsageSummary({ workspaceId, userId: user?.id });
    setUsage(usageData);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setJobState({ loading: true, id: '', status: 'uploading', error: '' });

    try {
      const uploaded = await uploadWorkspaceDocument(file, { workspaceId, userId: user?.id });
      let status = 'queued';
      let attempts = 0;
      setJobState({ loading: true, id: uploaded.job_id, status, error: '' });

      while (status === 'queued' || status === 'running') {
        const job = await getJobStatus(uploaded.job_id, { workspaceId, userId: user?.id });
        status = job.status;
        attempts += 1;
        setJobState({ loading: status !== 'completed', id: uploaded.job_id, status, error: job.error || '' });
        if (status === 'completed' || status === 'failed' || attempts > 12) break;
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      await refreshDocuments();
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
      setJobState({ loading: false, id: '', status: 'failed', error: err.message || 'Upload failed.' });
    }
  }

  async function handleResearchSubmit(event) {
    event.preventDefault();
    setResearchResult({ loading: true });
    try {
      const data = await answerResearchQuestion(researchQuery, { workspaceId, userId: user?.id });
      setResearchResult(data);
    } catch (err) {
      setResearchResult({ error: err.message || 'Research failed.' });
    }
  }

  async function handleCodeSubmit(event) {
    event.preventDefault();
    setCodeResult({ loading: true });
    try {
      const data = await askCodeAssistant(
        { prompt: codePrompt, code_context: codeContext, language: 'javascript' },
        { workspaceId, userId: user?.id }
      );
      setCodeResult(data);
    } catch (err) {
      setCodeResult({ error: err.message || 'Code assistant failed.' });
    }
  }

  async function handleCopilotSubmit(event) {
    event.preventDefault();
    try {
      const data = await chatWithWorkspaceCopilot(
        { message: copilotPrompt, module: 'workspace' },
        { workspaceId, userId: user?.id }
      );
      setCopilotResult(data.answer || '');
    } catch (err) {
      setCopilotResult(err.message || 'Copilot failed.');
    }
  }

  if (loading) {
    return (
      <main className="saas-page max-w-7xl mx-auto px-4 py-10">
        <div className="saas-shell p-6 rounded-[28px]">
          <div className="saas-skeleton h-10 w-48 rounded-xl mb-4"></div>
          <div className="saas-grid">
            <div className="saas-skeleton h-72 rounded-3xl"></div>
            <div className="saas-skeleton h-72 rounded-3xl"></div>
            <div className="saas-skeleton h-72 rounded-3xl"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="saas-page max-w-7xl mx-auto px-4 py-8">
      <div className="saas-shell rounded-[28px] overflow-hidden">
        <div className="saas-layout">
          <aside className="saas-sidebar">
            <div>
              <p className="saas-kicker">Workspace</p>
              <h1 className="saas-sidebar-title">{workspace?.workspace?.name || 'AI Control Center'}</h1>
              <p className="saas-sidebar-copy">
                Multi-tenant AI workspace with OCR intake, grounded research, code assistance, and SaaS usage visibility.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              <Link to="/student-assistant" className="saas-nav-card no-underline">
                <span>Student Assistant</span>
                <small>Study tools and grounded note Q&A</small>
              </Link>
              <Link to="/app" className="saas-nav-card no-underline">
                <span>Analyzer</span>
                <small>Keep the original fake-news flow intact</small>
              </Link>
              <Link to="/image-detector" className="saas-nav-card no-underline">
                <span>Image Authenticity</span>
                <small>Media validation module</small>
              </Link>
            </div>

            <div className="saas-trust-stack mt-8">
              {trustSignals.map((signal) => (
                <span key={signal} className="saas-pill">{signal}</span>
              ))}
            </div>
          </aside>

          <section className="saas-main">
            <div className="saas-topbar">
              <div>
                <p className="saas-kicker">SaaS Dashboard</p>
                <h2 className="saas-main-title">Modern AI workspace for VPS-ready growth</h2>
              </div>
              <div className="saas-metric-band">
                <div>
                  <strong>{workspace?.subscription?.plan || 'starter'}</strong>
                  <span>Current plan</span>
                </div>
                <div>
                  <strong>{usage?.documents_total || 0}</strong>
                  <span>Documents</span>
                </div>
                <div>
                  <strong>{usage?.events_total || 0}</strong>
                  <span>Usage events</span>
                </div>
              </div>
            </div>

            <div className="saas-grid mb-6">
              {moduleCards.map((card) => (
                <article key={card.title} className="saas-card saas-card-glow">
                  <div className="saas-accent" style={{ background: card.accent }}></div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>

            <div className="saas-panel-grid">
              <section className="saas-card saas-card-large">
                <div className="saas-card-header">
                  <div>
                    <p className="saas-kicker">OCR + Documents</p>
                    <h3>Upload workspace files</h3>
                  </div>
                  {jobState.id ? <span className="saas-status">{jobState.status}</span> : null}
                </div>
                <label className="saas-upload-zone">
                  <input type="file" accept=".pdf,image/*,.txt,.md" onChange={handleUpload} />
                  <span>Drop PDF, screenshots, notes, or text files here</span>
                  <small>Files are processed into workspace-scoped chunks with background-job scaffolding.</small>
                </label>
                {uploadError ? <p className="saas-error mt-3">{uploadError}</p> : null}
                <div className="saas-document-list mt-4">
                  {(documents || []).slice(0, 4).map((doc) => (
                    <div key={doc.id} className="saas-document-item">
                      <strong>{doc.name}</strong>
                      <span>{doc.text_length} chars</span>
                    </div>
                  ))}
                  {!documents.length ? <p className="saas-muted">No documents in this workspace yet.</p> : null}
                </div>
              </section>

              <section className="saas-card saas-card-large">
                <div className="saas-card-header">
                  <div>
                    <p className="saas-kicker">Research</p>
                    <h3>Grounded workspace answers</h3>
                  </div>
                  <span className="saas-status">cited mode</span>
                </div>
                <form className="space-y-3" onSubmit={handleResearchSubmit}>
                  <textarea
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    className="saas-input min-h-[120px]"
                    placeholder="Ask about uploaded files, notes, or internal research material..."
                  />
                  <button type="submit" className="saas-button">Run research answer</button>
                </form>
                {researchResult?.answer ? (
                  <div className="saas-result-block mt-4">
                    <p>{researchResult.answer}</p>
                    <div className="saas-source-list mt-3">
                      {(researchResult.sources || []).map((source) => (
                        <div key={`${source.chunk_id}-${source.score}`} className="saas-source-item">
                          <strong>Chunk {source.chunk_id}</strong>
                          <span>{source.preview}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {researchResult?.error ? <p className="saas-error mt-3">{researchResult.error}</p> : null}
              </section>
            </div>

            <div className="saas-panel-grid mt-6">
              <section className="saas-card saas-card-large">
                <div className="saas-card-header">
                  <div>
                    <p className="saas-kicker">Coding UI</p>
                    <h3>Patch-oriented code assistant</h3>
                  </div>
                  <span className="saas-status">premium route</span>
                </div>
                <form className="space-y-3" onSubmit={handleCodeSubmit}>
                  <textarea
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    className="saas-input min-h-[100px]"
                    placeholder="Describe the feature, bug, or refactor you want the assistant to handle..."
                  />
                  <textarea
                    value={codeContext}
                    onChange={(e) => setCodeContext(e.target.value)}
                    className="saas-input min-h-[180px] font-mono text-sm"
                    placeholder="Paste code context here for patch-style help..."
                  />
                  <button type="submit" className="saas-button saas-button-accent">Ask code assistant</button>
                </form>
                {codeResult?.answer ? <pre className="saas-code-output mt-4">{codeResult.answer}</pre> : null}
                {codeResult?.error ? <p className="saas-error mt-3">{codeResult.error}</p> : null}
              </section>

              <section className="saas-card saas-card-large">
                <div className="saas-card-header">
                  <div>
                    <p className="saas-kicker">Workspace Copilot</p>
                    <h3>Operator console</h3>
                  </div>
                  <span className="saas-status">orchestrated</span>
                </div>
                <form className="space-y-3" onSubmit={handleCopilotSubmit}>
                  <input
                    value={copilotPrompt}
                    onChange={(e) => setCopilotPrompt(e.target.value)}
                    className="saas-input"
                    placeholder="Ask the workspace copilot what to do next..."
                  />
                  <button type="submit" className="saas-button">Chat with copilot</button>
                </form>
                {copilotResult ? <div className="saas-result-block mt-4"><p>{copilotResult}</p></div> : null}

                <div className="mt-6">
                  <p className="saas-kicker mb-2">Plans</p>
                  <div className="saas-plan-stack">
                    {plans.map((plan) => (
                      <div key={plan.id} className="saas-plan-row">
                        <strong>{plan.name}</strong>
                        <span>${plan.price_monthly}/mo</span>
                        <small>{plan.ai_credits} credits</small>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
