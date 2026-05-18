import { useEffect, useState, useCallback } from 'react';
import { api, MintlifyDeployRecord, MintlifyStatusResult, MintlifyTriggerResult } from '../api';

export default function Mintlify() {
  // Shared: clicking a statusId in History pre-fills the Status checker
  const [checkStatusId, setCheckStatusId] = useState('');

  return (
    <div>
      <h2 style={heading}>Mintlify</h2>
      <TriggerSection onTriggered={setCheckStatusId} />
      <HistorySection onSelectStatusId={setCheckStatusId} />
      <StatusSection statusId={checkStatusId} setStatusId={setCheckStatusId} />
      <SummarySection />
    </div>
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────

function TriggerSection({ onTriggered }: { onTriggered: (id: string) => void }) {
  const [mode, setMode] = useState<'preview' | 'production'>('preview');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MintlifyTriggerResult | null>(null);
  const [error, setError] = useState('');

  const handleTrigger = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await api.mintlifyTrigger(mode, mode === 'preview' ? branch || undefined : undefined);
      setResult(r);
      onTriggered(r.statusId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Trigger Deployment">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <ToggleButton active={mode === 'preview'} onClick={() => setMode('preview')}>Preview</ToggleButton>
        <ToggleButton active={mode === 'production'} onClick={() => setMode('production')}>Production</ToggleButton>
        {mode === 'preview' && (
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="branch name"
            style={{ ...inputStyle, width: 200 }}
          />
        )}
        <button onClick={() => void handleTrigger()} disabled={loading} style={btn(loading)}>
          {loading ? 'Triggering…' : 'Deploy'}
        </button>
      </div>
      {result && (
        <div style={successBox}>
          <div><strong>Triggered.</strong> statusId: <code>{result.statusId}</code></div>
          {result.previewUrl && <div style={{ marginTop: 4 }}>Preview: <a href={result.previewUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{result.previewUrl}</a></div>}
          <div style={{ marginTop: 4, fontSize: 12, color: '#555' }}>Running in background — check status below or refresh history.</div>
        </div>
      )}
      {error && <div style={errorBox}>{error}</div>}
    </Section>
  );
}

// ── History ───────────────────────────────────────────────────────────────────

function HistorySection({ onSelectStatusId }: { onSelectStatusId: (id: string) => void }) {
  const [records, setRecords] = useState<MintlifyDeployRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.mintlifyHistory();
      setRecords(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Section title="Deployment History">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={() => void load()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 13 }}>
          ↺ Refresh
        </button>
      </div>
      {loading && <p style={{ color: '#666', fontSize: 14 }}>Loading…</p>}
      {!loading && records.length === 0 && (
        <p style={{ color: '#999', fontSize: 14 }}>No deployments yet. Trigger one above.</p>
      )}
      {!loading && records.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                {['StatusId', 'Date', 'Mode', 'Branch', 'Status', 'Location'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: '#888', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const statusColor = r.finalStatus === 'success' ? '#22543d' : r.finalStatus === 'failure' ? '#c53030' : '#2563eb';
                const location = r.previewUrl ?? r.subdomain ?? '—';
                return (
                  <tr key={r.statusId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={td}>
                      <button
                        onClick={() => onSelectStatusId(r.statusId)}
                        title="Click to check status"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#2563eb', textDecoration: 'underline dotted' }}
                      >
                        {r.statusId.slice(0, 12)}…
                      </button>
                    </td>
                    <td style={td}>{r.triggeredAt.replace('T', ' ').slice(0, 16)}</td>
                    <td style={td}>{r.mode}</td>
                    <td style={td}>{r.branch ?? '—'}</td>
                    <td style={{ ...td, color: statusColor, fontWeight: 600 }}>{r.finalStatus}</td>
                    <td style={td}>
                      {location !== '—'
                        ? <a href={location.startsWith('http') ? location : `https://${location}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{location}</a>
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

// ── Status ────────────────────────────────────────────────────────────────────

function StatusSection({ statusId, setStatusId }: { statusId: string; setStatusId: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MintlifyStatusResult | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!statusId.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await api.mintlifyStatus(statusId.trim());
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const statusColor = result
    ? result.status === 'success' ? '#22543d' : result.status === 'failure' ? '#c53030' : '#2563eb'
    : '#333';

  return (
    <Section title="Check Status">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
          placeholder="statusId — click a row above to fill"
          style={{ ...inputStyle, width: 360 }}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleCheck(); }}
        />
        <button onClick={() => void handleCheck()} disabled={loading || !statusId.trim()} style={btn(loading || !statusId.trim())}>
          {loading ? 'Checking…' : 'Check'}
        </button>
      </div>
      {result && (
        <div style={{ ...successBox, borderColor: result.status === 'failure' ? '#feb2b2' : '#9ae6b4' }}>
          <Row2 label="Status"><span style={{ color: statusColor, fontWeight: 600 }}>{result.status}</span></Row2>
          {result.subdomain && <Row2 label="Site">{result.subdomain}</Row2>}
          {result.summary && <Row2 label="Summary">{result.summary}</Row2>}
          {result.createdAt && <Row2 label="Created">{result.createdAt}</Row2>}
          {result.endedAt && <Row2 label="Ended">{result.endedAt}</Row2>}
          {result.commit && (
            <Row2 label="Commit">
              <code>{result.commit.sha.slice(0, 7)}</code> {result.commit.message}
            </Row2>
          )}
        </div>
      )}
      {error && <div style={errorBox}>{error}</div>}
    </Section>
  );
}

// ── LLM Summary ───────────────────────────────────────────────────────────────

const SINCE_OPTIONS = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

function SummarySection() {
  const [since, setSince] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const r = await api.mintlifySummary(since);
      setSummary(r.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="LLM Summary">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <select value={since} onChange={(e) => setSince(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          {SINCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => void handleGenerate()} disabled={loading} style={btn(loading)}>
          {loading ? 'Generating…' : 'Generate Summary'}
        </button>
      </div>
      {summary && (
        <pre style={{ margin: 0, fontSize: 13, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#333', background: '#f9f9f9', border: '1px solid #e5e5e5', borderRadius: 6, padding: 16 }}>
          {summary}
        </pre>
      )}
      {error && <div style={errorBox}>{error}</div>}
    </Section>
  );
}

// ── Shared components & styles ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        background: active ? '#2563eb' : '#f1f5f9',
        color: active ? '#fff' : '#64748b',
        border: '1px solid ' + (active ? '#2563eb' : '#e2e8f0'),
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

function Row2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 13 }}>
      <span style={{ width: 80, color: '#888', flexShrink: 0 }}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700 };
const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const td: React.CSSProperties = { padding: '8px 12px', verticalAlign: 'middle' };
const successBox: React.CSSProperties = { background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 6, padding: '12px 16px', fontSize: 14 };
const errorBox: React.CSSProperties = { background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 6, padding: '10px 14px', fontSize: 14, color: '#c53030' };

function btn(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: disabled ? '#cbd5e1' : '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  };
}
