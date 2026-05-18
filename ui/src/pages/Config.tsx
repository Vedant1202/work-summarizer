import { useEffect, useState } from 'react';
import { api, AppConfig } from '../api';

interface Field { key: string; label: string; hint?: string; isApiKey?: boolean }

const FIELDS: Field[] = [
  { key: 'repoPath', label: 'Repo Path', hint: 'Path to the git repo (default: .)' },
  { key: 'branch', label: 'Branch', hint: 'Git branch to scan' },
  { key: 'timeWindow', label: 'Time Window', hint: 'e.g. 24h, 2d, 1w' },
  { key: 'llm.summaryLength', label: 'Summary Length', hint: 'short | medium | long' },
  { key: 'output.format', label: 'Output Format', hint: 'markdown | html | both' },
  { key: 'output.dir', label: 'Output Directory' },
  { key: 'integrations.linear.teamId', label: 'Linear Team ID', hint: 'optional' },
  { key: 'integrations.linear.apiKey', label: 'Linear API Key', hint: 'optional', isApiKey: true },
  { key: 'integrations.mintlify.projectId', label: 'Mintlify Project ID', hint: 'optional' },
  { key: 'integrations.mintlify.apiKey', label: 'Mintlify API Key', hint: 'optional', isApiKey: true },
];

const MASKED = '***';

function getPath(obj: unknown, path: string): string {
  return String(
    path.split('.').reduce<unknown>((cur, p) => {
      if (cur !== null && typeof cur === 'object') return (cur as Record<string, unknown>)[p];
      return undefined;
    }, obj) ?? ''
  );
}

export default function Config() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c);
      const initial: Record<string, string> = {};
      for (const { key, isApiKey } of FIELDS) {
        const raw = getPath(c, key);
        // Don't pre-fill API key inputs with the masked value — leave blank so
        // the user must type a real value to update
        initial[key] = isApiKey && raw === MASKED ? '' : raw;
      }
      setValues(initial);
    });
  }, []);

  const handleSave = async (key: string) => {
    // Skip saving an empty API key field — it means "no change"
    const field = FIELDS.find((f) => f.key === key);
    if (field?.isApiKey && !values[key]?.trim()) return;

    setSaving(key);
    try {
      await api.setConfig(key, values[key]);
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  };

  if (!config) return <p style={{ color: '#666' }}>Loading…</p>;

  return (
    <div>
      <h2 style={heading}>Config</h2>
      <div style={{ maxWidth: 700 }}>
        {FIELDS.map(({ key, label, hint, isApiKey }) => {
          const alreadySet = isApiKey && getPath(config, key) === MASKED;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 220, flexShrink: 0 }}>
                <div style={{ fontSize: 14, color: '#333' }}>{label}</div>
                {hint && <div style={{ fontSize: 12, color: '#999' }}>{hint}</div>}
              </div>
              <input
                type={isApiKey ? 'password' : 'text'}
                value={values[key] ?? ''}
                placeholder={alreadySet ? 'already set — type to replace' : ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                style={{ flex: 1, padding: '7px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
              />
              <button
                onClick={() => void handleSave(key)}
                disabled={saving === key || (isApiKey === true && !values[key]?.trim())}
                style={{
                  padding: '7px 14px',
                  background: saved === key ? '#16a34a' : (saving === key || (isApiKey === true && !values[key]?.trim())) ? '#cbd5e1' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: (saving === key || (isApiKey === true && !values[key]?.trim())) ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  minWidth: 60,
                }}
              >
                {saved === key ? 'Saved' : saving === key ? '…' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700 };
