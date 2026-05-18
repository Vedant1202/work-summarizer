import { useState } from 'react';
import { api, DoctorResult } from '../api';

export default function Doctor() {
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const r = await api.runDoctor();
      setResult(r);
    } catch (e) {
      setResult({ ok: false, lines: [`Error: ${e instanceof Error ? e.message : String(e)}`] });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <h2 style={heading}>Doctor</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
        Check your configuration and API connectivity.
      </p>

      <button onClick={() => void handleRun()} disabled={running} style={btn(running)}>
        {running ? 'Running checks…' : 'Run Doctor'}
      </button>

      {result && (
        <div style={{
          marginTop: 24,
          background: result.ok ? '#f0fff4' : '#fff5f5',
          border: `1px solid ${result.ok ? '#9ae6b4' : '#feb2b2'}`,
          borderRadius: 8,
          padding: 20,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: result.ok ? '#22543d' : '#742a2a' }}>
            {result.ok ? '✓ Setup looks good' : '✗ Setup incomplete'}
          </div>
          <pre style={{ margin: 0, fontSize: 13, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#333' }}>
            {result.lines.filter((l) => l.trim()).join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 8, fontSize: 22, fontWeight: 700 };

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
