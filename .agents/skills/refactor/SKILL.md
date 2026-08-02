---
name: duplicate-code-refactor
description: Use this skill whenever the user wants to find duplicate or near-duplicate code and safely extract it into a shared function, module, class, or file to improve maintainability and security. Trigger this any time the user mentions duplicate code, code duplication, DRY, repeated logic, copy-pasted code, refactoring for maintainability, consolidating similar functions/components, or reducing risk from inconsistent copies of security-sensitive logic (auth checks, validation, sanitization, permission checks) — even if they don't say "duplicate" explicitly, e.g. "this logic is scattered everywhere" or "we keep fixing the same bug in two places." Always follow this skill's process — trace every call site and build a milestone-based migration plan — before touching any code, so extractions never break existing behavior. Applies to any codebase: web app, backend service, or game project.
---

# Duplicate Code Refactor & Safe Extraction

## Why this exists

Duplicated logic is a maintainability problem and a security problem. When a rule exists in three places and a fix only lands on one of them, the other two become active vulnerabilities or bugs waiting to resurface. This skill treats extraction as riskier than it looks and optimizes for **never breaking a call site**, even at the cost of moving slower.

## Non-negotiables — read before doing anything

- Never rewrite or delete duplicated code until every one of its usages has been enumerated (Phase 4) and the extraction has been verified. Enumeration always comes first.
- Work in small, individually-revertible milestones. Never bundle "extract the shared version" and "migrate all 40 call sites" into one change.
- Assume duplication is intentional until proven otherwise, especially in security code. Read each copy in full — don't assume two similar-looking blocks are identical.
- Respect the codebase's existing architecture (feature boundaries, layering rules, import restrictions) when choosing where extracted code lives. Don't introduce a new cross-boundary import just to save a function.

## Phase 0 — Orient in the codebase

Before hunting for duplication:

- Check for architecture docs, README notes, or lint config that constrain where shared code is allowed to live — a `shared/`, `common/`, or `core/` directory, an import-boundary linter, a monorepo package layout. Extracted code should land inside these rules, not around them.
- Identify the language(s)/framework(s) in play. Duplication looks different per stack: a frontend app duplicates hooks/components; a backend duplicates request validation or auth middleware; a game duplicates scripts attached to multiple GameObjects, prefabs, or scenes.
- Note the test setup (runner, coverage tooling) — every migrated call site needs a way to confirm its behavior didn't change.

## Phase 1 — Find duplication

Look for two kinds:

1. **Literal / near-literal duplication** — copy-pasted code, maybe with renamed variables. Fast to find with text search.
2. **Structural / semantic duplication** — different-looking code that enforces the same rule (two different permission checks that both mean "is this user an admin"). This is where security drift hides, and text search alone will miss it — find it by reading, not just grepping.

Practical approach:

