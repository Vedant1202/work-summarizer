import { useEffect, useCallback, useState } from 'react';
import { api, RunStatus, RunOptions } from '../api';

const LENGTH_OPTIONS = ['short', 'medium', 'long'];
const FORMAT_OPTIONS = ['markdown', 'html', 'both'];

export default function Dashboard() {
  const [status, setStatus] = useState<RunStatus>({ running: false, lastRunDate: null, error: null });
  const [triggering, setTriggering] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [opts, setOpts] = useState<RunOptions>({
    since: '',
    branch: '',
    repo: '',
    length: '',
    format: '',
    withLinear: false,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const s = await api.getRunStatus();
      setStatus(s);
    } catch {
      // ignore poll errors
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const id = setInterval(() => void fetchStatus(), 5000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    api.getConfig().then((c) => {
      setOpts({
        since: c.timeWindow || '24h',
        branch: c.branch || '',
        repo: c.repoPath || '',
        length: c.llm.summaryLength || 'medium',
        format: c.output.format || 'markdown',
        withLinear: false,
      });
    });
  }, []);

  const handleRun = async () => {
    setTriggering(true);
    try {
      // Only send fields that are non-empty so backend falls back to config defaults
      const payload: RunOptions = { withLinear: opts.withLinear };
      if (opts.since?.trim()) payload.since = opts.since.trim();
      if (opts.branch?.trim()) payload.branch = opts.branch.trim();
      if (opts.repo?.trim()) payload.repo = opts.repo.trim();
      if (opts.length?.trim()) payload.length = opts.length.trim();
      if (opts.format?.trim()) payload.format = opts.format.trim();

      await api.triggerRun(payload);
      setStatus((s) => ({ ...s, running: true, error: null }));
    } catch (e) {
      setStatus((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setTriggering(false);
    }
  };

  const set = (key: keyof RunOptions) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setOpts((o) => ({ ...o, [key]: e.target.value }));

  const busy = status.running || triggering;

  return (
    <div>
      <h2 style={heading}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 640, marginBottom: 32 }}>
        <Card title="Last Run">
          {status.lastRunDate
            ? new Date(status.lastRunDate).toLocaleString()
            : 'No runs yet'}
        </Card>
        <Card title="Status">
          {status.running ? 'Running…' : 'Idle'}
        </Card>
      </div>

      {status.error && (
        <div style={{ marginBottom: 16, color: '#c53030', fontSize: 14 }}>
          Last run error: {status.error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={() => void handleRun()} disabled={busy} style={btn(busy)}>
          {status.running ? 'Running…' : 'Run Now'}
        </button>
        <button
          onClick={() => setShowOptions((v) => !v)}
          style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', padding: 0 }}
        >
          {showOptions ? 'Hide options ▲' : 'Options ▼'}
        </button>
        {status.running && (
          <span style={{ color: '#666', fontSize: 14 }}>
            Polling every 5s…
          </span>
        )}
      </div>

      {showOptions && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20, maxWidth: 600, marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Run Options — pre-filled from your config
          </div>

          <Row label="Time window" hint="e.g. 24h, 2d, 1w">
            <input value={opts.since} onChange={set('since')} placeholder="24h" style={inputStyle} />
          </Row>
          <Row label="Branch" hint="git branch to scan">
            <input value={opts.branch} onChange={set('branch')} placeholder="(config default)" style={inputStyle} />
          </Row>
          <Row label="Repo path" hint="path to the git repo">
            <input value={opts.repo} onChange={set('repo')} placeholder="(config default)" style={inputStyle} />
          </Row>
          <Row label="Summary length">
            <select value={opts.length} onChange={set('length')} style={inputStyle}>
              <option value="">config default</option>
              {LENGTH_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Row>
          <Row label="Output format">
            <select value={opts.format} onChange={set('format')} style={inputStyle}>
              <option value="">config default</option>
              {FORMAT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Row>
          <Row label="With Linear">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={opts.withLinear ?? false}
                onChange={(e) => setOpts((o) => ({ ...o, withLinear: e.target.checked }))}
              />
              Enrich report with Linear issue data
            </label>
          </Row>
        </div>
      )}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 140, flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: '#333' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: '#999' }}>{hint}</div>}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: 15 }}>{children}</div>
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };

function btn(disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 22px',
    background: disabled ? '#ccc' : '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 500,
  };
}
