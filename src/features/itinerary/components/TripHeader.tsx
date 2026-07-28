import { useMemo } from 'react';
import type { Itinerary } from '@shared/schema';

interface Props {
  itinerary: Itinerary;
  canUndo: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onUndo: () => void;
}

export function TripHeader({ itinerary, canUndo, onExpandAll, onCollapseAll, onUndo }: Props) {
  const stats = useMemo(() => {
    const stopCount = itinerary.days.reduce((n, d) => n + d.stops.length, 0);
    const minutes = itinerary.days
      .flatMap((d) => d.stops)
      .reduce((n, s) => n + (s.durationMinutes ?? 0), 0);
    return { stopCount, hours: Math.round(minutes / 60) };
  }, [itinerary]);

  return (
    <header
      className="glass rise"
      style={{
        borderRadius: '20px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.5rem' }}>🗺️</span>
          <h2
            tabIndex={-1}
            style={{
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              color: 'var(--ink)',
              margin: 0,
              wordBreak: 'break-word',
            }}
          >
            {itinerary.title}
          </h2>
        </div>
        {itinerary.summary && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            {itinerary.summary}
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
        {/* Stat chips */}
        {[
          { icon: '📅', label: `${itinerary.days.length} ${itinerary.days.length === 1 ? 'day' : 'days'}` },
          { icon: '📍', label: `${stats.stopCount} stops` },
          ...(stats.hours > 0 ? [{ icon: '⏱️', label: `~${stats.hours}h planned` }] : []),
        ].map(({ icon, label }) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(108,99,255,0.1)',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            <span>{icon}</span> {label}
          </span>
        ))}

        {/* Divider */}
        <span style={{ flex: 1 }} />

        {/* Action buttons */}
        {[
          { label: 'Expand all', onClick: onExpandAll },
          { label: 'Collapse all', onClick: onCollapseAll },
          ...(canUndo ? [{ label: '↩ Undo', onClick: onUndo }] : []),
        ].map(({ label, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            style={{
              background: 'var(--edge)',
              border: '1px solid var(--edge-strong)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = 'var(--ink)';
              (e.target as HTMLElement).style.background = 'var(--edge-strong)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = 'var(--muted)';
              (e.target as HTMLElement).style.background = 'var(--edge)';
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
