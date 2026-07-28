import { describe, expect, it } from 'vitest';
import { extractJson } from '../shared/extractJson';
import * as fx from './fixtures/badOutputs';

describe('extractJson', () => {
  it('parses clean JSON directly', () => {
    const out = extractJson(fx.VALID) as { title: string };
    expect(out.title).toBe('Lisbon in 3 days');
  });

  it('strips markdown code fences', () => {
    const out = extractJson(fx.FENCED) as { title: string };
    expect(out.title).toBe('Lisbon in 3 days');
  });

  it('finds JSON buried in prose', () => {
    const out = extractJson(fx.PROSE_WRAPPED) as { days: unknown[] };
    expect(out.days).toHaveLength(2);
  });

  it('tolerates trailing commas', () => {
    const out = extractJson(fx.TRAILING_COMMAS) as { title: string };
    expect(out.title).toBe('Kyoto weekend');
  });

  it('fixes smart quotes', () => {
    const out = extractJson(fx.SMART_QUOTES) as { title: string };
    expect(out.title).toBe('Rome dash');
  });

  it('recovers a truncated response by closing open structures', () => {
    const out = extractJson(fx.TRUNCATED) as { title: string; days: { stops: unknown[] }[] };
    expect(out.title).toBe('Iceland road trip');
    expect(out.days[0].stops.length).toBeGreaterThanOrEqual(2);
  });

  it('is not confused by braces inside strings', () => {
    const out = extractJson(fx.NESTED_BRACES_IN_STRINGS) as { title: string };
    expect(out.title).toContain('Berlin');
  });

  it('returns null for a refusal with no JSON', () => {
    expect(extractJson(fx.REFUSAL)).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(extractJson(fx.EMPTY_STRING)).toBeNull();
  });

  it('returns null for plain prose', () => {
    expect(extractJson(fx.NOT_JSON)).toBeNull();
  });
});
