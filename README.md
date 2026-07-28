# ✈️ Trip Planner

Describe a trip in plain words → an AI returns a structured day-by-day itinerary → expand stops for details, reorder them, remove them (with undo), and it all survives a refresh.

Not a chatbot: the model returns JSON that is parsed, validated, repaired when broken, and rendered as interactive components.

## Setup

```bash
npm install && npm start
```

That's it — the app opens at **http://localhost:5173** and **works immediately with no API key** (it falls back to a deterministic mock provider so you can try every interaction and failure state offline).

To use a real LLM (Groq, free tier):

```bash
cp .env.example .env
# add: GROQ_API_KEY=gsk_...   (https://console.groq.com/keys)
npm start
```

`npm start` runs two processes: the Vite dev server (:5173) and a small Express API (:8787). The browser talks only to `/api/*`, which Vite proxies to Express. **The API key is read exclusively by the Node server** — it has no `VITE_` prefix, so Vite can never inline it into the bundle (verified: `grep -ric "gsk_\|GROQ" dist/assets/` → 0 after build).

Other commands: `npm test` (26 unit tests), `npm run build` (type-check + production build).

## Usage

1. Type a trip ("5 days in Lisbon, food-focused, mid-budget") or tap an example chip. ⌘/Ctrl+Enter submits.
2. Each stop expands for description/tip, moves up/down (buttons or **Alt+↑/↓** on a focused card), or can be removed — removal shows an **Undo** toast.
3. The trip persists in localStorage; refresh and it's still there.
4. **Fault injection** — start a prompt with a magic token to reproduce any failure mode on demand (works in mock mode):

| Prompt starts with | What you'll see |
|---|---|
| `fail:malformed` | Truncated fenced JSON → **salvaged** into a partial itinerary |
| `fail:shape` | Wrong JSON shape → repair retry → typed error with details |
| `fail:repair` | Wrong shape on attempt 1, fixed by the repair round-trip (footer shows "1 repair attempt") |
| `fail:refusal` | Model refuses in prose → UNPARSEABLE error + raw response viewer |
| `fail:empty` | Empty response twice → EMPTY error |
| `fail:slow` | 45s hang → 30s timeout error with cancel available throughout |
| `fail:429` / `fail:auth` / `fail:500` | Rate-limit / bad-key / provider errors, each with tailored copy |

## How bad AI output is handled (the interesting part)

Every response walks down a recovery ladder — each rung recovers a real failure mode observed from LLMs:

1. **Prompt engineering** — JSON mode, explicit field-by-field schema, one few-shot example, hard bounds (≤14 days, ≤8 stops/day), and "if it's not a trip, return `{days: []}`" so even nonsense input has a valid shape.
2. **`extractJson`** ([shared/extractJson.ts](shared/extractJson.ts)) — strips markdown fences, finds JSON buried in prose (string-aware balanced-brace scan), fixes trailing commas/smart quotes, and closes truncated output so complete days survive a mid-object cutoff.
3. **`normalize`** ([shared/normalize.ts](shared/normalize.ts)) — tolerates wrapper keys (`{trip: {...}}`), field aliases (`activities`→`stops`, `title`→`name`), `"Day 1"`→`1`, `"2h"`→`120`; **salvages** valid stops and reports what it dropped as warnings (rendered as a dismissible partial-result notice, not a hard error).
4. **Zod validation** ([shared/schema.ts](shared/schema.ts)) — the single schema imported by **both** server and client; the client re-validates the server's response because a deployed server is still untrusted input (this also catches schema drift).
5. **One bounded repair round-trip** — validation errors are fed back to the model once; original call + repair share a single 30s wall-clock deadline so retries can't stack latency.
6. **Typed errors** — every failure becomes one of 9 codes (`TIMEOUT`, `RATE_LIMIT`, `AUTH`, `UNPARSEABLE`, `INVALID_SHAPE`, `EMPTY`, …) with its own copy, recovery action, and (for parse failures, dev only) a raw-response viewer.
7. **Stale-response guard** — `AbortController` cancels superseded requests **and** a monotonic request id is checked after every `await` before any state commit. Abort alone is insufficient: a response can resolve past its awaits before the signal lands. See [useGeneration.ts](src/features/itinerary/hooks/useGeneration.ts).
8. **Two error boundaries** — one app-level, one isolating just the AI-rendered tree, so a render crash in model-derived data degrades to "regenerate?" while the prompt form keeps working. (Boundaries catch render errors only; async errors take the typed path above.)

