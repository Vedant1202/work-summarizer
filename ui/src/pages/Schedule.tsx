import { useEffect, useState } from 'react';
import { api, ScheduleStatus } from '../api';

export default function Schedule() {
  const [status, setStatus] = useState<ScheduleStatus | null>(null);
  const [time, setTime] = useState('08:00');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const s = await api.getSchedule();
    setStatus(s);
    if (s.time) setTime(s.time);
  };

  useEffect(() => { void load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.setSchedule(time);
      await load();
      setMsg(`Plist written for ${time}. To activate: launchctl load ~/Library/LaunchAgents/com.daily-summary.plist`);
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.removeSchedule();
      await load();
      setMsg('Schedule removed.');
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!status) return <p style={{ color: '#666' }}>Loading…</p>;

  return (
    <div>
      <h2 style={heading}>Schedule</h2>

      {status.platform === 'linux' && (
        <div style={infoBox}>
          Linux scheduling requires manual crontab setup. Use{' '}
          <code>daily-summary schedule --time HH:MM</code> in your terminal for the crontab line.
        </div>
      )}

      {status.platform === 'macos' && (
        <>
          <div style={{ marginBottom: 20, color: '#555', fontSize: 14 }}>
            Status:{' '}
            <strong style={{ color: status.scheduled ? '#22543d' : '#666' }}>
              {status.scheduled ? `Scheduled at ${status.time}` : 'Not scheduled'}
            </strong>
            {status.scheduled && !status.loaded && (
              <span style={{ color: '#2563eb', marginLeft: 8 }}>(plist exists but not loaded — run launchctl load)</span>
            )}
            {status.scheduled && status.loaded && (
              <span style={{ color: '#276749', marginLeft: 8 }}>(active)</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 14 }}>Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
            />
            <button onClick={() => void handleSave()} disabled={saving} style={btn(saving)}>
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
            {status.scheduled && (
              <button
                onClick={() => void handleRemove()}
                disabled={saving}
                style={{ ...btn(saving), background: saving ? '#ccc' : '#c53030' }}
              >
                Remove
              </button>
            )}
          </div>

          {msg && (
            <div style={{ ...infoBox, marginTop: 12, color: msg.startsWith('Error') ? '#c53030' : '#333' }}>
              {msg}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 700 };
const infoBox: React.CSSProperties = { background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, fontSize: 14, color: '#555' };

function btn(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    background: disabled ? '#cbd5e1' : '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
  };
}
