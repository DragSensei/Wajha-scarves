---
name: optimize
description: >
  Use this skill when the user types /optimize, asks about performance, data saving,
  making code "lighter" or more efficient, or mentions "life hacks" for speed or
  resource usage. Trigger it for any request involving reducing memory, CPU, network
  payloads, startup time, battery drain, or lag — including cases where the user
  just says "make this faster" or "cut down the data usage". Always measure before
  changing anything, work in small measurable milestones, and never sacrifice
  correctness, security, or readability without explicit justification. Applies to
  any codebase: web app, backend, game, or mobile.
---

# Optimize

## Why this exists

Code that "works" is not enough when it burns through memory, chokes on real-world
data, or wastes users' bandwidth. Optimisation is a disciplined engineering activity:
measure, plan, change — never the other way around. This skill also surfaces "life
hacks": small, safe micro-optimisations that add up without making code unreadable.

## Non-negotiables

- **No baseline, no change.** If you can't quantify "before", you can't prove "after"
  is better. Use profilers, heap snapshots, network waterfalls, or benchmark tests —
  not intuition.
- **Correctness beats speed.** An optimisation that silently breaks an edge case is a
  regression. Every change passes existing tests; high-risk paths get a new test
  before the optimisation lands.
- **Small, revertible milestones.** Each step is independently measurable, testable,
  and revertible.
- **Security stays intact.** Never weaken a permission check, skip validation, or
  expose internal state to save cycles or bytes.
- **Readability trades must justify themselves.** 0.5% speedup that obscures five
  clear lines → bad trade. 40% memory reduction on a hot path → may justify modest
  complexity, but document the "why".

## Phase 0 — Orient

Before hunting for optimisations, answer three questions:

1. **What matters?** Target devices (low-end mobile? server SLOs?), network conditions
   (3G? metered?), user-visible metrics (TTI, frame rate, p99 latency, payload size).
2. **What tools exist?** Browser DevTools, Node `--inspect`/clinic, Python `cProfile`/
   `memory_profiler`, Unity Profiler, `perf`. Use what's already in the project.
3. **What budgets exist?** Bundle size limits, Lighthouse thresholds, CI perf gates.
   Don't undo tree-shaking, minification, or code splitting that's already set up.

## Phase 1 — Profile & collect data

Find what's actually consuming resources. Record concrete numbers.

- **CPU:** profile under realistic load, sort by self-time. Watch for functions called
  far more than expected, synchronous work on the main thread, computation inside
  loops/rendering.
- **Memory:** heap snapshots before/after a key workflow. Retained objects that should
  be GC'd, unbounded caches, accidental closures holding references.
- **Network:** capture waterfall logs, check payload sizes. Over-fetching, missing
  compression (gzip/brotli), repeated identical requests, missing cache headers.
- **Startup:** large bundles, synchronous file reads, expensive import-time side
  effects, render-blocking resources.
- **UI jank:** long tasks blocking main thread, unnecessary re-renders, layout
  thrashing, expensive per-frame ops.

## Phase 2 — Triage & prioritise

Rank each finding by:

| Factor | Question |
|--------|----------|
| **User impact** | Does the user feel this? A 2s faster page load > 100ms on a background job. |
| **Severity** | 200MB leak > 10KB cache that never grows. |
| **Frequency** | Every click > once at startup. |
| **Risk** | Library swap (low) vs. state re-architecture (high). |
| **Effort** | Prefer life hacks (small, proven tricks) that deliver big wins first. |

Build an ordered backlog. Data-saving wins that reduce bandwidth/storage cost go near
the top.

## Phase 3 — Design

For each prioritised item, before touching code:

- **What changes** — algorithm swap? cache? lazy-load? compress responses? `Set`
  instead of array? virtualise a list? remove an unused dependency?
- **Expected gain** — predicted improvement + the measurement that confirms it.
- **Trade-offs** — more memory for a cache? stale-data risk? complexity increase?
  List them.
- **Ponytail check** — climb the ladder. Is there a stdlib/native/already-installed
  solution? Can it be one line? Don't build a custom cache class when
  `@lru_cache(maxsize=N)` exists.

## Phase 4 — Trace impact