- Use `grep`/`ripgrep` for repeated literal strings, function bodies, error messages, magic numbers/constants, and repeated import+usage patterns.
- If a duplicate-detection tool exists for the stack (jscpd for JS/TS, PMD CPD for Java and other languages, `pylint`'s duplicate-code checker for Python), run it for a first pass — then manually verify every hit. These tools catch literal similarity, miss semantic duplicates, and sometimes flag harmless coincidences.
- Prioritize scanning: auth/permission checks, input validation & sanitization, encryption/hashing/token generation, rate-limiting logic, error-message construction (inconsistency here can leak information), and anywhere a business-critical number lives (price, discount %, permission threshold). Duplication in these spots is the most damaging kind.

## Phase 2 — Triage & prioritize

For each finding, note:

- **Risk if inconsistent** — high for security/auth/validation/money logic, low for cosmetic formatting.
- **Size** — a 3-line duplicate rarely earns the churn of extraction; a 30-line block does.
- **Usage count** — 2 sites is low urgency, 10+ sites is high value.
- **Stability** — don't extract code still under active design; you'll just fight churn.

Order work by risk × usage-count, not by ease. Security-relevant duplication jumps the queue even when small.

## Phase 3 — Design the extraction target

Before writing any code, decide where the shared version goes:

- Function vs. module/file vs. class vs. shared component/hook vs. base class/service — pick the smallest unit that fully captures the shared behavior without forcing unrelated call sites to take on parameters they don't need.
- Name it for the guarantee it provides, not just the action — `assertUserIsAdmin` communicates a security invariant better than `checkUser`.
- Respect existing architecture: if the codebase enforces one-way import boundaries between features, the extraction target almost always belongs in the shared/core layer, not inside whichever feature currently duplicates it.
- Before assuming two copies are interchangeable, diff their actual behavior line by line. Slight differences between "duplicate" copies are the single most common cause of "the refactor broke something." The extracted version needs to cover the union of what every copy actually does.

## Phase 4 — Trace every usage (this is what prevents breakage)

Do not touch an existing call site until this inventory is complete. Treat this phase as done only once every category below has been checked — not just the obvious direct calls:

- **Direct calls/references** — every place the duplicated function is called or class instantiated. Search the whole repo, not just the folder where you found the duplicate.
- **Imports & re-exports** — anywhere it's imported, re-exported from a barrel/index file, or aliased under another name.
- **Tests** — unit, integration, and end-to-end tests exercising this logic, including tests that assert on the *old* duplicated behavior — those need updating, not just the source.
- **Indirect/dynamic references** — string-based dispatch, reflection, DI container registrations, config-driven wiring, event-listener registrations — anywhere the reference isn't a plain named function call your search tool can find.
- **Non-source references** — for a game: scene/prefab files, serialized asset references, editor-attached scripts. For a web app: templates, route tables, middleware chains, migration scripts, environment-driven feature flags.
- **Documentation/comments** pointing at the old location, so nothing references dead code after migration.

Record the inventory as a literal checklist (file path + line/reference), not a mental note — long refactors span multiple sessions, and the checklist is what survives between them. Use the tracking-document template below.

## Phase 5 — Build the migration plan with milestones

Turn the usage inventory into an ordered set of milestones, each small enough to verify and revert independently:

**Milestone 0 — Extract, don't migrate.** Create the new shared function/module with its own tests, covering the union of behaviors identified in Phase 3. Nothing else changes — old duplicated code keeps running untouched. Verify the new code in isolation before moving on.

**Milestones 1..N — Migrate one group of call sites at a time.** Group by risk or by feature/module boundary, not arbitrarily. For each milestone:
- List the exact call sites in scope, pulled straight from the Phase 4 inventory.
- Swap the call site to use the extracted version.
- Run the tests for that call site immediately — don't defer verification to the end.
- Where a call site has no existing test coverage, add a regression test *before* migrating it, so a behavior change would actually get caught.

**Final milestone — Remove the old duplicated code.** Only after every site from the Phase 4 inventory is migrated and verified. Re-run a repo-wide search for the old pattern first, to confirm nothing was missed before deleting anything.

Track each milestone's status explicitly (not-started / in-progress / verified) so partial progress survives across sessions.

## Phase 6 — Execute one milestone at a time

- Finish and verify one milestone completely before starting the next. Don't migrate call sites you haven't traced yet.
- After each milestone, run the full relevant test suite — not just tests for that call site. Extraction bugs often surface as regressions in unrelated code that depended on a subtle quirk of the duplicate you just replaced.
- Keep milestones as separate, revertible commits/changes, so a bad migration can be rolled back without losing the good ones.

## Phase 7 — Close out

- Confirm every item in the Phase 4 checklist is checked off.
- Re-scan the codebase for the original duplicated pattern to confirm no copy was missed.
- Summarize for the user: what was extracted, where it now lives, how many call sites were migrated, what tests were added, and — if applicable — what security-relevant inconsistency was fixed by consolidating.

## Tracking document

For anything beyond a trivial single-file duplication, produce a tracking file (e.g. `REFACTOR_PLAN.md`) so the work survives across sessions. Use this shape:

```markdown
# Refactor: <short description of the duplicated logic>

## Extraction target
- New location: <path>
- Signature: <function/class signature>
- Covers behavior from: <original copies, file:line>

## Usage inventory (Phase 4)
- [ ] path/to/fileA.ext:42 — direct call
- [ ] path/to/fileB.ext:17 — via re-export from index.ext
- [ ] path/to/test_fileA.ext — test asserting old behavior, needs update
- [ ] scenes/Level1.scene — attached script reference
...

## Milestones
- [x] Milestone 0 — extract + unit test the new shared version
- [ ] Milestone 1 — migrate <feature/group> (sites: fileA:42, fileB:17)
- [ ] Milestone 2 — migrate <feature/group> (sites: ...)
- [ ] Final — remove old duplicated code, re-scan for stragglers

## Notes / behavioral differences found between original copies
- ...
```

## Security-specific guidance

Treat duplication touching any of the following as high priority regardless of size:

- Authentication/authorization checks (who's allowed to do this)
- Input validation & sanitization (what's allowed in)
- Output encoding/escaping (what's allowed out)
- Cryptographic operations, secrets handling, token generation
- Rate limiting, quotas, or abuse-prevention logic
- Business-critical numeric rules (price, discount %, permission thresholds)

Read every existing copy in full before assuming they're equivalent. Inconsistent copies of security logic often exist *because* someone patched one copy after finding a bug and forgot the others. The extraction only counts as a real security improvement if the merged version adopts the strictest/most-correct behavior found across every copy — not just whichever copy happened to be first.

## Anti-patterns to avoid

- Extracting before finishing the usage trace ("I'll find the rest as I go") — this is exactly what causes breakage.
- One giant change that extracts and migrates everything at once — if something breaks, you can't isolate which part caused it.
- Merging two duplicates that only *look* similar without checking every parameter and edge case — read full bodies, not just signatures.
- Deleting old code before every traced usage is migrated and verified.
- Extracting to a location that violates the codebase's existing architecture or import rules just to save one function.
