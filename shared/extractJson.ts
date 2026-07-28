/**
 * Pull a JSON object out of raw LLM text. Models wrap JSON in markdown
 * fences, add prose around it, use smart quotes, leave trailing commas,
 * or get truncated mid-object — each layer here recovers one of those.
 *
 * Returns the parsed value, or null if nothing parseable was found.
 */
export function extractJson(raw: string): unknown | null {
  if (!raw || !raw.trim()) return null;

  let text = stripFences(raw.trim());

  // Fast path: the whole thing is valid JSON.
  const direct = tryParse(text);
  if (direct !== undefined) return direct;

  // Find the first balanced {...} block, ignoring braces inside strings.
  const block = firstBalancedObject(text);
  if (block) {
    const parsed = tryParse(block) ?? tryParse(lenientFix(block));
    if (parsed !== undefined) return parsed;
  }

  // Truncated output: take from the first '{' and close what's open.
  const start = text.indexOf('{');
  if (start !== -1) {
    const repaired = closeTruncated(text.slice(start));
    if (repaired) {
      const parsed = tryParse(repaired) ?? tryParse(lenientFix(repaired));
      if (parsed !== undefined) return parsed;
    }
  }

  return null;
}

function tryParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function stripFences(text: string): string {
  // ```json ... ``` or ``` ... ``` — take the fenced body if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  // Unclosed fence (truncated response): drop the opening marker.
  return text.replace(/^```(?:json)?\s*/i, '').trim();
}

/** Scan for the first complete top-level {...}, string-aware. */
function firstBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Fix the common non-standard bits models emit. */
function lenientFix(text: string): string {
  return (
    text
      // Smart quotes → straight quotes.
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      // Trailing commas before a closer.
      .replace(/,\s*([}\]])/g, '$1')
  );
}

/**
 * Close a truncated JSON fragment: drop any incomplete trailing value,
 * then append the closers for every still-open brace/bracket.
 */
function closeTruncated(fragment: string): string | null {
  // Cut back to the last "complete" boundary: a closer or a comma.
  let cut = fragment.length;
  for (let i = fragment.length - 1; i > 0; i--) {
    const ch = fragment[i];
    if (ch === '}' || ch === ']') {
      cut = i + 1;
      break;
    }
  }
  let body = fragment.slice(0, cut).replace(/,\s*$/, '');

  const closers: string[] = [];
  let inString = false;
  let escaped = false;
  for (const ch of body) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') closers.push('}');
    else if (ch === '[') closers.push(']');
    else if (ch === '}' || ch === ']') closers.pop();
  }
  if (inString) return null; // Cut mid-string — not worth salvaging.
  if (!closers.length) return body;
  return body + closers.reverse().join('');
}
