import { useEffect, useState } from 'react';

const MESSAGES = [
  '✈️  Planning your perfect trip…',
  '🗺️  Building your day-by-day itinerary…',
  '✨  Almost there — polishing the details…',
];

export function LoadingSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Status message */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'rgba(108,99,255,0.08)',
        border: '1px solid rgba(108,99,255,0.18)',
      }}>
        <div style={{
          position: 'relative',
          width: 18, height: 18, flexShrink: 0,
        }}>
          <div style={{
            width: 18, height: 18,
            borderRadius: '50%',
            border: '2px solid rgba(108,99,255,0.3)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink)', margin: 0, fontWeight: 500 }}>
          {MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Header skeleton */}
      <div
        className="glass"
        style={{ borderRadius: '20px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div className="skeleton" style={{ height: 28, width: '60%' }} />
        <div className="skeleton" style={{ height: 16, width: '40%' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {[80, 60, 90].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 26, width: w, borderRadius: 999 }} />
          ))}
        </div>
      </div>

      {/* Day skeletons */}
      {[0, 1, 2].map((day) => (
        <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '8px', animationDelay: `${day * 100}ms` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div className="skeleton" style={{ height: 24, width: 70, borderRadius: 999 }} />
            <div className="skeleton" style={{ height: 16, width: 120 }} />
          </div>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="skeleton"
              style={{ height: 66, borderRadius: 14, animationDelay: `${(day * 3 + row) * 60}ms` }}
            />
          ))}
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
