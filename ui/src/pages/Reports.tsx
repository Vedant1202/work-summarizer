import { useEffect, useState, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import { api, ReportMeta, ReportContent } from '../api';

const ACCENT = '#2563eb';
const BORDER = '#e2e8f0';
const TEXT = '#1e293b';
const MUTED = '#64748b';

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Reports() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<ReportContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const loadList = useCallback(() => {
    api.listReports().then((list) => {
      setReports(list);
      // Expand the most-recent day by default
      if (list.length > 0) {
        setExpanded(new Set([list[0].date]));
      }
    });
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const handleSelect = async (filePath: string) => {
    setLoading(true);
    try {
      const r = await api.getReportByPath(filePath);
      setSelected(r);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (date: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.date.includes(q) ||
        r.repoName.toLowerCase().includes(q) ||
        (r.time ?? '').includes(q),
    );
  }, [reports, search]);

  const grouped = useMemo(() => {
    const map: Record<string, ReportMeta[]> = {};
    for (const r of filtered) {
      (map[r.date] ??= []).push(r);
    }
    return map;
  }, [filtered]);

  const sortedDates = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 120px)' }}>
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: TEXT }}>Reports</h2>
          <button
            onClick={loadList}
            title="Refresh list"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, fontSize: 16, padding: '2px 4px', lineHeight: 1 }}
          >
            ↺
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by date, project, time…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '7px 10px',
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            fontSize: 13,
            color: TEXT,
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = BORDER)}
        />

        {/* Day groups */}
        {sortedDates.length === 0 && (
          <p style={{ color: MUTED, fontSize: 14 }}>{reports.length === 0 ? 'No reports yet.' : 'No results.'}</p>
        )}

        {sortedDates.map((date) => {
          const isOpen = expanded.has(date);
          const items = grouped[date];
          return (
            <div key={date}>
              {/* Day header */}
              <button
                onClick={() => toggleDay(date)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${BORDER}`,
                  padding: '6px 0',
                  cursor: 'pointer',
                  color: ACCENT,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 10, transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                {dayLabel(date)}
                <span style={{ marginLeft: 'auto', color: MUTED, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                  {items.length}
                </span>
              </button>

              {/* Report items */}
              {isOpen && (
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {items.map((r) => {
                    const isSelected = selected?.filePath === r.filePath;
                    return (
                      <button
                        key={r.filePath}
                        onClick={() => void handleSelect(r.filePath)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 10px',
                          background: isSelected ? ACCENT : '#fff',
                          color: isSelected ? '#fff' : TEXT,
                          border: `1px solid ${isSelected ? ACCENT : BORDER}`,
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {r.time && (
                            <span style={{ fontWeight: 600, fontSize: 12, color: isSelected ? '#bfdbfe' : ACCENT, flexShrink: 0 }}>
                              {r.time}
                            </span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.repoName}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content panel */}
      <div
        style={{
          flex: 1,
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: 28,
          overflowY: 'auto',
        }}
      >
        {loading && <p style={{ color: MUTED }}>Loading…</p>}
        {!loading && !selected && (
          <p style={{ color: '#cbd5e1' }}>Select a report to view it.</p>
        )}
        {!loading && selected && (
          <>
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 13, color: MUTED }}>
                {dayLabel(selected.date)}
                {selected.time && <span> · {selected.time}</span>}
                {selected.repoName && <span> · {selected.repoName}</span>}
              </div>
            </div>
            <div
              className="md-body"
              dangerouslySetInnerHTML={{ __html: marked(selected.content) as string }}
            />
          </>
        )}
      </div>
    </div>
  );
}

