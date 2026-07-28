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
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Something went wrong</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>Reloading the page will recover your saved trip.</p>
          <button
            type="button"
            className="btn-glow mt-6 rounded-xl px-6 py-2.5 font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )}
    >
      <AnnouncerProvider>
        <ToastProvider>
          {/* ── Top Nav ── */}
          <header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              borderBottom: '1px solid var(--edge)',
              background: 'rgba(13,15,20,0.8)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <div style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding: '0 20px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 34, height: 34,
                  borderRadius: '10px',
                  background: 'var(--gradient-hero)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                  boxShadow: '0 0 16px var(--accent-glow)',
                }}>
                  ✈️
                </div>
                <span style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.02em',
                  background: 'var(--gradient-hero)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  TripAI
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: 'rgba(108,99,255,0.2)',
                  border: '1px solid rgba(108,99,255,0.35)',
                  color: 'var(--accent)',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  Beta
                </span>
              </div>
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
