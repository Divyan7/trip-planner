import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: (reset: () => void) => ReactNode;
  /** Changing this key clears a caught error (e.g. on a new generation). */
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
}

/**
 * Catches RENDER errors — a crash while displaying AI-derived data must
 * degrade to a fallback, never a white screen. Async/fetch errors take
 * the typed-error path in useGeneration instead; boundaries can't see those.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[trip-planner] render crash:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return this.props.fallback(this.reset);
    return this.props.children;
  }
}
