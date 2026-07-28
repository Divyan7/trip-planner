interface Props {
  variant: 'first-run' | 'no-results';
}

export function EmptyState({ variant }: Props) {
  if (variant === 'no-results') {
    return (
      <div className="rise mx-auto max-w-md rounded-2xl border border-dashed border-edge p-8 text-center">
        <p aria-hidden="true" className="text-3xl">🗺</p>
        <h2 className="mt-2 text-lg font-bold">No itinerary came back</h2>
        <p className="mt-1 text-sm text-muted">
          The model couldn’t make a trip out of that. Try adding a destination and a number of days —
          e.g. “4 days in Rome, first visit”.
        </p>
      </div>
    );
  }

  return (
    <div className="rise mx-auto max-w-md py-6 text-center sm:py-10">
      <p aria-hidden="true" className="text-4xl">✈️</p>
      <h2 className="mt-3 text-xl font-bold">Plan a trip in seconds</h2>
      <p className="mt-2 text-sm text-muted">
        Describe where you want to go and what you enjoy. You’ll get a day-by-day plan you can
        expand, reorder, and edit — try an example above.
      </p>
    </div>
  );
}
