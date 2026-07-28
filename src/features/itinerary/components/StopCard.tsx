import { memo, type KeyboardEvent } from 'react';
import type { Stop } from '@shared/schema';

const CATEGORY_ICONS: Record<string, string> = {
  food:      '🍽️',
  culture:   '🏛️',
  nature:    '🌿',
  shopping:  '🛍️',
  nightlife: '🌙',
  transit:   '🚆',
  activity:  '🥾',
};

const CATEGORY_COLORS: Record<string, string> = {
  food:      'rgba(255,101,132,0.15)',
  culture:   'rgba(108,99,255,0.15)',
  nature:    'rgba(67,233,123,0.15)',
  shopping:  'rgba(250,130,49,0.15)',
  nightlife: 'rgba(155,89,182,0.15)',
  transit:   'rgba(79,172,254,0.15)',
  activity:  'rgba(255,209,102,0.15)',
};

interface Props {
  stop: Stop;
  dayId: string;
  index: number;
  count: number;
  expanded: boolean;
  onToggle: (stopId: string) => void;
  onMove: (dayId: string, from: number, to: number) => void;
  onRemove: (dayId: string, stopId: string, index: number) => void;
}

export const StopCard = memo(function StopCard({
  stop, dayId, index, count, expanded, onToggle, onMove, onRemove,
}: Props) {
  const panelId = `stop-panel-${stop.id}`;
  const icon = stop.category ? (CATEGORY_ICONS[stop.category] ?? '📍') : '📍';
  const iconBg = stop.category ? (CATEGORY_COLORS[stop.category] ?? 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.06)';

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); onMove(dayId, index, index - 1); }
    else if (e.key === 'ArrowDown' && index < count - 1) { e.preventDefault(); onMove(dayId, index, index + 1); }
  };

  const meta = [
    stop.time,
    stop.durationMinutes && formatDuration(stop.durationMinutes),
    stop.cost,
  ].filter(Boolean).join(' · ');

  return (
    <li
      className="rise stop-card"
      onKeyDown={onKeyDown}
      data-stop-card={stop.id}
    >
      {/* Main Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 12px 12px 14px' }}>

        {/* Expand button */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(stop.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: '4px 4px 4px 0',
            borderRadius: '10px',
          }}
        >
          {/* Icon badge */}
          <span
            aria-hidden="true"
            style={{
              width: 38, height: 38,
              borderRadius: '10px',
              background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            {icon}
          </span>

          {/* Text */}
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: 'var(--ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {stop.name}
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.75rem',
              color: 'var(--muted)',
              marginTop: '2px',
            }}>
              {meta || 'tap for details'}
            </span>
          </span>

          {/* Chevron */}
          <span
            aria-hidden="true"
            style={{
              color: 'var(--muted)',
              fontSize: '0.8rem',
              transition: 'transform 220ms ease',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          >
            ▾
          </span>
        </button>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginLeft: '4px' }}>
          <button
            className="icon-btn"
            aria-label={`Move ${stop.name} up`}
            disabled={index === 0}
            onClick={() => onMove(dayId, index, index - 1)}
          >↑</button>
          <button
            className="icon-btn"
            aria-label={`Move ${stop.name} down`}
            disabled={index === count - 1}
            onClick={() => onMove(dayId, index, index + 1)}
          >↓</button>
          <button
            className="icon-btn danger"
            aria-label={`Remove ${stop.name}`}
            onClick={() => onRemove(dayId, stop.id, index)}
            data-remove-button
          >✕</button>
        </div>
      </div>

      {/* Expanded Panel */}
      <div className="disclosure" data-open={expanded} id={panelId}>
        <div>
          {expanded && (
            <div style={{
              borderTop: '1px solid var(--edge)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {stop.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                  {stop.description}
                </p>
              )}
              {stop.tip && (
                <div style={{
                  background: 'rgba(108,99,255,0.08)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.8rem',
                  color: 'var(--ink)',
                  display: 'flex',
                  gap: '8px',
                }}>
                  <span>💡</span>
                  <span><strong>Tip:</strong> {stop.tip}</span>
                </div>
              )}
              {!stop.description && !stop.tip && (
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                  No extra details for this stop.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
});

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
