import { useEffect, useState } from 'react';
import { marked } from 'marked';
import { api, ReportMeta, ReportContent } from '../api';

export default function Reports() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<ReportContent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listReports().then(setReports);
  }, []);

  const handleSelect = async (filePath: string) => {
    setLoading(true);
    try {
      const r = await api.getReportByPath(filePath);
      setSelected(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      <div style={{ width: 200, flexShrink: 0, overflowY: 'auto' }}>
        <h2 style={{ ...heading, fontSize: 18 }}>Reports</h2>
        {reports.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>No reports yet.</p>}
        {reports.map((r) => {
          const isSelected = selected?.filePath === r.filePath;
          return (
            <button
              key={r.filePath}
              onClick={() => void handleSelect(r.filePath)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                marginBottom: 4,
                background: isSelected ? '#111' : '#fff',
                color: isSelected ? '#fff' : '#333',
                border: '1px solid #e5e5e5',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 600 }}>{r.date}</div>
              <div style={{ fontSize: 11, color: isSelected ? '#aaa' : '#999', marginTop: 2 }}>
                {r.repoName}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 8, padding: 28, overflowY: 'auto' }}>
        {loading && <p style={{ color: '#666' }}>Loading…</p>}
        {!loading && !selected && <p style={{ color: '#bbb' }}>Select a report to view it.</p>}
        {!loading && selected && (
          <div
            dangerouslySetInnerHTML={{ __html: marked(selected.content) as string }}
            style={{ lineHeight: 1.7, fontSize: 15, color: '#222' }}
          />
        )}
      </div>
    </div>
  );
}

const heading: React.CSSProperties = { marginTop: 0, marginBottom: 16, fontWeight: 700 };