The parse pipeline is covered by **26 unit tests** over a corpus of real-world bad outputs ([tests/fixtures/badOutputs.ts](tests/fixtures/badOutputs.ts)): fenced, prose-wrapped, truncated, trailing commas, smart quotes, wrong shape, missing names, oversized, refusals, empty.

## Architecture

```
shared/    schema (Zod, single source of truth), extractJson, normalize, Result union
server/    Express dev server → framework-agnostic handler → provider layer (groq | mock)
src/       feature folder: reducer (+undo history) → hooks → memoized components
tests/     pure-function tests over the parse pipeline and reducer
```

Key decisions and why:

- **`useReducer` + context, no state library** — the itinerary is one serializable document; a pure reducer gives unit-testability, localStorage persistence, and undo/redo (~20 lines) for free. Redux/Zustand would be surface area without benefit at this scope.
- **Reorder via buttons + keyboard, not HTML5 drag** — the assignment requires *reorder*, not drag-and-drop. HTML5 DnD doesn't work on touch and isn't accessible; buttons work everywhere. The reducer's `MOVE_STOP {from, to}` action means dnd-kit could be added later without any state changes.
- **No AI SDK, plain `fetch`** — the Groq client is ~40 lines I can fully explain, which beats a dependency abstraction for this scope.
- **No streaming (deliberate)** — you can't schema-validate a half-emitted JSON object, and a partially-validated itinerary is exactly the unreliable UI this assignment tests against. Narrated staged loading + skeletons cover the perceived-latency gap. With more time: stream with a partial-JSON parser and render days as they complete validation.
- **Stable ids generated at ingest** — array indices as React keys would silently corrupt expansion state on reorder/remove.
- **Accessibility** — `aria-expanded`/`aria-controls` disclosure, labelled icon buttons ("Move São Jorge Castle up"), `aria-live` announcements ("Stop moved to position 2 of 4"), focus management after remove (next stop's remove button) and after generation (result heading), `prefers-reduced-motion` gate on all animation, 44px touch targets, dark mode with token-level contrast.

## AI usage note

This project was built with heavy AI assistance — **Claude Code wrote most of the code, working from my direction and review**. Concretely: I used it to analyze the assignment brief, plan the architecture and milestone order, generate the components/tests/server code, and verify behaviour (it drove the running app with a headless browser and screenshotted every state). The failure-mode taxonomy, the recovery-ladder design, and every library decision above were made deliberately in the planning phase before code was written, and I reviewed and can explain every file. Being honest: the ratio of AI-generated to hand-typed code here is very high; the engineering judgment about *what* to build and *why* is where my time went.

## Known limitations

- Reordering is within a day only — no cross-day moves (the reducer action structure supports adding it).
- Undo reverts the most recent edit; the toast's "Undo" is a shortcut to the same single history stack.
- The refinement loop (follow-up prompts editing the existing result) is not implemented — regenerate replaces the trip after a confirm.
- Not deployed (ran out of budgeted time). Next step: a Vercel serverless wrapper around the existing framework-agnostic `server/handler.ts` — it was designed for exactly that.
- Mock mode's itinerary is a fixed Lisbon fixture, so every keyless generation looks the same.

## Time spent

**~4 hours of actual work**, in this order: ~1h reading the brief and planning the architecture against the evaluation criteria, ~2h implementation (resilience core → server → UI → states → a11y/persistence), ~1h verification (tests, type-check, driving the app in a browser at desktop/mobile sizes, both themes) and this README. That total is only possible because of the AI assistance described above; the same scope hand-typed would have taken me well past the 8-hour budget.

**What I'd do next** (in priority order): deploy to Vercel · refinement loop (`mode: 'refine'` sending the current itinerary + follow-up) · cross-day reordering / dnd-kit drag with keyboard sensors · multiple saved trips · streaming with progressive per-day validation.
