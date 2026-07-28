import { useEffect, useState } from 'react';

const MESSAGES = [
  'Asking the model for a plan…',
  'Validating the itinerary…',
  'Almost there — polishing the days…',
];

/** Skeleton in the shape of the coming result + narrated progress. */
export function LoadingSkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIndex((i) => Math.min(i + 1, MESSAGES.length - 1)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div aria-hidden="true" className="space-y-6">
      <p className="text-sm text-muted">{MESSAGES[msgIndex]}</p>
      <div className="space-y-2">
        <div className="skeleton h-7 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
      </div>
      {[0, 1, 2].map((day) => (
        <div key={day} className="space-y-2" style={{ animationDelay: `${day * 120}ms` }}>
          <div className="skeleton h-4 w-28" />
          {[0, 1, 2].map((row) => (
            <div key={row} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
