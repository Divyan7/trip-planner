import { memo, type KeyboardEvent } from 'react';
import type { Stop } from '@shared/schema';
import { IconButton } from '@/components/ui/Button';

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽',
  culture: '🏛',
  nature: '🌿',
  shopping: '🛍',
  nightlife: '🌙',
  transit: '🚆',
  activity: '🥾',
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

/**
 * Memoized: reordering or expanding one stop must not re-render the
 * other ~100 cards. All callbacks come from the reducer layer with
 * stable identity.
 */
export const StopCard = memo(function StopCard({
  stop,
  dayId,
  index,
  count,
  expanded,
  onToggle,
  onMove,
  onRemove,
}: Props) {
  const panelId = `stop-panel-${stop.id}`;
  const icon = stop.category ? (CATEGORY_ICONS[stop.category] ?? '📍') : '📍';

  // Alt+Arrow reorders from anywhere inside the card.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!e.altKey) return;
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      onMove(dayId, index, index - 1);
    } else if (e.key === 'ArrowDown' && index < count - 1) {
      e.preventDefault();
      onMove(dayId, index, index + 1);
    }
  };

  return (
    <li
      className="rise rounded-xl border border-edge bg-raised transition-shadow hover:card-shadow"
      onKeyDown={onKeyDown}
      data-stop-card={stop.id}
    >
      <div className="flex items-center gap-1 p-2 pl-3 sm:gap-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(stop.id)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
        >
          <span aria-hidden="true" className="text-lg">
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold [overflow-wrap:anywhere]">{stop.name}</span>
            <span className="block text-xs text-muted">
              {[stop.time, stop.durationMinutes && formatDuration(stop.durationMinutes), stop.cost]
                .filter(Boolean)
                .join(' · ') || 'tap for details'}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </button>
        <div className="flex shrink-0 items-center">
          <IconButton
            aria-label={`Move ${stop.name} up to position ${index} of ${count}`}
            disabled={index === 0}
            onClick={() => onMove(dayId, index, index - 1)}
          >
            ↑
          </IconButton>
          <IconButton
            aria-label={`Move ${stop.name} down to position ${index + 2} of ${count}`}
            disabled={index === count - 1}
            onClick={() => onMove(dayId, index, index + 1)}
          >
            ↓
          </IconButton>
          <IconButton
            aria-label={`Remove ${stop.name}`}
            className="hover:bg-danger-soft hover:text-danger"
            onClick={() => onRemove(dayId, stop.id, index)}
            data-remove-button
          >
            ✕
          </IconButton>
        </div>
      </div>
      <div className="disclosure" data-open={expanded} id={panelId}>
        <div>
          {/* Collapsed panels render no children at all. */}
          {expanded && (
            <div className="space-y-2 border-t border-edge px-4 py-3 text-sm">
              {stop.description && <p className="text-ink/90">{stop.description}</p>}
              {stop.tip && (
                <p className="rounded-lg bg-accent-soft px-3 py-2 text-xs">
                  <span aria-hidden="true">💡 </span>
                  <span className="font-semibold">Tip:</span> {stop.tip}
                </p>
              )}
              {!stop.description && !stop.tip && (
                <p className="text-xs text-muted">No extra details for this stop.</p>
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
