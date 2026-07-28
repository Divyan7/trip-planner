import { ErrorBoundary } from './components/ErrorBoundary';
import { AnnouncerProvider } from './components/LiveRegion';
import { ToastProvider } from './components/Toast';
import { ThemeToggle } from './components/ThemeToggle';
import { ItineraryPage } from './features/itinerary/ItineraryPage';

export default function App() {
  return (
    <ErrorBoundary
      fallback={() => (
        <div role="alert" className="mx-auto mt-24 max-w-md px-4 text-center">
          <h1 className="text-xl font-bold">Trip Planner hit an unexpected error</h1>
          <p className="mt-2 text-sm text-muted">Reloading the page will recover your saved trip.</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-accent px-4 py-2 font-semibold text-on-accent"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )}
    >
      <AnnouncerProvider>
        <ToastProvider>
          <header className="sticky top-0 z-40 border-b border-edge bg-surface/90 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
              <h1 className="flex items-center gap-2 font-bold">
                <span aria-hidden="true">✈️</span> Trip Planner
              </h1>
              <ThemeToggle />
            </div>
          </header>
          <main>
            <ItineraryPage />
          </main>
        </ToastProvider>
      </AnnouncerProvider>
    </ErrorBoundary>
  );
}