Optimisations can subtly change behaviour. Before implementing, map:

- **All call sites / consumers** affected. If you alter a signature or return format,
  trace every caller — same thoroughness as the `/refactor` skill.
- **Tests** covering the affected code. If none exist, add a characterisation test
  before you change anything.
- **Edge cases** — empty inputs, nulls, concurrent calls, network failures under
  lazy loading.
- **Timing dependencies** — code relying on synchronous execution, precise ordering,
  or immediate side effects that your change might alter.

## Phase 5 — Build the milestone plan

**M0 — Measurement harness.** Set up a reproducible benchmark capturing "before"
numbers. Confirm it's stable and quick to run.

**M1..N — One optimisation per milestone.** Each:
- Implements one well-defined change.
- Includes "after" measurement compared to baseline.
- Passes full test suite.
- Touches nothing unrelated.

**Final — Clean up.** Remove temporary code, unused imports, old implementations.

Track in `OPTIMIZE_PLAN.md` (template below).

## Phase 6 — Execute & verify

- Run measurement harness before and after each milestone, log the delta.
- Run full test suite after each change.
- For UI changes, validate at target resolutions and on throttled devices — not just
  your fast dev machine.
- For network changes, check sizes with compression enabled (raw size misleads) and
  verify cache headers.

## Phase 7 — Close out

- Summarise every applied optimisation: what changed, before/after metric, trade-offs.
- Re-run the full performance benchmark suite to confirm holistic metrics didn't
  degrade.
- If security-sensitive code was touched, re-audit it.
- Document reusable patterns discovered (e.g., "switch heavy date lib to `Intl`").
- Delete or check in `OPTIMIZE_PLAN.md`.

## Life hacks quick-reference

Low-risk patterns that often yield easy wins. Apply only after confirming fit.

- **Native APIs first** — `URL` over manual parsing, `Intl` for i18n,
  `crypto.randomUUID()` over custom UUID lib.
- **Short-circuit early** — return/break/throw before unnecessary work.
- **Memoize pure functions** called frequently with identical args — only if profiling
  shows it helps and you manage invalidation.
- **Lazy-load heavy modules** — dynamic `import()` for rarely-used features.
- **Batch DOM reads/writes** — `requestAnimationFrame` to avoid layout thrashing.
- **Virtualise long lists** — render only visible rows.
- **Debounce/throttle** expensive handlers (scroll, resize, input).
- **Tree shaking** — ensure dead imports are eliminated; ES module syntax is usually
  enough.
- **Payload trimming** — strip null/default fields from JSON, use `?fields=` for
  sparse responses, binary format for large repetitive data.
- **Compress assets** — WebP/AVIF for images, Brotli for transfer, SVG for vectors.

## Security-sensitive optimisation

If an optimisation touches auth, validation, or encryption:

- Never short-circuit a security check for speed.
- Cached permission decisions: invalidate immediately on change, or per-session with
  short TTL.
- Never replace a cryptographic algorithm with a weaker but faster one.

## Tracking document

For anything beyond a trivial tweak, produce `OPTIMIZE_PLAN.md`:

```markdown
# Optimisation Plan: <short description>

## Baseline
- Metric: <time/memory/bytes> before: <value> (measured <date>, <environment>)
- Tool: <profiler/method>

## Issues (Phase 2)
1. [ ] <issue> — cost: <number>, impact: <high/medium/low>

## Planned optimisations
1. <description> — expected gain: <delta>, trade-offs: <…>

## Impact trace (Phase 4)
- [ ] <file>:<line> — affected call site / test
- [ ] Edge case: <scenario>

## Milestones
- [ ] M0 — Measurement harness
- [ ] M1 — <step> → measured <after>
- [ ] Final — Cleanup
```

## Anti-patterns to avoid

- Optimising without a baseline measurement ("it felt faster").
- Guessing the bottleneck instead of profiling.
- One giant change that touches everything — can't isolate what helped or broke.
- Sacrificing security for speed (skipping validation, weakening crypto).
- Over-optimising a cold path nobody hits while ignoring the hot path.
- Adding a new dependency to "optimise" when stdlib or a one-liner suffices.
