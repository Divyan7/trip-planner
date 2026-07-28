import { useCallback, useEffect, useRef, useState } from 'react';
import { requestItinerary, type GenerationSuccess } from '@/lib/apiClient';
import type { Err } from '@shared/result';

export type GenerationState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; error: Err };

/**
 * Request lifecycle with a belt-and-braces stale-response guard:
 *
 *  - AbortController cancels the previous network request, AND
 *  - a monotonically increasing request id is captured per call and
 *    compared after EVERY await before any state commit.
 *
 * Abort alone is not enough — a response can resolve and continue past
 * its awaits before the abort signal lands, and validation itself happens
 * after further awaits. The id check makes late commits impossible.
 */
export function useGeneration(onSuccess: (result: GenerationSuccess) => void) {
  const [state, setState] = useState<GenerationState>({ phase: 'idle' });
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const generate = useCallback(
    async (prompt: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const myId = ++requestIdRef.current;

      setState({ phase: 'loading' });
      try {
        const result = await requestItinerary(prompt, controller.signal);
        if (myId !== requestIdRef.current || !mountedRef.current) return; // stale — drop silently
        if (result.ok) {
          setState({ phase: 'idle' });
          onSuccess(result.data);
        } else {
          setState({ phase: 'error', error: result });
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // cancelled on purpose
        if (myId !== requestIdRef.current || !mountedRef.current) return;
        setState({
          phase: 'error',
          error: { ok: false, code: 'UNKNOWN', message: 'Something unexpected went wrong.' },
        });
      }
    },
    [onSuccess],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    requestIdRef.current++; // invalidate anything in flight
    setState({ phase: 'idle' });
  }, []);

  const dismissError = useCallback(() => setState({ phase: 'idle' }), []);

  return { state, generate, cancel, dismissError };
}
